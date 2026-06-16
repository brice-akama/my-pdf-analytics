//app/api/documents/[id]/deal-intelligence/route.ts

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

  // ── Minimum engagement threshold ─────────────────────────────
  // Ashley insight: if the narrative is not clear from the data
  // the data is not ready for insight extraction.
  // Under 60 seconds with one session and no return = noise not signal.
  const meetsThreshold =
    (viewer.totalTimeSeconds || 0) >= 60 ||
    (viewer.totalSessions || 1) >= 2 ||
    (viewer.reReadPages || []).length > 0 ||
    (viewer.newViewersFromSameCompany || 0) > 0;

  if (!meetsThreshold) {
    // Still include in summaries so frontend knows viewer exists
    // but mark as insufficient data — no recommendation generated
    summaries.push({
      viewerEmail: email,
      summary: `${email} opened this document briefly. Engagement time is under 60 seconds with a single session. Insufficient data to generate a reliable signal.`,
      recommendation: null,
      dealStatus: 'cold',
      momentumState: 'stalled',
      insufficientData: true,
      cached: false,
    });
    continue;
  }

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
             recommendation = `Signal detected (low confidence): ${signals.daysSinceLastView} days of silence after earlier engagement. This pattern often indicates a stalled deal but external factors you cannot see may also explain the silence. If you decide to act, a short message acknowledging the gap without guilt tends to perform better than another pitch. Whether to send it or archive the deal is your call based on the broader relationship context.`;
          } else {
            summary = `${email} has shown patterns that can indicate disengagement — limited 
reading depth and silence after the initial open. This pattern sometimes reflects 
a lost deal, but it can equally reflect poor timing or a busy period on their side. 
The data alone cannot distinguish between these.`;
            recommendation = `Signal detected (low confidence): Multiple disengagement signals detected. The data suggests this deal may need a different approach if you choose to pursue it. A completely different angle rather than repeating the same message is generally more effective at this stage. Only you know whether the relationship warrants another attempt.`;
          }

        // ── BOUNCED — opened and left immediately ─────────────────
        } else if (signals.bounced) {
          dealStatus = 'cold';
          summary = `${email} opened the document but left almost immediately without reading it. This could mean the timing was wrong, the subject line did not match their expectations, or they were simply distracted when they opened it.`;
           recommendation = `Signal detected (low confidence): Document opened but closed almost immediately. This may indicate poor timing, distraction, or a mismatch between the subject and their expectations. Waiting 48 hours before any follow up is generally advisable. Adding personal context about why this is relevant to their specific situation tends to improve re-engagement.`;

         
       // ── HOT — progressive reader + multiple sessions ──────────
        } else if (signals.progressionPattern === 'progressive' && hasMultipleSessions && recentlyActive) {
          dealStatus = 'hot';
          const depths = signals.progressionDetails.sessionDepths;
          const depthNote = depths.length >= 2
            ? ` Each time they return they read deeper into the document — from page ${depths[0]} in their first visit to page ${depths[depths.length - 1]} most recently.`
            : '';
          summary = `${email} has returned to this document ${signals.uniqueSessions} times and is progressing further through it with each visit.${depthNote} This pattern of deepening engagement across sessions is one of the strongest buying signals a proposal can generate.`;
          recommendation = `Signal detected (high confidence): Progressive deepening engagement across multiple sessions is one of the stronger buying signals in document analytics. A contextual follow up referencing something specific in the document tends to perform well at this stage. Asking whether others on their side should be involved is worth considering given the engagement pattern.`;

        // ── WARM/NEEDS HELP — stuck reader ────────────────────────
       } else if (signals.progressionPattern === 'stuck' && hasMultipleSessions) {
  dealStatus = 'warm';
  const stuckPages = signals.progressionDetails.stuckOnPages;
  const stuckNote = stuckPages.length > 0
    ? ` They keep returning to page${stuckPages.length > 1 ? 's' : ''} ${stuckPages.join(' and ')} without moving past that section.`
    : '';
  const sessionWordStuck = signals.uniqueSessions === 2
    ? 'twice'
    : `${signals.uniqueSessions} times`;
  summary = `${email} has opened this document ${sessionWordStuck} but keeps returning to the same section each visit without progressing further.${stuckNote} This pattern almost always means something on those pages is raising a question or objection they cannot resolve on their own.`;
           recommendation = `Signal detected (medium confidence): Repeated returns to the same section without progressing often indicates an unresolved question or objection on those pages. Offering to clarify that specific section directly rather than sending a generic check in tends to be more effective. A short call or written explanation both work depending on your relationship with this prospect.`;

        // ── COLD — falling engagement ─────────────────────────────
       } else if (signals.progressionPattern === 'falling' && hasMultipleSessions) {
  dealStatus = 'cold';
  const depths = signals.progressionDetails.sessionDepths;
  const fallingNote = depths.length >= 2
    ? ` Their first visit reached page ${depths[0]} but their most recent visit only reached page ${depths[depths.length - 1]}.`
    : '';
  const sessionWord = signals.uniqueSessions === 2
    ? 'twice'
    : `${signals.uniqueSessions} times`;
  summary = `${email} has returned to this document ${sessionWord} but is reading less of it with each visit.${fallingNote} Reading depth has decreased across their sessions — they are reaching fewer pages each time they return. This pattern can indicate fading interest but can also reflect time pressure or distraction. Whether to act on it and how is your judgment call based on the broader relationship.`;
          recommendation = `Signal detected (medium confidence): Declining reading depth across sessions suggests initial interest may be fading. This pattern sometimes indicates internal changes at the prospect's organisation rather than loss of interest. A different angle or a direct question about whether priorities have shifted tends to work better than repeating the original message. Your knowledge of the broader situation should guide whether to act now or wait.`;

        // ── HOT — re-reads + multiple sessions + recent ───────────
        } else if (topReRead && hasMultipleSessions && recentlyActive) {
          dealStatus = 'hot';
          const videoNote = topVideo
            ? ` They also replayed the video on page ${topVideo.page} ${topVideo.count} time${topVideo.count > 1 ? 's' : ''}, which points to a specific area they want to understand more deeply.`
            : '';
          summary = `${email} has returned to this document ${signals.uniqueSessions} times and keeps coming back to page ${topReRead.page}, reviewing it ${topReRead.count} times across their sessions.${videoNote} This level of repeated engagement is a strong signal that they are actively evaluating and likely building an internal case.`;
         recommendation = `Signal detected (high confidence): Repeated engagement with specific pages across multiple recent sessions is a strong indicator of active evaluation. Leading with a question about their situation rather than the document itself tends to get better responses at this stage. Asking whether others are involved in the decision is worth considering given the engagement depth.`;

        // ── HOT — new viewers from same company ───────────────────
        } else if (hasNewViewers) {
          dealStatus = 'hot';
          summary = `${email} has shared this document internally. ${signals.newViewersFromSameCompany} additional ${signals.newViewersFromSameCompany === 1 ? 'person' : 'people'} from the same organisation have now opened it, which strongly suggests the evaluation has moved beyond your initial contact and is being reviewed at a higher level.`;
           recommendation = `Signal detected (high confidence): Additional viewers from the same organisation suggest internal sharing has occurred. This is typically a positive buying signal indicating your champion is building an internal case. Asking naturally whether others should be involved in the conversation tends to work well here. Avoid mentioning that you can see the sharing activity directly.`;

        // ── HOT — re-reads but no multiple sessions ───────────────
        } else if (topReRead && recentlyActive) {
          dealStatus = 'hot';
          summary = `${email} spent time reading this document and returned specifically to page ${topReRead.page} more than once.${timeStr ? ` They invested ${timeStr} in total reading it.` : ''} Returning to a specific page almost always signals either serious consideration or a question that page raises for them.`;
           recommendation = `Signal detected (medium confidence): Return visits to a specific page suggest either genuine consideration or an unresolved question. A short follow up offering to clarify anything in the document tends to lower the barrier for prospects who have questions but have not asked them yet. Timing and tone are your judgment call.`;

        // ── HOT — video replays ───────────────────────────────────
        } else if (topVideo && topVideo.count >= 2) {
          dealStatus = 'hot';
          summary = `${email} replayed the video on page ${topVideo.page} ${topVideo.count} times.${timeStr ? ` They spent ${timeStr} with the document overall.` : ''} Replaying a video is one of the clearest signals that something on that page either resonated strongly or raised a question they are trying to resolve.`;
           recommendation = `Signal detected (medium confidence): Multiple video replays on the same page suggest strong interest in that specific content or an unresolved question. Making it easy for the prospect to ask about that section tends to work better than a generic follow up. Avoid referencing that you can see the replay activity directly.`;

        // ── WARM — multiple sessions, strong read ─────────────────
        } else if (hasMultipleSessions && strongRead) {
          dealStatus = 'warm';
          summary = `${email} has come back to this document ${signals.uniqueSessions} times and has read through ${Math.round(signals.completionRate)}% of it.${timeStr ? ` Their total reading time across all visits is ${timeStr}.` : ''} This pattern of returning and reading thoroughly suggests they are genuinely considering it, likely alongside other options.`;
           recommendation = `Signal detected (medium confidence): Multiple return visits combined with high completion rate suggests genuine evaluation is underway. A follow up focused on their timeline rather than the document itself tends to surface more useful information at this stage. The data indicates they have read it so asking if they did is unlikely to add value.`;

        // ── WARM — single strong session ─────────────────────────
        } else if (strongRead && recentlyActive) {
          dealStatus = 'warm';
          const skippedNote = skippedCount > 0
            ? ` They did skip ${skippedCount} page${skippedCount > 1 ? 's' : ''}, which may be worth noting in your follow up.`
            : '';
          summary = `${email} read through ${Math.round(signals.completionRate)}% of this document in a single focused session.${timeStr ? ` They spent ${timeStr} reading it.` : ''}${skippedNote} A thorough first read is a positive signal that the document captured their attention.`;
          recommendation = `Signal detected (medium confidence): Strong single session engagement with high completion. Engagement is increasing from first contact. A value-add follow up within 48 hours tends to build on this momentum better than asking if they read it. Your judgment on timing and what value to add is what matters most here.`;

        // ── WARM — going silent after good engagement ─────────────
        } else if (goingSilent && signals.totalViews >= 2) {
          dealStatus = 'warm';
          summary = `${email} engaged well with this document ${signals.daysSinceLastView} days ago but has not returned since. Their initial engagement was genuine but the silence since then suggests they may be waiting for something internally, comparing options, or simply got busy.`;
           recommendation = `Signal detected (medium confidence): Good initial engagement followed by silence. This pattern may indicate internal review, competing priorities, or a timing issue rather than loss of interest. A value-add message followed by a direct timing question tends to work better than referencing the silence. Whether to act now or wait is your call.`;

        // ── COLD — partial read, no return ───────────────────────
        } else if (partialRead) {
          dealStatus = 'cold';
          summary = `${email} opened this document and read approximately ${Math.round(signals.completionRate)}% of it before stopping.${timeStr ? ` They spent ${timeStr} with it.` : ''} They did not return after their initial visit. Dropping off partway through often means something in the document did not connect or their attention was pulled away.`;
           recommendation = `Signal detected (low confidence): Partial read with no return visit. Dropping off partway through may indicate a content mismatch, distraction, or timing issue. Sharing only the most relevant section rather than the full document again tends to lower the re-engagement barrier. Whether this deal is worth the effort is your judgment based on the broader context.`;

        // ── COLD — opened but minimal reading ────────────────────
        } else if (signals.totalViews >= 1 && signals.totalTimeSeconds > 30) {
          dealStatus = 'cold';
          summary = `${email} opened this document${timeStr ? ` and spent ${timeStr} with it` : ''} but their engagement was limited.${signals.daysSinceLastView > 0 ? ` It has been ${signals.daysSinceLastView} day${signals.daysSinceLastView > 1 ? 's' : ''} since they last opened it.` : ''} Low engagement on a first read does not necessarily mean no interest but it does mean the document alone has not yet made a strong case.`;
          recommendation = `Signal detected (low confidence): Document opened with limited engagement. The data alone cannot distinguish between distraction, poor timing, and low interest. A conversation focused on their current situation rather than the document tends to be more effective at this stage. Reintroducing the proposal can happen naturally if the conversation restarts.`;

        // ── DEFAULT ───────────────────────────────────────────────
        } else {
          dealStatus = 'cold';
          summary = `${email} has received this document.${signals.totalViews > 0 ? ` They have opened it ${signals.totalViews} time${signals.totalViews > 1 ? 's' : ''}.` : ' There has been no engagement yet.'} ${signals.daysSinceLastView > 0 ? `It has been ${signals.daysSinceLastView} day${signals.daysSinceLastView > 1 ? 's' : ''} since any activity.` : ''}`.trim();
       recommendation = signals.totalViews === 0
  ? `No signal yet: The document has not been opened. No engagement data available to interpret. Adding personal context about why this is specifically relevant to their situation before resending tends to improve open rates more than subject line changes.`
  : `Signal detected (low confidence): Limited engagement data available. A value-add message combined with a direct question about their timeline tends to generate responses even from prospects who were not planning to reply. Your knowledge of the relationship should guide the timing.`;
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

   // ── Compute deal level summary from all viewer summaries ──────
    // This runs after all individual summaries are generated
    // so it has the full picture of every viewer's engagement state
    let dealLevelSummary: {
      state: string;
      label: string;
      summary: string;
      recommendedAction: string;
      confidence: 'high' | 'medium' | 'low';
      totalViewers: number;
      hotCount: number;
      warmCount: number;
      coldCount: number;
    } | null = null;

    if (summaries.length > 0) {
      // Get committee data from the document analytics
      const docSessions = await db.collection('analytics_sessions')
        .find({ documentId: id })
        .sort({ startedAt: 1 })
        .toArray();

      const FREE_EMAIL_DOMAINS_DI = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'me.com', 'aol.com', 'protonmail.com',
  'mail.com', 'live.com', 'msn.com', 'googlemail.com',
]);

