// lib/checkSilentSpaces.ts
import { ObjectId } from 'mongodb';
import { sendSpaceDealInsightEmail } from './documentNotifications';
import { isSlackConnected, notifySpaceDealInsight } from './integrations/slack';
import { syncSpaceDealInsightToHubSpot, isHubSpotConnected } from './integrations/hubspotSync';
import { sendTeamsNotification } from '@/app/api/integrations/teams/notify/route';
import { buildSpaceVisitorIntelligence } from './buildSpaceVisitorIntelligence';

const SPACE_SILENT_DAYS = 3;

// ── MAIN: check for silent space visitors (piggybacks on real traffic) ──
export async function checkSilentSpaces(db: any) {
  const cutoff = new Date(Date.now() - SPACE_SILENT_DAYS * 24 * 60 * 60 * 1000);

  try {
    // Find visitor+space pairs whose most recent activity is older than cutoff,
    // with at least 2 events so a single accidental click never counts as "engaged"
    const staleVisitors = await db.collection('activityLogs').aggregate([
      { $match: { visitorEmail: { $ne: null } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: { spaceId: '$spaceId', visitorEmail: '$visitorEmail' },
          lastActivity: { $first: '$timestamp' },
          eventCount: { $sum: 1 },
        },
      },
      { $match: { lastActivity: { $lte: cutoff }, eventCount: { $gte: 2 } } },
      { $limit: 5 },
    ]).toArray();

    for (const entry of staleVisitors) {
      try {
        const { spaceId, visitorEmail } = entry._id;

        // Already alerted for this exact silence window? Skip.
        const alreadyAlerted = await db.collection('space_silence_alerts').findOne({
          spaceId: spaceId.toString(),
          visitorEmail,
          lastActivity: entry.lastActivity,
        });
        if (alreadyAlerted) continue;

        const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) });
        if (!space) continue;

        const ownerId = space.userId || space.createdBy;
        if (!ownerId) continue;

        const allSpaceLogs = await db.collection('activityLogs')
          .find({ spaceId: space._id })
          .sort({ timestamp: -1 })
          .toArray();

                  const visitorEmails: string[] = Array.from(
          new Set<string>(
            allSpaceLogs
              .map((l: any) => l.visitorEmail)
              .filter((e: any): e is string => Boolean(e))
          )
        );

        const trackVisitors = visitorEmails.map((vEmail: string) => {
          const vLogs = allSpaceLogs.filter((l: any) => l.visitorEmail === vEmail);
          const lastSeen = vLogs.length > 0
            ? vLogs.reduce((latest: any, l: any) =>
                new Date(l.timestamp) > new Date(latest.timestamp) ? l : latest
              ).timestamp
            : new Date();
          return { email: vEmail, engagementScore: 0, status: 'new', lastSeen };
        });

                const trackDocuments: { documentId: string; documentName: string }[] = Array.from(
          new Set<string>(
            allSpaceLogs
              .filter((l: any) => l.documentId)
              .map((l: any) => l.documentId.toString())
          )
        ).map((docId: string) => {
          const docLog = allSpaceLogs.find((l: any) => l.documentId?.toString() === docId);
          return { documentId: docId, documentName: docLog?.documentName || 'Document' };
        });

        const thisVisitor = trackVisitors.find((v: any) => v.email === visitorEmail) || {
          email: visitorEmail, engagementScore: 0, status: 'new', lastSeen: entry.lastActivity,
        };

        const intel = await buildSpaceVisitorIntelligence({
          db,
          spaceId: space._id.toString(),
          visitor: thisVisitor,
          logs: allSpaceLogs,
          visitors: trackVisitors,
          documents: trackDocuments,
        });

        const daysSilent = Math.floor(
          (Date.now() - new Date(entry.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
        );

        const ownerProfile = await db.collection('profiles').findOne({ user_id: ownerId });
        const ownerEmailAddr = ownerProfile?.email || space.ownerEmail;

        const narrative =
          `${intel.narrative} Gone quiet for ${daysSilent} days after earlier engagement. ${intel.recommendation}`;

        const payload = {
          documentName: space.name || 'Your space',
          documentId: space._id.toString(),
          viewerEmail: visitorEmail,
          slowestPage: 1,
          slowestPageTime: 0,
          avgPageTime: 0,
          skippedPages: [] as number[],
          totalPages: 1,
          trigger: 'gone_silent' as const,
          daysSilent,
        };

        // Fire to all channels — each wrapped independently, one failure
        // never blocks the others (same pattern as fireToAllChannels)
        const results = await Promise.allSettled([

          ownerEmailAddr
            ? sendSpaceDealInsightEmail({
                ownerEmail: ownerEmailAddr,
                ownerName: ownerProfile?.full_name || ownerProfile?.first_name || null,
                narrative,
                ...payload,
              }).catch(err => console.error('[SilentSpace] Email failed:', err))
            : Promise.resolve(),

          isSlackConnected(ownerId)
            .then(connected =>
              connected
                ? notifySpaceDealInsight({ userId: ownerId, narrative, ...payload })
                    .catch(err => console.error('[SilentSpace] Slack failed:', err))
                : Promise.resolve()
            )
            .catch(err => console.error('[SilentSpace] Slack check failed:', err)),

          isHubSpotConnected(ownerId)
            .then(connected =>
              connected
                ? syncSpaceDealInsightToHubSpot({ userId: ownerId, narrative, ...payload })
                    .catch(err => console.error('[SilentSpace] HubSpot failed:', err))
                : Promise.resolve()
            )
            .catch(err => console.error('[SilentSpace] HubSpot check failed:', err)),

          sendTeamsNotification({
            userId: ownerId,
            event: 'deal_insight',
            documentName: payload.documentName,
            documentId: payload.documentId,
            viewerEmail: payload.viewerEmail,
            extraInfo: `Prospect: ${visitorEmail}\n\n${narrative}`,
            isSpace: true,
          }).catch(err => console.error('[SilentSpace] Teams failed:', err)),

        ]);

        results.forEach((result, i) => {
          const channel = ['Email', 'Slack', 'HubSpot', 'Teams'][i];
          if (result.status === 'rejected') {
            console.error(`[SilentSpace] ${channel} rejected:`, result.reason);
          }
        });

        // Mark this exact silence window as alerted so it never fires again
        // for the same lastActivity timestamp — a NEW visit later that goes
        // silent again will have a different lastActivity, so it's free to fire.
        await db.collection('space_silence_alerts').insertOne({
          spaceId: spaceId.toString(),
          visitorEmail,
          lastActivity: entry.lastActivity,
          alertedAt: new Date(),
        });

      } catch (innerErr) {
        // One visitor failing never crashes the loop
        console.error('[checkSilentSpaces] entry error:', innerErr);
        continue;
      }
    }
  } catch (err) {
    // Entire function fails silently — never crashes the app
    console.error('[checkSilentSpaces] outer error:', err);
  }
}