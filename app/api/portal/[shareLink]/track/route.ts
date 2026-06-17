// app/api/portal/[shareLink]/track/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendPortalNotification } from '@/lib/emails/portal-notifications';
import { isHubSpotConnected } from '@/lib/integrations/hubspotSync';
import { syncPortalEventToHubSpot } from '@/lib/integrations/hubspotSync';
import { isSlackConnected, notifyPortalEvent } from '@/lib/integrations/slack';
import { isTeamsConnected } from '@/lib/integrations/teams'
import { sendTeamsNotification } from '@/app/api/integrations/teams/notify/route'

function normalizeEvent(event: string): string {
  const map: Record<string, string> = {
    'portal_opened':     'document_open',
    'portal_open':       'document_open',
    'space_open':        'document_open',
    'portal_enter':      'document_open',  // catches any already-saved old events
    'document_viewed':   'document_view',
    'doc_view':          'document_view',
    'view':              'document_view',
    'file_download':     'download',
    'document_download': 'download',
  };
  return map[event] || event;
}

export async function POST(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise
      ? await context.params
      : context.params;

    const shareLink = params.shareLink;
    const body = await request.json();
    const {
      email,
      event: rawEvent,
      documentId,
      documentName,
      sessionId,
      secondsOnPage,
      totalSeconds,
    } = body;

    const event = normalizeEvent(rawEvent || '');
    const db = await dbPromise;

    const space = await db.collection('spaces').findOne({
      $or: [
        { publicAccess: { $elemMatch: { shareLink } } },
        { 'publicAccess.shareLink': shareLink },
      ]
    });

    if (!space) {
      return NextResponse.json({ success: true, warning: 'Space not found' });
    }

    // ── HEARTBEAT ─────────────────────────────────────────────────────────
    if (event === 'page_heartbeat') {
      if (!documentId || !sessionId) {
        return NextResponse.json({ success: true, warning: 'Missing heartbeat fields' });
      }
      await db.collection('diligenceLogs').updateOne(
        { spaceId: space._id, sessionId },
        {
          $set: {
            spaceId: space._id, shareLink, sessionId,
            documentId:    new ObjectId(documentId),
            documentName:  documentName || null,
            visitorEmail:  email || null,
            lastHeartbeat: new Date(),
            totalSeconds:  totalSeconds || 0,
          },
          $setOnInsert: { startedAt: new Date() }
        },
        { upsert: true }
      );
      return NextResponse.json({ success: true });
    }

    // ── REGULAR EVENT: write to activityLogs ──────────────────────────────
    await db.collection('activityLogs').insertOne({
      spaceId:      space._id,
      shareLink,
      visitorEmail: email || null,
      event,
      documentId:   documentId ? new ObjectId(documentId) : null,
      documentName: documentName || null,
      timestamp:    new Date(),
      ipAddress:    request.headers.get('x-forwarded-for') || 'unknown',
      userAgent:    request.headers.get('user-agent') || 'unknown',
    });

    // Increment view counter
    const viewEvents = ['document_view', 'portal_enter'];
    if (viewEvents.includes(event)) {
      await db.collection('spaces').updateOne(
        { _id: space._id, 'publicAccess.shareLink': shareLink },
        { $inc: { 'publicAccess.$.currentViews': 1 } }
      ).catch(() => {});
    }

    // Seed diligence session on document_view
    if (event === 'document_view' && documentId) {
      const newSessionId = `${email || 'anon'}-${documentId}-${Date.now()}`;
      await db.collection('diligenceLogs').insertOne({
        spaceId: space._id,
        shareLink,
        sessionId:     newSessionId,
        documentId:    new ObjectId(documentId),
        documentName:  documentName || null,
        visitorEmail:  email || null,
        startedAt:     new Date(),
        lastHeartbeat: new Date(),
        totalSeconds:  0,
      });
    }

   // ── EMAIL + HUBSPOT NOTIFICATIONS ────────────────────────────────────
const notifyEvents = ['portal_enter', 'document_view', 'download'];
if (email && notifyEvents.includes(event)) {
  try {
    const owner = await db.collection('users').findOne({
      _id: space.userId ? new ObjectId(space.userId) : space._id
    });

    const ownerEmail = owner?.email || space.ownerEmail;

    // Don't notify if owner is viewing their own space
    if (ownerEmail && ownerEmail !== email) {

      // Check revisit
      const priorVisits = await db.collection('activityLogs').countDocuments({
        spaceId:      space._id,
        visitorEmail: email,
        event:        'portal_enter',
      });
      const isRevisit  = event === 'portal_enter' && priorVisits > 1;
      const finalEvent = isRevisit ? 'revisit' : event as any;

      // Share link label
      const publicAccessList = Array.isArray(space.publicAccess)
        ? space.publicAccess
        : space.publicAccess ? [space.publicAccess] : [];
      const linkObj    = publicAccessList.find((pa: any) => pa.shareLink === shareLink);
      const shareLabel = linkObj?.label || null;

      // ── 1. Email notification (always) ─────────────────────────────
      await sendPortalNotification({
        ownerEmail,
        spaceName:    space.name,
        visitorEmail: email,
        event:        finalEvent,
        documentName: documentName || undefined,
        shareLabel:   shareLabel   || undefined,
        spaceId:      space._id.toString(),
        appUrl:       process.env.NEXT_PUBLIC_APP_URL,
      });

      // ── 2. HubSpot sync (only if owner has HubSpot connected) ──────
      const ownerId = owner?._id?.toString() || space.userId;
      console.log('🔍 HubSpot check — ownerId:', ownerId, '| visitorEmail:', email, '| event:', finalEvent);

      if (!ownerId) {
        console.log('⚠️ HubSpot skipped — could not resolve ownerId from owner or space.userId');
      } else {
        const hubspotConnected = await isHubSpotConnected(ownerId);
        console.log('🔌 HubSpot connected for ownerId', ownerId, ':', hubspotConnected);

        if (!hubspotConnected) {
          console.log('⚠️ HubSpot skipped — owner has no active HubSpot integration');
        } else {
          console.log('📤 Sending to HubSpot — contact:', email, '| space:', space.name, '| event:', finalEvent);
          const result = await syncPortalEventToHubSpot({
            userId:       ownerId,
            visitorEmail: email,
            spaceName:    space.name,
            event:        finalEvent,
            documentName: documentName || undefined,
            isRevisit,
            visitCount:   isRevisit ? priorVisits + 1 : 1,
          }).catch(err => {
            console.error('📊 HubSpot sync threw an error:', err);
            return { success: false, error: err };
          });
          console.log('📊 HubSpot sync result:', JSON.stringify(result));
        }
      }

      // ── 3. Slack notification (only if owner has Slack connected) ───
      const slackConnected = await isSlackConnected(ownerId);
      console.log('💬 Slack connected for ownerId', ownerId, ':', slackConnected);

      if (slackConnected) {
        console.log('📤 Sending to Slack — visitor:', email, '| event:', finalEvent);
        await notifyPortalEvent({
          userId:       ownerId,
          visitorEmail: email,
          spaceName:    space.name,
          spaceId:      space._id.toString(),
          event:        finalEvent,
          documentName: documentName || undefined,
          isRevisit,
          visitCount:   isRevisit ? priorVisits + 1 : 1,
        }).catch(err => {
          console.error('💬 Slack notification failed silently:', err);
        });
      } else {
        console.log('⚠️ Slack skipped — owner has no active Slack integration or no channel set');
      }

      // ── 4. Teams notification ────────────────────────────────────────
      const teamsConnected = await isTeamsConnected(ownerId)
      console.log('Teams connected for ownerId', ownerId, ':', teamsConnected)
 
      if (teamsConnected) {
        console.log('Sending to Teams — visitor:', email, '| event:', finalEvent)
 
        // Map normalised event to Teams payload event type
        const teamsEvent = (() => {
          if (finalEvent === 'document_open' || finalEvent === 'portal_enter') return 'document_open'
          if (finalEvent === 'revisit')        return 'document_revisited'
          if (finalEvent === 'document_view')  return 'document_viewed'
          if (finalEvent === 'download')       return 'document_downloaded'
          return 'document_viewed'
        })()
 
        await sendTeamsNotification({
          userId:       ownerId,
          event:        teamsEvent,
          documentName: documentName || 'Document',
          documentId:   documentId   || space._id.toString(),
          viewerEmail:  email,
          spaceName:    space.name,
          spaceId:      space._id.toString(),
          visitCount:   isRevisit ? priorVisits + 1 : 1,
        }).catch(err => {
          console.error('Teams notification failed silently:', err)
        })
      } else {
        console.log('Teams skipped — owner has no active Teams integration or no channel set')
      }
    }
  } catch (emailErr) {
    console.error('📧 Notification failed:', emailErr);
  }
}

   // ── Follow up cadence trigger ─────────────────────────────────────
    // Only fires on portal_enter (first open of the space)
    // Same lazy evaluation pattern as single documents — no cron needed
    if (event === 'document_open' && email && space) {
      const existingCadence = await db.collection('follow_up_cadences').findOne({
        spaceId: space._id.toString(),
        viewerEmail: email,
        completed: { $ne: true },
      }).catch(() => null);

      if (!existingCadence) {
        const now = new Date();
        db.collection('follow_up_cadences').insertOne({
          spaceId: space._id.toString(),
          documentId: space._id.toString(),
          userId: space.userId || space.createdBy,
          viewerEmail: email,
          shareToken: shareLink,
          documentName: space.name || 'Your space',
          createdAt: now,
          sharedAt: now,
          completed: false,
          stepsFired: [],
          nextFireAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          currentStep: 1,
          type: 'space',
        }).catch(() => {});
      }

     // Run cadence job lazily on every portal open
      import('@/lib/followUpCadenceJob').then(({ runFollowUpCadenceJob }) => {
        runFollowUpCadenceJob().catch(() => {});
      }).catch(() => {});

      // ── Fire deal intelligence to HubSpot silently ──────────────
      // ── Fire REAL deal intelligence — only when something MEANINGFULLY
      // CHANGED (committee just formed, momentum just accelerated, or
      // silence-then-question just happened). Mirrors the document-level
      // behavioral trigger pattern. Never fires on routine repeat opens.
      const ownerId = space.userId || space.createdBy;
      if (ownerId) {
        (async () => {
          try {
            const allSpaceLogs = await db.collection('activityLogs')
              .find({ spaceId: space._id })
              .sort({ timestamp: -1 })
              .toArray();

            const visitorEmails = [...new Set(
              allSpaceLogs.map((l: any) => l.visitorEmail).filter(Boolean)
            )];

            const trackVisitors = visitorEmails.map((vEmail: string) => {
              const vLogs = allSpaceLogs.filter((l: any) => l.visitorEmail === vEmail);
              const lastSeen = vLogs.length > 0
                ? vLogs.reduce((latest: any, l: any) =>
                    new Date(l.timestamp) > new Date(latest.timestamp) ? l : latest
                  ).timestamp
                : new Date();
              return { email: vEmail, engagementScore: 0, status: 'new', lastSeen };
            });

            const trackDocuments = [...new Set(
              allSpaceLogs.filter((l: any) => l.documentId).map((l: any) => l.documentId.toString())
            )].map(docId => {
              const docLog = allSpaceLogs.find((l: any) => l.documentId?.toString() === docId);
              return { documentId: docId, documentName: docLog?.documentName || 'Document' };
            });

            const thisVisitor = trackVisitors.find(v => v.email === email) || {
              email, engagementScore: 0, status: 'new', lastSeen: new Date(),
            };

            const { buildSpaceVisitorIntelligence } = await import('@/lib/buildSpaceVisitorIntelligence');
            const intel = await buildSpaceVisitorIntelligence({
              db,
              spaceId: space._id.toString(),
              visitor: thisVisitor,
              logs: allSpaceLogs,
              visitors: trackVisitors,
              documents: trackDocuments,
            });

            // ── Compare against last-known state for this visitor+space ──
            const lastState = await db.collection('space_visitor_intel_state').findOne({
              spaceId: space._id.toString(),
              visitorEmail: email,
            });

            const { shouldFireSpaceIntelligence } = await import('@/lib/shouldFireSpaceIntelligence');
            const shouldFire = shouldFireSpaceIntelligence({
              current: intel,
              previous: lastState ? {
                hasInternalSharing: lastState.hasInternalSharing,
                hasLinkOnlySharing: lastState.hasLinkOnlySharing,
                momentumState: lastState.momentumState,
                returnWithQuestion: lastState.returnWithQuestion,
              } : null,
            });

            // Always update the stored state, whether or not we fire,
            // so the NEXT event has something accurate to compare against
            await db.collection('space_visitor_intel_state').updateOne(
              { spaceId: space._id.toString(), visitorEmail: email },
              {
                $set: {
                  spaceId: space._id.toString(),
                  visitorEmail: email,
                  hasInternalSharing: intel.hasInternalSharing,
                  hasLinkOnlySharing: intel.hasLinkOnlySharing,
                  momentumState: intel.momentumState,
                  returnWithQuestion: intel.returnWithQuestion,
                  updatedAt: new Date(),
                },
              },
              { upsert: true }
            ).catch(err => console.error('[SpaceIntel] state save failed:', err));

            if (!shouldFire) return;

            const momentumScoreMap = { accelerating: 75, holding: 50, fading: 25, stalled: 10 };

            // Fire to all four channels — same pattern as fireToAllChannels,
            // each independently caught so one failure never blocks another
            const ownerProfile = await db.collection('profiles').findOne({ user_id: ownerId });
            const ownerEmailAddr = ownerProfile?.email || space.ownerEmail;

            if (ownerEmailAddr) {
              const { sendDealInsightEmail } = await import('@/lib/documentNotifications');
              sendDealInsightEmail({
                ownerEmail: ownerEmailAddr,
                ownerName: ownerProfile?.full_name || ownerProfile?.first_name || null,
                viewerEmail: email,
                documentName: space.name || 'Your space',
                documentId: space._id.toString(),
                slowestPage: 1,
                slowestPageTime: 0,
                avgPageTime: 0,
                skippedPages: [],
                totalPages: 1,
                trigger: 'session_end',
                narrative: `${intel.narrative}\n\n${intel.recommendation}`,
              }).catch(err => console.error('[SpaceIntel] Email silent fail:', err));
            }

            const { isSlackConnected, notifyDealInsight } = await import('@/lib/integrations/slack');
            isSlackConnected(ownerId)
              .then(connected => {
                if (!connected) return;
                return notifyDealInsight({
                  userId: ownerId,
                  documentName: space.name || 'Your space',
                  documentId: space._id.toString(),
                  viewerEmail: email,
                  slowestPage: 1,
                  slowestPageTime: 0,
                  avgPageTime: 0,
                  skippedPages: [],
                  totalPages: 1,
                  trigger: 'session_end',
                  narrative: `${intel.narrative} ${intel.recommendation}`,
                });
              })
              .catch(err => console.error('[SpaceIntel] Slack silent fail:', err));

            const { syncDealIntelligenceToHubSpot, isHubSpotConnected } =
              await import('@/lib/integrations/hubspotSync');
            isHubSpotConnected(ownerId)
              .then(connected => {
                if (!connected) return;
                return syncDealIntelligenceToHubSpot({
                  userId: ownerId,
                  viewerEmail: email,
                  documentName: space.name || 'Space',
                  documentId: space._id.toString(),
                  spaceId: space._id.toString(),
                  momentumScore: momentumScoreMap[intel.momentumState],
                  engagementState: intel.momentumState,
                  lastSignal: intel.narrative,
                  recommendedAction: intel.recommendation,
                  internalSharing: intel.hasInternalSharing,
                  secondaryViewerCount: intel.secondaryViewers?.length,
                  daysSinceLastActivity: intel.daysSinceLastActivity,
                  isSpace: true,
                });
              })
              .catch(err => console.error('[SpaceIntel] HubSpot silent fail:', err));

            sendTeamsNotification({
              userId: ownerId,
              event: 'deal_insight',
              documentName: space.name || 'Your space',
              documentId: space._id.toString(),
              viewerEmail: email,
              extraInfo: `${intel.narrative}\n\n${intel.recommendation}`,
            }).catch(err => console.error('[SpaceIntel] Teams silent fail:', err));

          } catch (err) {
            console.error('[SpaceIntel] outer silent fail:', err);
          }
        })();
      }
    }
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Track error:', error);
    return NextResponse.json({ success: true, warning: 'Track failed silently' });
  }
}