const domainViewerMap = docSessions
  .filter((s: any) => s.email)
  .reduce((acc: Record<string, string[]>, s: any) => {
    const domain = s.email?.split('@')[1];
    if (!domain || FREE_EMAIL_DOMAINS_DI.has(domain.toLowerCase())) return acc;
    if (!acc[domain]) acc[domain] = [];
    if (!acc[domain].includes(s.email)) acc[domain].push(s.email);
    return acc;
  }, {});

      const domainCommitteeSize = Math.max(
        ...Object.values(domainViewerMap).map((v: any) => v.length),
        1
      );
      const domainCommitteeGrowing = domainCommitteeSize >= 2;
      const prospectDomain = Object.keys(domainViewerMap)[0] || 'the prospect company';

      // ── Fallback — same share link, different/free email providers ──
      // Mirrors the logic in analytics/route.ts. Domain matching misses
      // cases where someone forwards the link to a personal Gmail/Outlook
      // address. If 2+ distinct emails used the SAME share link, that is
      // still internal sharing — just not confirmed as same company.
      const identifiedEmailsByShareDI = new Map<string, Set<string>>();
      docSessions.forEach((s: any) => {
        if (!s.email || !s.shareToken) return;
        if (!identifiedEmailsByShareDI.has(s.shareToken)) {
          identifiedEmailsByShareDI.set(s.shareToken, new Set());
        }
        identifiedEmailsByShareDI.get(s.shareToken)!.add(s.email);
      });

      const maxSharedLinkViewersDI = Math.max(
        ...Array.from(identifiedEmailsByShareDI.values()).map(set => set.size),
        0
      );
      const sharedLinkMultiViewerDI = maxSharedLinkViewersDI >= 2;

      const committeeSize = Math.max(domainCommitteeSize, maxSharedLinkViewersDI);
      const committeeGrowing = domainCommitteeGrowing || sharedLinkMultiViewerDI;
      const committeeConfidence: 'domain_confirmed' | 'link_only' | 'none' =
        domainCommitteeGrowing ? 'domain_confirmed'
        : sharedLinkMultiViewerDI ? 'link_only'
        : 'none';

      // Score secondary viewer engagement quality
      const primaryEmail = summaries[0]?.viewerEmail;
      const secondaryEmails = (domainViewerMap[prospectDomain] || [])
        .filter((e: string) => e !== primaryEmail);

      let hasHighQualitySecondary = false;

      for (const secEmail of secondaryEmails) {
        const secLogs = await db.collection('analytics_logs').find({
          documentId: id,
          action: 'page_view',
          email: secEmail,
        }).toArray();
        const secTime = secLogs.reduce((sum: number, l: any) => sum + (l.viewTime || 0), 0);
        if (secTime >= 300) {
          hasHighQualitySecondary = true;
          break;
        }
      }

      // Get days since last activity — use the most recently active viewer
