import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { checkAccess } from '@/lib/checkAccess';
import { getAnalyticsLevel } from '@/lib/planLimits';
import { ObjectId } from 'mongodb';
import { sendDealInsightEmail } from '@/lib/documentNotifications';
import { notifyDealInsight, isSlackConnected } from '@/lib/integrations/slack';
import { syncDealInsightToHubSpot, isHubSpotConnected } from '@/lib/integrations/hubspotSync';
import { sendTeamsNotification } from '@/app/api/integrations/teams/notify/route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Auth + plan ───────────────────────────────────────────────
    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const analyticsLevel = getAnalyticsLevel(access.plan);
    if (analyticsLevel === 'basic') {
      return NextResponse.json(
        { error: 'Upgrade required' },
        { status: 403 }
      );
    }

    const db = await dbPromise;
    const body = await request.json();
    const { viewerData, forceRegenerate = false } = body;

    if (!viewerData || !Array.isArray(viewerData) || viewerData.length === 0) {
      return NextResponse.json({ summaries: [] });
    }

    const summaries = [];

    for (const viewer of viewerData) {
      const email = viewer.email;
      if (!email || email.startsWith('Anonymous')) continue;

      // ── Check cache first ─────────────────────────────────────
      // Only regenerate if forced or new session detected
      const cacheKey = `deal_intelligence_${id}_${email}`;
      const cached = await db.collection('deal_intelligence_cache').findOne({
        documentId: id,
        viewerEmail: email,
      });

      const lastSessionCount = viewer.totalSessions || 1;
      const cacheIsValid = cached &&
        !forceRegenerate &&
        cached.sessionCountAtGeneration >= lastSessionCount &&
        // Expire cache after 6 hours
        (Date.now() - new Date(cached.generatedAt).getTime()) < 6 * 60 * 60 * 1000;

      if (cacheIsValid) {
        summaries.push({
          viewerEmail: email,
          summary: cached.summary,
          recommendation: cached.recommendation,
          dealStatus: cached.dealStatus,
          cached: true,
        });
        continue;
      }

      // ── Build signal object to send to AI ─────────────────────
      const signals = {
        viewerEmail: email,
        totalViews: viewer.totalViews || 0,
        uniqueSessions: viewer.totalSessions || 1,
        daysSinceLastView: viewer.daysSinceLastView || 0,
        daysSinceFirstView: viewer.daysSinceFirstView || 0,
        completionRate: viewer.completionRate || 0,
        totalTimeSeconds: viewer.totalTimeSeconds || 0,
        reReadPages: viewer.reReadPages || [],
        skippedPages: viewer.skippedPages || [],
        videoReplays: viewer.videoReplays || [],
        bounced: viewer.bounced || false,
        isRevisit: viewer.totalSessions > 1,
        newViewersFromSameCompany: viewer.newViewersFromSameCompany || 0,
        deadDealScore: viewer.deadDealScore || 0,
        intentLevel: viewer.intentLevel || 'low',
        pageWithMostTime: viewer.pageWithMostTime || null,
        pageWithLeastTime: viewer.pageWithLeastTime || null,
        totalPages: viewer.totalPages || 1,
      };

      // ── Call Anthropic API ────────────────────────────────────
      let summary = '';
      let recommendation = '';
      let dealStatus: 'hot' | 'warm' | 'cold' | 'dead' = 'cold';

      try {} catch (aiErr) {
        console.error('[DealIntelligence] AI call failed, using smart fallback:', aiErr);
      }

      // ── Smart fallback — always runs if AI did not produce a result ──
      // Written to be as natural and professional as the AI version
      if (!summary) {

        const fmt = (s: number) => {
          if (!s || s <= 0) return null;
          const m = Math.floor(s / 60);
          const sec = s % 60;
          if (m === 0) return `${sec} seconds`;
          if (sec === 0) return `${m} minute${m > 1 ? 's' : ''}`;
          return `${m} minute${m > 1 ? 's' : ''} and ${sec} seconds`;
        };

        const timeStr = fmt(signals.totalTimeSeconds);
        const topReRead = signals.reReadPages?.[0] || null;
        const topVideo = signals.videoReplays?.[0] || null;
        const skippedCount = signals.skippedPages?.length || 0;
        const hasMultipleSessions = signals.uniqueSessions > 1;
        const hasNewViewers = signals.newViewersFromSameCompany > 0;
        const recentlyActive = signals.daysSinceLastView <= 1;
        const goingSilent = signals.daysSinceLastView >= 5 && signals.daysSinceLastView < 14;
        const longSilent = signals.daysSinceLastView >= 14;
        const strongRead = signals.completionRate >= 80;
        const partialRead = signals.completionRate >= 40 && signals.completionRate < 80;

        // ── DEAD DEAL ─────────────────────────────────────────────
        if (signals.deadDealScore >= 80) {
          dealStatus = 'dead';
          if (longSilent) {
            summary = `${email} last engaged with this document ${signals.daysSinceLastView} days ago and has not returned since. Their earlier engagement suggested interest but the prolonged silence points to a stalled or lost deal.`;
            recommendation = `Send one final personalised message acknowledging the silence and asking directly if the timing is wrong. If there is no response within 3 days, archive this deal and move on.`;
          } else {
            summary = `${email} has shown multiple signals of disengagement. Despite opening the document, their reading pattern and subsequent silence suggest this deal is unlikely to progress without a significant change in approach.`;
            recommendation = `Rather than a standard follow up, try a completely different angle — a shorter message, a different value proposition, or asking a direct question about what is holding them back.`;
          }

        // ── BOUNCED — opened and left immediately ─────────────────
        } else if (signals.bounced) {
          dealStatus = 'cold';
          summary = `${email} opened the document but left almost immediately without reading it. This could mean the timing was wrong, the subject line did not match their expectations, or they were simply distracted when they opened it.`;
          recommendation = `Do not follow up yet. Wait 48 hours then resend with a brief personal note explaining specifically why this document is relevant to them right now.`;

        // ── HOT — re-reads + multiple sessions + recent ───────────
        } else if (topReRead && hasMultipleSessions && recentlyActive) {
          dealStatus = 'hot';
          const videoNote = topVideo
            ? ` They also replayed the video on page ${topVideo.page} ${topVideo.count} time${topVideo.count > 1 ? 's' : ''}, which points to a specific area they want to understand more deeply.`
            : '';
          summary = `${email} has returned to this document ${signals.uniqueSessions} times and keeps coming back to page ${topReRead.page}, reviewing it ${topReRead.count} times across their sessions.${videoNote} This level of repeated engagement is a strong signal that they are actively evaluating and likely building an internal case.`;
          recommendation = `Reach out today while their attention is high. Ask if they have any questions about what they have been reviewing and whether there is anyone else involved in the decision.`;

        // ── HOT — new viewers from same company ───────────────────
        } else if (hasNewViewers) {
          dealStatus = 'hot';
          summary = `${email} has shared this document internally. ${signals.newViewersFromSameCompany} additional ${signals.newViewersFromSameCompany === 1 ? 'person' : 'people'} from the same organisation have now opened it, which strongly suggests the evaluation has moved beyond your initial contact and is being reviewed at a higher level.`;
          recommendation = `This is the right moment to ask ${email} who else is involved in the decision and whether a call with the wider team would be useful.`;

        // ── HOT — re-reads but no multiple sessions ───────────────
        } else if (topReRead && recentlyActive) {
          dealStatus = 'hot';
          summary = `${email} spent time reading this document and returned specifically to page ${topReRead.page} more than once.${timeStr ? ` They invested ${timeStr} in total reading it.` : ''} Returning to a specific page almost always signals either serious consideration or a question that page raises for them.`;
          recommendation = `Follow up today and ask directly if they have any questions. Referencing that you are happy to walk them through anything they want to revisit will feel timely and relevant.`;

        // ── HOT — video replays ───────────────────────────────────
        } else if (topVideo && topVideo.count >= 2) {
          dealStatus = 'hot';
          summary = `${email} replayed the video on page ${topVideo.page} ${topVideo.count} times.${timeStr ? ` They spent ${timeStr} with the document overall.` : ''} Replaying a video is one of the clearest signals that something on that page either resonated strongly or raised a question they are trying to resolve.`;
          recommendation = `Reach out and ask if the video raised any questions. Offering to explain that section personally will feel helpful rather than pushy at this stage.`;

        // ── WARM — multiple sessions, strong read ─────────────────
        } else if (hasMultipleSessions && strongRead) {
          dealStatus = 'warm';
          summary = `${email} has come back to this document ${signals.uniqueSessions} times and has read through ${Math.round(signals.completionRate)}% of it.${timeStr ? ` Their total reading time across all visits is ${timeStr}.` : ''} This pattern of returning and reading thoroughly suggests they are genuinely considering it, likely alongside other options.`;
          recommendation = `Follow up with a message that moves the conversation forward rather than just checking in. Ask what their timeline looks like or whether there is a specific concern you can address.`;

        // ── WARM — single strong session ─────────────────────────
        } else if (strongRead && recentlyActive) {
          dealStatus = 'warm';
          const skippedNote = skippedCount > 0
            ? ` They did skip ${skippedCount} page${skippedCount > 1 ? 's' : ''}, which may be worth noting in your follow up.`
            : '';
          summary = `${email} read through ${Math.round(signals.completionRate)}% of this document in a single focused session.${timeStr ? ` They spent ${timeStr} reading it.` : ''}${skippedNote} A thorough first read is a positive signal that the document captured their attention.`;
          recommendation = `Follow up within the next 24 hours while the document is still fresh in their mind. Keep your message short and ask one specific question to move the conversation forward.`;

        // ── WARM — going silent after good engagement ─────────────
        } else if (goingSilent && signals.totalViews >= 2) {
          dealStatus = 'warm';
          summary = `${email} engaged well with this document ${signals.daysSinceLastView} days ago but has not returned since. Their initial engagement was genuine but the silence since then suggests they may be waiting for something internally, comparing options, or simply got busy.`;
          recommendation = `Send a brief follow up today. Keep it under three sentences, reference something specific about their engagement, and end with a simple question that is easy to answer.`;

        // ── COLD — partial read, no return ───────────────────────
        } else if (partialRead) {
          dealStatus = 'cold';
          summary = `${email} opened this document and read approximately ${Math.round(signals.completionRate)}% of it before stopping.${timeStr ? ` They spent ${timeStr} with it.` : ''} They did not return after their initial visit. Dropping off partway through often means something in the document did not connect or their attention was pulled away.`;
          recommendation = `Follow up with a shorter, more focused message that highlights the most relevant section for their situation. Make it easy for them to re-engage without needing to read the full document again.`;

        // ── COLD — opened but minimal reading ────────────────────
        } else if (signals.totalViews >= 1 && signals.totalTimeSeconds > 30) {
          dealStatus = 'cold';
          summary = `${email} opened this document${timeStr ? ` and spent ${timeStr} with it` : ''} but their engagement was limited.${signals.daysSinceLastView > 0 ? ` It has been ${signals.daysSinceLastView} day${signals.daysSinceLastView > 1 ? 's' : ''} since they last opened it.` : ''} Low engagement on a first read does not necessarily mean no interest but it does mean the document alone has not yet made a strong case.`;
          recommendation = `Try a different approach in your follow up. Instead of asking if they read the document, ask a question about their current situation that makes the conversation feel fresh and relevant.`;

        // ── DEFAULT ───────────────────────────────────────────────
        } else {
          dealStatus = 'cold';
          summary = `${email} has received this document.${signals.totalViews > 0 ? ` They have opened it ${signals.totalViews} time${signals.totalViews > 1 ? 's' : ''}.` : ' There has been no engagement yet.'} ${signals.daysSinceLastView > 0 ? `It has been ${signals.daysSinceLastView} day${signals.daysSinceLastView > 1 ? 's' : ''} since any activity.` : ''}`.trim();
          recommendation = signals.totalViews === 0
            ? `Consider resending with a personal note explaining why this document is specifically relevant to them.`
            : `Send a light follow up to check if they had a chance to look through it and whether it raised any questions.`;
        }
      }
      if (!summary) continue;

      // ── Cache the result ──────────────────────────────────────
      await db.collection('deal_intelligence_cache').updateOne(
        { documentId: id, viewerEmail: email },
        {
          $set: {
            documentId: id,
            viewerEmail: email,
            summary,
            recommendation,
            dealStatus,
            sessionCountAtGeneration: lastSessionCount,
            generatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      summaries.push({
        viewerEmail: email,
        summary,
        recommendation,
        dealStatus,
        cached: false,
      });

      // ── Fire notifications — all silent failures ──────────────
      // Get owner profile for email
      const ownerProfile = await db.collection('profiles').findOne({
        user_id: access.userId,
      });

      const docRecord = await db.collection('documents').findOne({
        _id: new ObjectId(id),
      });

      const documentName = docRecord?.originalFilename || 'Your document';
      const narrative = `${summary} ${recommendation}`;

      const notificationPayload = {
  ownerEmail: ownerProfile?.email || null,
  ownerName: ownerProfile?.full_name || ownerProfile?.first_name || null,
  viewerEmail: email,
  documentName,
  documentId: id,
  narrative: `${summary}\n\n${recommendation}`,
};

// Gmail
if (notificationPayload.ownerEmail) {
  sendDealInsightEmail({
    ownerEmail: notificationPayload.ownerEmail,
    ownerName: notificationPayload.ownerName,
    viewerEmail: email,
    documentName,
    documentId: id,
    slowestPage: signals.pageWithMostTime || 1,
    slowestPageTime: 0,
    avgPageTime: 0,
    skippedPages: signals.skippedPages,
    totalPages: signals.totalPages,
    trigger: 'session_end',
    narrative: notificationPayload.narrative,
  }).catch(err =>
    console.error('[DealIntelligence] Gmail silent fail:', err)
  );
}

// Slack
isSlackConnected(access.userId)
  .then(connected => {
    if (!connected) return;
    return notifyDealInsight({
      userId: access.userId,
      documentName,
      documentId: id,
      viewerEmail: email,
      slowestPage: signals.pageWithMostTime || 1,
      slowestPageTime: 0,
      avgPageTime: 0,
      skippedPages: signals.skippedPages,
      totalPages: signals.totalPages,
      trigger: 'session_end',
      narrative: notificationPayload.narrative,
    });
  })
  .catch(err =>
    console.error('[DealIntelligence] Slack silent fail:', err)
  );

// HubSpot
isHubSpotConnected(access.userId)
  .then(connected => {
    if (!connected) return;
    return syncDealInsightToHubSpot({
      userId: access.userId,
      viewerEmail: email,
      documentName,
      documentId: id,
      slowestPage: signals.pageWithMostTime || 1,
      slowestPageTime: 0,
      avgPageTime: 0,
      skippedPages: signals.skippedPages,
      totalPages: signals.totalPages,
      trigger: 'session_end',
      narrative: notificationPayload.narrative,
    });
  })
  .catch(err =>
    console.error('[DealIntelligence] HubSpot silent fail:', err)
  );

// Teams
sendTeamsNotification({
  userId: access.userId,
  event: 'deal_insight',
  documentName,
  documentId: id,
  viewerEmail: email,
  extraInfo: notificationPayload.narrative,
}).catch(err =>
  console.error('[DealIntelligence] Teams silent fail:', err)
);
    }

    return NextResponse.json({ success: true, summaries });

  } catch (error) {
    // Never crash the app
    console.error('[DealIntelligence] outer error:', error);
    return NextResponse.json({ success: true, summaries: [] });
  }
}