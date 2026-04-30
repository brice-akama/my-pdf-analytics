import { notifyDealInsight, isSlackConnected } from './integrations/slack';
import { syncDealInsightToHubSpot, isHubSpotConnected } from './integrations/hubspotSync';
import { sendDealInsightEmail } from './documentNotifications';
import { sendTeamsNotification } from '@/app/api/integrations/teams/notify/route';
import { ObjectId } from 'mongodb';

const SILENT_DAYS = 3;

// ── Helpers ───────────────────────────────────────────────────────
function formatTime(s: number): string {
  if (!s || s <= 0) return '0s';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── Build the narrative sentence from all signals ─────────────────
// This is the "they re-read page 3 three times" layer
export function buildNarrative({
  reReadPages,
  videoReplays,
  backNavigations,
  engagementDropping,
  neverForwarded,
  daysSilent,
  trigger,
}: {
  reReadPages: { page: number; count: number }[];
  videoReplays: { page: number; count: number }[];
  backNavigations: number[];
  engagementDropping: boolean;
  neverForwarded: boolean;
  daysSilent?: number;
  trigger: 'session_end' | 'gone_silent' | 'behavioral';
}): string {
  const parts: string[] = [];

  // Re-reads
  if (reReadPages.length > 0) {
    const top = reReadPages[0];
    parts.push(
      `Page ${top.page} was re-read ${top.count} time${top.count > 1 ? 's' : ''}`
    );
  }

  // Video replays
  if (videoReplays.length > 0) {
    const top = videoReplays[0];
    parts.push(
      `watched the page ${top.page} video ${top.count} time${top.count > 1 ? 's' : ''}`
    );
  }

  // Back navigation
  if (backNavigations.length > 0) {
    parts.push(
      `jumped back to page ${backNavigations[0]}`
    );
  }

  // Engagement dropping
  if (engagementDropping) {
    parts.push('engagement is dropping across visits');
  }

  // Never forwarded
  if (neverForwarded) {
    parts.push('no one else has opened this doc');
  }

  // Silence
  if (trigger === 'gone_silent' && daysSilent) {
    parts.push(`gone silent for ${daysSilent} days`);
  }

  if (parts.length === 0) {
    return 'Unusual engagement pattern detected.';
  }

  // Join into one readable sentence
  const sentence = parts.length === 1
    ? parts[0]
    : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];

  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

// ── Detect behavioral signals from page logs ──────────────────────
export async function detectSignals(db: any, {
  documentId,
  sessionId,
  viewerId,
  numPages,
}: {
  documentId: string;
  sessionId: string;
  viewerId: string;
  numPages: number;
}) {
  try {
    // All page logs for this session
    const pageLogs = await db.collection('analytics_logs').find({
      documentId,
      sessionId,
      action: 'page_view',
    }).sort({ timestamp: 1 }).toArray();

    // Page time map
    const pageTimeMap = new Map<number, number>();
    pageLogs.forEach((l: any) => {
      pageTimeMap.set(
        l.pageNumber,
        (pageTimeMap.get(l.pageNumber) || 0) + (l.viewTime || 0)
      );
    });

    const pageTimes = Array.from(pageTimeMap.entries());
    const totalTime = pageTimes.reduce((sum, [, t]) => sum + t, 0);
    const avgPageTime = pageTimes.length > 0
      ? Math.round(totalTime / pageTimes.length)
      : 0;

    // Slowest page
    const sorted = [...pageTimes].sort((a, b) => b[1] - a[1]);
    const [slowestPage, slowestPageTime] = sorted[0] || [1, 0];

    // Re-reads — same page visited more than once in this session
    const pageVisitCounts = new Map<number, number>();
    pageLogs.forEach((l: any) => {
      pageVisitCounts.set(
        l.pageNumber,
        (pageVisitCounts.get(l.pageNumber) || 0) + 1
      );
    });
    const reReadPages = Array.from(pageVisitCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);

    // Back navigation — detect when page number goes backwards
    const pageSequence = pageLogs.map((l: any) => l.pageNumber);
    const backNavigations: number[] = [];
    for (let i = 1; i < pageSequence.length; i++) {
      if (pageSequence[i] < pageSequence[i - 1] - 1) {
        if (!backNavigations.includes(pageSequence[i])) {
          backNavigations.push(pageSequence[i]);
        }
      }
    }

    // Skipped pages
    const visitedPages = new Set(pageLogs.map((l: any) => l.pageNumber));
    const skippedPages = Array.from(
      { length: numPages }, (_, i) => i + 1
    ).filter(p => !visitedPages.has(p));

    // Video replays for this viewer across all sessions
    const videoLogs = await db.collection('analytics_logs').find({
      documentId,
      viewerId,
      action: 'video_replayed',
    }).toArray();
    const videoReplayMap = new Map<number, number>();
    videoLogs.forEach((l: any) => {
      videoReplayMap.set(
        l.pageNumber,
        (videoReplayMap.get(l.pageNumber) || 0) + 1
      );
    });
    const videoReplays = Array.from(videoReplayMap.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);

    // Engagement dropping — compare last 3 sessions for this viewer
    const allSessions = await db.collection('analytics_sessions').find({
      documentId,
      viewerId,
    }).sort({ startedAt: -1 }).limit(3).toArray();

    let engagementDropping = false;
    if (allSessions.length >= 3) {
      const durations = allSessions.map((s: any) => s.duration || 0);
      // Each visit shorter than the previous = dropping
      engagementDropping = durations[0] < durations[1] && durations[1] < durations[2];
    }

    return {
      pageTimes,
      avgPageTime,
      slowestPage,
      slowestPageTime,
      reReadPages,
      backNavigations,
      skippedPages,
      videoReplays,
      engagementDropping,
    };
  } catch (err) {
    console.error('[detectSignals] error:', err);
    return null;
  }
}

// ── Check if behavioral trigger should fire ───────────────────────
// This fires immediately — no 3-day wait needed
export function shouldFireBehavioral({
  reReadPages,
  backNavigations,
  engagementDropping,
  neverForwarded,
  videoReplays,
}: {
  reReadPages: { page: number; count: number }[];
  backNavigations: number[];
  engagementDropping: boolean;
  neverForwarded: boolean;
  videoReplays: { page: number; count: number }[];
}): boolean {
  // Any one of these is enough to fire
  if (reReadPages.some(p => p.count >= 2)) return true;
  if (backNavigations.length > 0) return true;
  if (engagementDropping) return true;
  if (videoReplays.some(v => v.count >= 2)) return true;
  // Never forwarded only counts if combined with re-reads or silence
  if (neverForwarded && reReadPages.length > 0) return true;
  return false;
}

// ── Fire to all channels — silent failures everywhere ─────────────
export async function fireToAllChannels({
  db,
  userId,
  ownerProfile,
  payload,
  narrative,
}: {
  db: any;
  userId: string;
  ownerProfile: any;
  payload: any;
  narrative: string;
}) {
  const results = await Promise.allSettled([

    // Email
    ownerProfile?.email
      ? sendDealInsightEmail({
          ownerEmail: ownerProfile.email,
          ownerName: ownerProfile.full_name || ownerProfile.first_name || null,
          ...payload,
        }).catch(err => console.error('[DealInsight] Email failed:', err))
      : Promise.resolve(),

    // Slack
    isSlackConnected(userId)
      .then(connected =>
        connected
          ? notifyDealInsight({
              userId,
              narrative,
              ...payload,
            }).catch(err => console.error('[DealInsight] Slack failed:', err))
          : Promise.resolve()
      )
      .catch(err => console.error('[DealInsight] Slack check failed:', err)),

    // HubSpot
    isHubSpotConnected(userId)
      .then(connected =>
        connected
          ? syncDealInsightToHubSpot({
              userId,
              narrative,
              ...payload,
            }).catch(err => console.error('[DealInsight] HubSpot failed:', err))
          : Promise.resolve()
      )
      .catch(err => console.error('[DealInsight] HubSpot check failed:', err)),

    // Teams
    sendTeamsNotification({
      userId,
      event: 'deal_insight',
      documentName: payload.documentName,
      documentId: payload.documentId,
      viewerEmail: payload.viewerEmail,
      extraInfo: `Prospect: ${payload.viewerEmail}\n\n${narrative}`,
    }).catch(err => console.error('[DealInsight] Teams failed:', err)),

  ]);

  // Log any failures to Vercel logs without crashing
  results.forEach((result, i) => {
    const channel = ['Email', 'Slack', 'HubSpot', 'Teams'][i];
    if (result.status === 'rejected') {
      console.error(`[DealInsight] ${channel} rejected:`, result.reason);
    }
  });
}

// ── MAIN: check for silent deals (piggybacks on real traffic) ─────
export async function checkSilentDeals(db: any) {
  const cutoff = new Date(Date.now() - SILENT_DAYS * 24 * 60 * 60 * 1000);

  try {
    const staleSessions = await db.collection('analytics_sessions').find({
      endedAt: { $lte: cutoff },
      silentAlertSent: { $ne: true },
      duration: { $gt: 30 },
    }).limit(5).toArray();

    for (const session of staleSessions) {
      try {
        // Came back — skip
        const returnVisit = await db.collection('analytics_sessions').findOne({
          documentId: session.documentId,
          viewerId: session.viewerId,
          startedAt: { $gt: session.endedAt },
        });

        if (returnVisit) {
          await db.collection('analytics_sessions').updateOne(
            { _id: session._id },
            { $set: { silentAlertSent: true } }
          );
          continue;
        }

        const { ObjectId } = await import('mongodb');
        const doc = await db.collection('documents').findOne({
          _id: new ObjectId(session.documentId),
        });
        const share = await db.collection('shares').findOne({
          shareToken: session.shareToken,
        });

        if (!doc || !share?.userId) continue;

        const viewerEmail = session.email ||
          (await db.collection('viewer_identities').findOne({
            viewerId: session.viewerId,
            documentId: session.documentId,
          }))?.email;

        if (!viewerEmail) continue;

        const signals = await detectSignals(db, {
          documentId: session.documentId,
          sessionId: session.sessionId,
          viewerId: session.viewerId,
          numPages: doc.numPages,
        });

        if (!signals) continue;

        // Check if no one else ever opened this doc
        const uniqueViewerCount = await db.collection('analytics_sessions')
          .distinct('viewerId', { documentId: session.documentId });
        const neverForwarded = uniqueViewerCount.length <= 1;

        const daysSilent = Math.floor(
          (Date.now() - new Date(session.endedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        const narrative = buildNarrative({
          reReadPages: signals.reReadPages,
          videoReplays: signals.videoReplays,
          backNavigations: signals.backNavigations,
          engagementDropping: signals.engagementDropping,
          neverForwarded,
          daysSilent,
          trigger: 'gone_silent',
        });

        const ownerProfile = await db.collection('profiles').findOne({
          user_id: share.userId,
        });

        await fireToAllChannels({
          db,
          userId: share.userId,
          ownerProfile,
          payload: {
            documentName: doc.originalFilename || 'Your document',
            documentId: session.documentId,
            viewerEmail,
            slowestPage: signals.slowestPage,
            slowestPageTime: signals.slowestPageTime,
            avgPageTime: signals.avgPageTime,
            skippedPages: signals.skippedPages,
            totalPages: doc.numPages,
            trigger: 'gone_silent' as const,
            daysSilent,
          },
          narrative,
        });

        await db.collection('analytics_sessions').updateOne(
          { _id: session._id },
          { $set: { silentAlertSent: true } }
        );

      } catch (innerErr) {
        // One session failing never crashes the loop
        console.error('[checkSilentDeals] session error:', innerErr);
        continue;
      }
    }
  } catch (err) {
    // Entire function fails silently — never crashes the app
    console.error('[checkSilentDeals] outer error:', err);
  }
  // ── Also check signature requests for silence ─────────────────
    try {
      const silentSigners = await db.collection('signature_requests').find({
        status: 'pending',
        viewedAt: { $lte: cutoff },
        signedAt: null,
        signerSilentAlertSent: { $ne: true },
        totalTimeSpentSeconds: { $gt: 30 },
      }).limit(5).toArray()

      for (const signer of silentSigners) {
        try {
          const daysSilent = Math.floor(
            (Date.now() - new Date(signer.viewedAt).getTime()) /
            (1000 * 60 * 60 * 24)
          )

          const recipientName = signer.recipientName ||
            signer.recipient?.name || 'Signer'
          const recipientEmail = signer.recipientEmail ||
            signer.recipient?.email || ''

          const doc = await db.collection('documents').findOne({
            _id: new ObjectId(signer.documentId?.toString()),
          })

          const owner = await db.collection('profiles').findOne({
            user_id: signer.ownerId?.toString() ||
              signer.createdBy?.toString(),
          })

          if (!doc || !owner?.email) continue

          const pageData = signer.pageData || []
          const pageTimeMap = new Map<number, number>()
          pageData.forEach((p: any) => {
            pageTimeMap.set(
              p.page,
              (pageTimeMap.get(p.page) || 0) + (p.timeSpent || 0)
            )
          })

          const pageTimes = Array.from(pageTimeMap.entries())
          if (pageTimes.length === 0) continue

          const totalTime = pageTimes.reduce((sum, [, t]) => sum + t, 0)
          const avgPageTime = Math.round(totalTime / pageTimes.length)
          const [slowestPage, slowestPageTime] = pageTimes
            .sort((a, b) => b[1] - a[1])[0]

          const narrative = `${recipientName} opened the signing document ${daysSilent} days ago, spent ${formatTime(totalTime)} reading it, but hasn't signed yet. They spent the most time on page ${slowestPage} (${formatTime(slowestPageTime)} vs avg ${formatTime(avgPageTime)}). They may need a nudge or clarification before signing.`

          const documentId = doc._id.toString()
          const userId = signer.ownerId?.toString() ||
            signer.createdBy?.toString() || ''

          await Promise.allSettled([
            // Email
            sendDealInsightEmail({
              ownerEmail: owner.email,
              ownerName: owner.full_name || owner.first_name || null,
              viewerEmail: recipientEmail,
              documentName: doc.originalFilename || 'Your document',
              documentId,
              slowestPage,
              slowestPageTime,
              avgPageTime,
              skippedPages: [],
              totalPages: doc.numPages,
              trigger: 'gone_silent',
              daysSilent,
            }).catch(err =>
              console.error('[SignerSilent] Email failed:', err)
            ),

            // Slack
            isSlackConnected(userId).then(connected =>
              connected
                ? notifyDealInsight({
                    userId,
                    documentName: doc.originalFilename || 'Your document',
                    documentId,
                    viewerEmail: recipientEmail,
                    slowestPage,
                    slowestPageTime,
                    avgPageTime,
                    skippedPages: [],
                    totalPages: doc.numPages,
                    trigger: 'gone_silent',
                    daysSilent,
                    narrative,
                  }).catch(err =>
                    console.error('[SignerSilent] Slack failed:', err)
                  )
                : Promise.resolve()
            ).catch(err =>
              console.error('[SignerSilent] Slack check failed:', err)
            ),

            // Teams
            sendTeamsNotification({
              userId,
              event: 'deal_insight',
              documentName: doc.originalFilename || 'Your document',
              documentId,
              viewerEmail: recipientEmail,
              extraInfo: `Prospect: ${recipientEmail}\n\n${narrative}`,
            }).catch(err =>
              console.error('[SignerSilent] Teams failed:', err)
            ),
          ])

          await db.collection('signature_requests').updateOne(
            { _id: signer._id },
            { $set: { signerSilentAlertSent: true } }
          )

        } catch (innerErr) {
          console.error('[SignerSilent] inner error:', innerErr)
          continue
        }
      }
    } catch (signerErr) {
      console.error('[SignerSilent] outer error:', signerErr)
    }
}