// so the deal-level state reflects the freshest signal, not an arbitrary session order
const mostRecentSession = docSessions.reduce((latest: any, s: any) => {
  if (!latest) return s;
  return new Date(s.startedAt) > new Date(latest.startedAt) ? s : latest;
}, null);

const daysSinceLast = mostRecentSession?.startedAt
  ? Math.floor((Date.now() - new Date(mostRecentSession.startedAt).getTime()) / (1000 * 60 * 60 * 24))
  : 0;

      const hotCount = summaries.filter(s => s.dealStatus === 'hot').length;
      const warmCount = summaries.filter(s => s.dealStatus === 'warm').length;
      const coldCount = summaries.filter(s => s.dealStatus === 'cold').length;
      const acceleratingCount = summaries.filter(s => s.momentumState === 'accelerating').length;
      const fadingCount = summaries.filter(
        s => s.momentumState === 'fading' || s.momentumState === 'stalled'
      ).length;

      // ── Deal level state logic ────────────────────────────────
      const groupLabelDI = committeeConfidence === 'link_only'
  ? `${committeeSize} different people`
  : `${committeeSize} people from ${prospectDomain}`;
const groupCaveatDI = committeeConfidence === 'link_only'
  ? ` Their email addresses don't share a company domain, so this may be a personal email being used for business, or the link forwarded outside the original company.`
  : '';

