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
          momentumState: cached.momentumState || 'holding',
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
        // Progressive return pattern — new signal
        progressionPattern: viewer.progressionPattern || 'single',
        progressionDetails: viewer.progressionDetails || {
          sessionDepths: [],
          stuckOnPages: [],
          deepestPageReached: 0,
        },
        // Momentum state — computed from all signals combined
        momentumState: (() => {
          const deadScore = viewer.deadDealScore || 0;
          const daysSince = viewer.daysSinceLastView || 0;
          const sessions = viewer.totalSessions || 1;
          const progression = viewer.progressionPattern || 'single';
          const completion = viewer.completionRate || 0;
          const bounced = viewer.bounced || false;

          // Stalled — no real engagement or dead deal
          if (bounced || deadScore >= 80 || (daysSince >= 14 && sessions <= 1)) {
            return 'stalled';
          }

          // Accelerating — progression building + recent activity
          if (
            progression === 'progressive' &&
            daysSince <= 3 &&
            sessions >= 2
          ) {
            return 'accelerating';
          }

          // Fading — engagement dropping or long silence after good start
          if (
            progression === 'falling' ||
            (daysSince >= 7 && completion >= 50) ||
            deadScore >= 50
          ) {
            return 'fading';
          }

          // Holding — active but not clearly accelerating or fading
          return 'holding';
        })(),
      };

      // ── Call Anthropic API ────────────────────────────────────
      let summary = '';
      let recommendation = '';
      let dealStatus: 'hot' | 'warm' | 'cold' | 'dead' = 'cold';

      // AI call placeholder — currently using smart fallback only
      // When Anthropic API key is available uncomment and add call here

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
             recommendation = `You have one move left here. Send a short message that acknowledges the gap without making them feel guilty about it. Something like — I wanted to check in one last time before I close this out on my end. If the timing is off or priorities have shifted that is completely understandable. Just let me know either way and I will follow up when it makes more sense. If there is no reply within three days close the file. Leave the door open with a brief value add every six weeks. Some deals are not dead, they are just waiting for an external trigger you cannot see from here.`;
          } else {
            summary = `${email} has shown multiple signals of disengagement. Despite opening the document, their reading pattern and subsequent silence suggest this deal is unlikely to progress without a significant change in approach.`;
            recommendation = `Do not send the same message again. If the proposal did not land the first time repeating it will not change that. Try a completely different angle — strip it down to one sentence describing the single most relevant thing your product does for their specific situation. Then ask one direct question. Something like — is solving this still a priority for you this quarter or should we pick this up at a better time. A direct question almost always gets a response even if the answer is not what you hoped for.`;
          }

        // ── BOUNCED — opened and left immediately ─────────────────
        } else if (signals.bounced) {
          dealStatus = 'cold';
          summary = `${email} opened the document but left almost immediately without reading it. This could mean the timing was wrong, the subject line did not match their expectations, or they were simply distracted when they opened it.`;
           recommendation = `Do not follow up today. Give it 48 hours then resend with one sentence of personal context before the link — something that makes it clear this is not a mass send and you chose to share this with them specifically. Do not ask if they saw the last one. Just send it fresh as if it is the first time.`;

         
       // ── HOT — progressive reader + multiple sessions ──────────
        } else if (signals.progressionPattern === 'progressive' && hasMultipleSessions && recentlyActive) {
          dealStatus = 'hot';
          const depths = signals.progressionDetails.sessionDepths;
          const depthNote = depths.length >= 2
            ? ` Each time they return they read deeper into the document — from page ${depths[0]} in their first visit to page ${depths[depths.length - 1]} most recently.`
            : '';
          summary = `${email} has returned to this document ${signals.uniqueSessions} times and is progressing further through it with each visit.${depthNote} This pattern of deepening engagement across sessions is one of the strongest buying signals a proposal can generate.`;
           recommendation = `Reach out today while their momentum is building. Do not open with did you get a chance to review it. They clearly did. Instead reference something specific — you noticed they have been spending time with the document and wanted to see if anything raised questions. Then ask directly whether there is anyone else on their side who should be part of the conversation. That question surfaces the internal stakeholders before they surface on their own.`;

        // ── WARM/NEEDS HELP — stuck reader ────────────────────────
        } else if (signals.progressionPattern === 'stuck' && hasMultipleSessions) {
          dealStatus = 'warm';
          const stuckPages = signals.progressionDetails.stuckOnPages;
          const stuckNote = stuckPages.length > 0
            ? ` They keep returning to page${stuckPages.length > 1 ? 's' : ''} ${stuckPages.join(' and ')} without moving past that section.`
            : '';
          summary = `${email} has opened this document ${signals.uniqueSessions} times but keeps returning to the same section each visit without progressing further.${stuckNote} This pattern almost always means something on those pages is raising a question or objection they cannot resolve on their own.`;
           recommendation = `Do not send a check in. They are stuck on something specific and a vague follow up will not unstick them. Reach out and offer to walk them through that section directly — a ten minute call or even a short voice note explaining it in plain language. The blocker is almost always something that feels too small to ask about. Making it easy for them to ask is what moves this forward.`;

        // ── COLD — falling engagement ─────────────────────────────
        } else if (signals.progressionPattern === 'falling' && hasMultipleSessions) {
          dealStatus = 'cold';
          const depths = signals.progressionDetails.sessionDepths;
          const fallingNote = depths.length >= 2
            ? ` Their first visit reached page ${depths[0]} but their most recent visit only reached page ${depths[depths.length - 1]}.`
            : '';
          summary = `${email} has returned to this document multiple times but is reading less of it with each visit.${fallingNote} Declining depth across sessions is a clear signal that initial interest is fading and without a new angle this deal is likely to go cold.`;
           recommendation = `Something shifted between their first visit and now. Do not follow up with the same framing. Either find a completely different angle that speaks to something you know about their situation, or send one honest message — I noticed you have been back to this a few times and wanted to check in. Has something changed on your end or is timing the issue. If there is no reply park this deal for 30 days and set a reminder. Some deals go quiet because of internal changes you cannot see from here. They are not always dead.`;

        // ── HOT — re-reads + multiple sessions + recent ───────────
        } else if (topReRead && hasMultipleSessions && recentlyActive) {
          dealStatus = 'hot';
          const videoNote = topVideo
            ? ` They also replayed the video on page ${topVideo.page} ${topVideo.count} time${topVideo.count > 1 ? 's' : ''}, which points to a specific area they want to understand more deeply.`
            : '';
          summary = `${email} has returned to this document ${signals.uniqueSessions} times and keeps coming back to page ${topReRead.page}, reviewing it ${topReRead.count} times across their sessions.${videoNote} This level of repeated engagement is a strong signal that they are actively evaluating and likely building an internal case.`;
          recommendation = `Follow up today. Do not lead with the document. Lead with a question about their situation — something like I wanted to check in and see if anything had come up since you had a chance to go through this. Then ask directly whether there is anyone else involved in the decision. If they have been reviewing this repeatedly they are either genuinely considering it or stuck on something they have not mentioned yet. Either way a direct question moves things forward faster than waiting.`;

        // ── HOT — new viewers from same company ───────────────────
        } else if (hasNewViewers) {
          dealStatus = 'hot';
          summary = `${email} has shared this document internally. ${signals.newViewersFromSameCompany} additional ${signals.newViewersFromSameCompany === 1 ? 'person' : 'people'} from the same organisation have now opened it, which strongly suggests the evaluation has moved beyond your initial contact and is being reviewed at a higher level.`;
           recommendation = `Contact your original prospect today. Do not mention that you can see the document has been shared internally. Just reach out naturally and ask whether there is anyone else on their side who should be involved in the conversation. That question signals that you understand how buying decisions actually work inside organisations and it gives them an easy way to loop in the people who are already looking at your proposal without making it awkward.`;

        // ── HOT — re-reads but no multiple sessions ───────────────
        } else if (topReRead && recentlyActive) {
          dealStatus = 'hot';
          summary = `${email} spent time reading this document and returned specifically to page ${topReRead.page} more than once.${timeStr ? ` They invested ${timeStr} in total reading it.` : ''} Returning to a specific page almost always signals either serious consideration or a question that page raises for them.`;
           recommendation = `Follow up today. Keep it short. Tell them you wanted to check in and see if anything stood out or raised questions when they went through it. Then offer to walk them through any part of it directly — a quick call or even a written explanation if a call does not suit them. The offer to clarify removes the barrier that stops most people from replying.`;

        // ── HOT — video replays ───────────────────────────────────
        } else if (topVideo && topVideo.count >= 2) {
          dealStatus = 'hot';
          summary = `${email} replayed the video on page ${topVideo.page} ${topVideo.count} times.${timeStr ? ` They spent ${timeStr} with the document overall.` : ''} Replaying a video is one of the clearest signals that something on that page either resonated strongly or raised a question they are trying to resolve.`;
           recommendation = `Follow up and mention that you are happy to go deeper on anything in the document. Do not specifically call out that you saw them watch the video multiple times. Just make it easy for them to ask the question they clearly have. Something like — wanted to check in and see if anything in the walkthrough raised questions I can help clarify. Short, direct, and gives them a reason to reply without feeling watched.`;

        // ── WARM — multiple sessions, strong read ─────────────────
        } else if (hasMultipleSessions && strongRead) {
          dealStatus = 'warm';
          summary = `${email} has come back to this document ${signals.uniqueSessions} times and has read through ${Math.round(signals.completionRate)}% of it.${timeStr ? ` Their total reading time across all visits is ${timeStr}.` : ''} This pattern of returning and reading thoroughly suggests they are genuinely considering it, likely alongside other options.`;
           recommendation = `Send a follow up that moves the conversation forward rather than asking if they read it. They have. Ask one specific question about their timeline or situation — something like are you looking to have something in place before the end of the quarter or is this more of a longer evaluation. A question about timing gets you real information. A question about whether they saw the document gets you nothing.`;

        // ── WARM — single strong session ─────────────────────────
        } else if (strongRead && recentlyActive) {
          dealStatus = 'warm';
          const skippedNote = skippedCount > 0
            ? ` They did skip ${skippedCount} page${skippedCount > 1 ? 's' : ''}, which may be worth noting in your follow up.`
            : '';
          summary = `${email} read through ${Math.round(signals.completionRate)}% of this document in a single focused session.${timeStr ? ` They spent ${timeStr} reading it.` : ''}${skippedNote} A thorough first read is a positive signal that the document captured their attention.`;
          recommendation = `Follow up within 48 hours while the document is still fresh. Do not ask if they had a chance to look at it. Send a short value add instead — a relevant case study, a one line answer to a likely objection, or a specific insight about their industry. Then wait five business days. If there is still no reply send one direct question — is this still a priority for you right now or should we pick this up at a better time. That question almost always gets a response.`;

        // ── WARM — going silent after good engagement ─────────────
        } else if (goingSilent && signals.totalViews >= 2) {
          dealStatus = 'warm';
          summary = `${email} engaged well with this document ${signals.daysSinceLastView} days ago but has not returned since. Their initial engagement was genuine but the silence since then suggests they may be waiting for something internally, comparing options, or simply got busy.`;
           recommendation = `Send one short message today. Do not reference the silence or ask if they are still interested. Just add a piece of value — a relevant case study, a specific insight, or a one line answer to an objection they probably have. Then end with one direct question about timing. Something like — still the right time to be looking at this or would it make more sense to revisit in a month. Easy to answer, impossible to ignore entirely.`;

        // ── COLD — partial read, no return ───────────────────────
        } else if (partialRead) {
          dealStatus = 'cold';
          summary = `${email} opened this document and read approximately ${Math.round(signals.completionRate)}% of it before stopping.${timeStr ? ` They spent ${timeStr} with it.` : ''} They did not return after their initial visit. Dropping off partway through often means something in the document did not connect or their attention was pulled away.`;
           recommendation = `Do not resend the full document. Pull out the single most relevant section for their situation and share just that. One paragraph or one page maximum. Tell them this is the part most relevant to where they are right now and ask if it addresses what they were looking for. Removing the commitment of reading the whole thing again is often what gets a reply.`;

        // ── COLD — opened but minimal reading ────────────────────
        } else if (signals.totalViews >= 1 && signals.totalTimeSeconds > 30) {
          dealStatus = 'cold';
          summary = `${email} opened this document${timeStr ? ` and spent ${timeStr} with it` : ''} but their engagement was limited.${signals.daysSinceLastView > 0 ? ` It has been ${signals.daysSinceLastView} day${signals.daysSinceLastView > 1 ? 's' : ''} since they last opened it.` : ''} Low engagement on a first read does not necessarily mean no interest but it does mean the document alone has not yet made a strong case.`;
           recommendation = `Do not follow up about the document at all. Instead ask a question about their current situation that has nothing to do with whether they read it. Something about a challenge they are likely facing right now or a change in their industry. If the conversation restarts on fresh ground you can reintroduce the proposal naturally. Leading with the document again signals that you have nothing new to offer.`;

        // ── DEFAULT ───────────────────────────────────────────────
        } else {
          dealStatus = 'cold';
          summary = `${email} has received this document.${signals.totalViews > 0 ? ` They have opened it ${signals.totalViews} time${signals.totalViews > 1 ? 's' : ''}.` : ' There has been no engagement yet.'} ${signals.daysSinceLastView > 0 ? `It has been ${signals.daysSinceLastView} day${signals.daysSinceLastView > 1 ? 's' : ''} since any activity.` : ''}`.trim();
         recommendation = signals.totalViews === 0
  ? `They have not opened it yet. Before resending add one sentence of personal context that makes it clear why this is relevant to their specific situation right now. A personalised reason to open is worth more than any subject line tweak.`
  : `Send a short note today. Do not ask if they had a chance to look at it. Instead add a small piece of value — one relevant insight or a direct answer to a likely question. Then end with one easy question about their timeline. That combination almost always gets a reply even from people who were not planning to respond.`;
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
            momentumState: signals.momentumState || 'holding',
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
        momentumState: signals.momentumState || 'holding',
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