if (committeeGrowing && hasHighQualitySecondary && hotCount >= 1) {
  dealLevelSummary = {
    state: 'advancing',
    label: 'Deal Advancing',
    summary: `${groupLabelDI} have opened this proposal and at least one secondary stakeholder is engaging deeply.${groupCaveatDI} Engagement quality across the group is high.`,
    recommendedAction: `Signal detected (${committeeConfidence === 'link_only' ? 'medium' : 'high'} confidence): Multiple stakeholders are actively reading this. Depending on your relationship with your original contact, this may be a natural moment to check in about whether there are questions on their side you could help address — framed around being helpful rather than checking on progress. Your read on timing will matter more than the data alone.`,
    confidence: committeeConfidence === 'link_only' ? 'medium' : 'high',
    totalViewers: summaries.length,
    hotCount,
    warmCount,
    coldCount,
  };
} else if (committeeGrowing && !hasHighQualitySecondary && hotCount >= 1) {
  dealLevelSummary = {
    state: 'evaluating',
    label: 'Internal Circulation',
    summary: `${groupLabelDI} have opened this proposal but secondary viewers are engaging briefly rather than deeply.${groupCaveatDI} The proposal has circulated but it is not yet clear how seriously secondary viewers are evaluating it.`,
    recommendedAction: `Signal detected (medium confidence): The proposal is circulating. Monitor whether secondary viewers return for deeper engagement before acting. A premature follow up could interrupt the internal process.`,
    confidence: 'medium',
    totalViewers: summaries.length,
    hotCount,
    warmCount,
    coldCount,
  };

      } else if (!committeeGrowing && hotCount >= 1 && acceleratingCount >= 1 && daysSinceLast <= 3) {
        dealLevelSummary = {
          state: 'single_strong',
          label: 'Strong Single Engagement',
          summary: `Your primary contact is engaging strongly with this proposal. No internal sharing has been detected yet — which is normal at this stage. Most contacts read a proposal themselves before deciding whether to involve others.`,
          recommendedAction: `Signal detected (medium confidence): Engagement is strong and recent. Whether to act now depends on where you are in the relationship. A value-add message or a natural question about their timeline tends to work better than asking if they read it.`,
          confidence: 'medium',
          totalViewers: summaries.length,
          hotCount,
          warmCount,
          coldCount,
        };
      } else if (!committeeGrowing && fadingCount > warmCount && daysSinceLast >= 5) {
        dealLevelSummary = {
          state: 'at_risk',
          label: 'Engagement Dropping',
          summary: `Engagement is declining and no internal sharing has been detected. ${daysSinceLast} days have passed since the last activity. This pattern often means the deal is losing priority internally or competing priorities have taken over.`,
          recommendedAction: `Signal detected (medium confidence): Engagement is dropping and the buying circle has not expanded. Send one direct question about whether this is still a priority. If there is no response within 48 hours this deal needs a different approach or should be parked with a reminder.`,
          confidence: 'medium',
          totalViewers: summaries.length,
          hotCount,
          warmCount,
          coldCount,
        };
      } else if (daysSinceLast >= 14 && !committeeGrowing) {
        dealLevelSummary = {
          state: 'stalled',
          label: 'Deal Stalled',
          summary: `No engagement has been detected for ${daysSinceLast} days and the buying circle has not expanded. The deal appears stalled based on available document signals. This does not necessarily mean the deal is lost.`,
          recommendedAction: `Signal detected (low confidence): ${daysSinceLast} days of silence. Send one final short message acknowledging the gap without guilt. If there is no reply within three days consider archiving this deal and setting a six week reminder.`,
          confidence: 'low',
          totalViewers: summaries.length,
          hotCount,
          warmCount,
          coldCount,
        };
      } else {
        dealLevelSummary = {
          state: 'early',
          label: 'Early Stage',
          summary: `${summaries.length === 1 ? 'One person has' : `${summaries.length} people have`} opened this proposal so far. Engagement is present but it is too early to draw strong conclusions from the available signals.`,
          recommendedAction: `No strong signal yet: Monitor engagement over the next 48 hours before acting. If engagement remains low after 72 hours a short contextual follow up referencing something specific in the proposal tends to perform better than a generic check in.`,
          confidence: 'low',
          totalViewers: summaries.length,
          hotCount,
          warmCount,
          coldCount,
        };
      }
    }

    return NextResponse.json({ success: true, summaries, dealLevelSummary });

  } catch (error) {
    // Never crash the app
    console.error('[DealIntelligence] outer error:', error);
    return NextResponse.json({ success: true, summaries: [], dealLevelSummary: null });
  }
}