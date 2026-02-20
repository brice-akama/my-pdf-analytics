// app/api/view/[token]/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { notifyDocumentView } from '@/lib/notifications';
import {
  sendDocumentOpenedEmail,
  sendDocumentCompletedEmail,
  sendDocumentRevisitedEmail,
  hasNotificationBeenSent,
  markNotificationSent,
} from '@/lib/documentNotifications';
import {
  notifyDocumentViewed,
  notifyDocumentCompleted,
  notifySessionSummary,
} from '@/lib/integrations/slack';
import {
  syncDocumentOpenedToHubSpot,
  syncDocumentCompletedToHubSpot,
  syncEngagementSummaryToHubSpot,
  isHubSpotConnected,
} from '@/lib/integrations/hubspotSync';

// ── Helper: get owner email from userId ──────────────────────────
async function getOwnerEmail(userId: string, db: any) {
  const profile = await db.collection('profiles').findOne({ user_id: userId });
  return {
    email: profile?.email || null,
    name: profile?.full_name || profile?.first_name || null,
  };
}

// ── IP Geolocation ───────────────────────────────────────────────
async function getLocationFromIP(ip: string) {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
    return null;
  }
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'DocMetrics-Analytics/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.error) return null;
    return {
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      region: data.region,
      lat: data.latitude,
      lng: data.longitude,
      timezone: data.timezone,
      org: data.org,
    };
  } catch {
    return null;
  }
}

// ── Device detection ─────────────────────────────────────────────
function detectDevice(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) return 'mobile';
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
  return 'desktop';
}

// ── Main handler ─────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();

    const {
      event,
      page,
      scrollDepth,
      timeSpent,
      totalPages,
      metadata,
      sessionId,
      email,        // ← NOW EXTRACTED
    } = body;

    if (!event) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }

    const db = await dbPromise;

    const share = await db.collection('shares').findOne({
      shareToken: token,
      active: true,
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // ── IP & identity ────────────────────────────────────────────
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');

    let ip = 'unknown';
    if (forwardedFor) ip = forwardedFor.split(',')[0].trim();
    else if (realIP) ip = realIP;
    else if (cfIP) ip = cfIP;

    const userAgent = request.headers.get('user-agent') || 'unknown';
    const device = detectDevice(userAgent);
    const viewerId = Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);
    const now = new Date();
    const currentSessionId = sessionId || `${viewerId}-${Date.now()}`;
    const documentId = share.documentId.toString();

    // ── Geolocation (only for session_start to avoid rate limits) ─
    let location = null;
    if (event === 'session_start' && ip !== 'unknown') {
      location = await getLocationFromIP(ip);
    }

    // ── If email provided, register it against this viewer ────────
    // This is the KEY fix — email gets stored so analytics can join
    if (email) {
      await db.collection('shares').updateOne(
        { _id: share._id },
        {
          $addToSet: { 'tracking.viewerEmails': email },
          $set: {
            [`tracking.emailByViewerId.${viewerId}`]: email,
            updatedAt: now,
          },
        }
      );

      // Also keep a viewer identity map for cross-session lookups
      await db.collection('viewer_identities').updateOne(
        { viewerId, documentId },
        {
          $set: {
            viewerId,
            documentId,
            shareToken: token,
            email,
            device,
            lastSeen: now,
          },
          $setOnInsert: { firstSeen: now },
        },
        { upsert: true }
      );
    }

    // ── Route events ─────────────────────────────────────────────
    switch (event) {

      // ── HEATMAP CLICK ─────────────────────────────────────────
      case 'heatmap_click': {
        const { x, y, pageNum, elementType } = body;
        if (x === undefined || y === undefined) break;
        await db.collection('heatmap_events').insertOne({
          documentId,
          shareToken: token,
          type: 'click',
          x: parseFloat(x),
          y: parseFloat(y),
          page: pageNum || page || 1,
          elementType: elementType || 'unknown',
          viewerId,
          sessionId: currentSessionId,
          email: email || null,
          timestamp: now,
        });
        break;
      }

      // ── HEATMAP MOUSE MOVE ────────────────────────────────────
      case 'heatmap_move': {
        const { points, pageNum } = body;
        if (!points || !Array.isArray(points) || points.length === 0) break;
        await db.collection('heatmap_events').insertOne({
          documentId,
          shareToken: token,
          type: 'move',
          points: points.slice(0, 200),
          page: pageNum || page || 1,
          viewerId,
          sessionId: currentSessionId,
          email: email || null,
          timestamp: now,
        });
        break;
      }

      // ── HEATMAP SCROLL STOP ───────────────────────────────────
      case 'heatmap_scroll_position': {
        const { y, pageNum, dwellTime } = body;
        if (y === undefined) break;
        await db.collection('heatmap_events').insertOne({
          documentId,
          shareToken: token,
          type: 'scroll_stop',
          y: parseFloat(y),
          page: pageNum || page || 1,
          dwellTime: dwellTime || 1500,
          viewerId,
          sessionId: currentSessionId,
          email: email || null,
          timestamp: now,
        });
        break;
      }

      // ── INTENT SIGNAL ─────────────────────────────────────────
      case 'intent_signal': {
        const { signal, value, pageNum } = body;
        if (!signal) break;

        const intentWeights: Record<string, number> = {
          copy_attempt: 10,
          text_selected: 5,
          tab_hidden: 2,
          tab_visible: 1,
          zoom_in: 4,
          signature_hover: 8,
        };
        const weight = intentWeights[signal] || 1;

        await db.collection('intent_signals').insertOne({
          documentId,
          shareToken: token,
          signal,
          value: value || null,
          page: pageNum || page || 1,
          viewerId,
          sessionId: currentSessionId,
          email: email || null,
          weight,
          timestamp: now,
        });

        // Update intent score on viewer_identities
        await db.collection('viewer_identities').updateOne(
          { viewerId, documentId },
          {
            $inc: { intentScore: weight },
            $push: {
              intentSignals: {
                signal,
                value: value || null,
                page: pageNum || page || 1,
                timestamp: now,
              },
            } as any,
            $set: { lastSeen: now, email: email || null },
          },
          { upsert: true }
        );
        break;
      }

     // ── PAGE VIEW ──────────────────────────────────────────────
      case 'page_view': {
        if (!page || isNaN(page)) break;
        const pageNum = parseInt(page);

        // Track which pages this session has visited (for completion rate)
        await db.collection('analytics_sessions').updateOne(
          { sessionId: currentSessionId },
          { $addToSet: { pagesViewed: pageNum } }
        );

        // Write to shares (for aggregate page analytics)
        await db.collection('shares').updateOne(
          { _id: share._id },
          {
            $inc: {
              [`tracking.pageViews.page_${pageNum}`]: 1,
              'tracking.totalPageViews': 1,
            },
            $set: {
              [`tracking.pageViewsByViewer.${viewerId}.page_${pageNum}`]: now,
              [`tracking.pageViewsByViewer.${viewerId}.lastPage`]: pageNum,
              updatedAt: now,
            },
            $addToSet: {
              'tracking.uniqueViewers': viewerId,
            },
          }
        );

        // ── THE KEY WRITE: analytics_logs ─────────────────────────
        await db.collection('analytics_logs').insertOne({
          documentId,
          shareToken: token,
          action: 'page_view',
          pageNumber: pageNum,
          viewTime: 0,
          scrollDepth: scrollDepth || 0,
          email: email || null,
          viewerId,
          sessionId: currentSessionId,
          device,
          timestamp: now,
          userAgent,
          ip,
          location,
        });

        // Notify owner on page 1 (first view)
        if (pageNum === 1 && share.userId) {
          const viewer = await db.collection('share_viewers').findOne({
            shareId: share._id.toString(),
            viewerId,
          });

          if (viewer?.email && !viewer.notifiedOwner) {
            await notifyDocumentView(
              share.userId,
              share.documentSnapshot?.originalFilename || 'Document',
              documentId,
              viewer.name || viewer.email,
              viewer.email
            ).catch(err => console.error('Notification error:', err));

            await db.collection('share_viewers').updateOne(
              { _id: viewer._id },
              { $set: { notifiedOwner: true } }
            );
          }
        }

        // ── Fetch document ONCE — reused by email, HubSpot, Slack ─
        const docForPage = await db.collection('documents').findOne({ _id: share.documentId });
        const isLastPage = docForPage && pageNum === docForPage.numPages;

        // ── NOTIFICATION: Document Completed (email) ──────────────
        if (isLastPage && share.userId) {
          const alreadySentCompleted = await hasNotificationBeenSent('completed', currentSessionId, documentId);

          if (!alreadySentCompleted) {
            const owner = await getOwnerEmail(share.userId, db);

            if (owner.email) {
              const viewerLogs = await db.collection('analytics_logs').find({
                documentId,
                action: 'page_view',
                ...(email ? { email } : { viewerId }),
              }).toArray();

              const totalTimeSeconds = viewerLogs.reduce(
                (sum: number, l: any) => sum + (l.viewTime || 0), 0
              );

              const pageTimesMap = new Map<number, number>();
              viewerLogs.forEach((l: any) => {
                const existing = pageTimesMap.get(l.pageNumber) || 0;
                pageTimesMap.set(l.pageNumber, existing + (l.viewTime || 0));
              });
              const topPages = Array.from(pageTimesMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([p, t]) => ({ page: p, timeSpent: t }));

              const intentLevel = totalTimeSeconds > 300 ? 'high' : totalTimeSeconds > 120 ? 'medium' : 'low';

              sendDocumentCompletedEmail({
                ownerEmail: owner.email,
                viewerEmail: email || undefined,
                viewerName: email?.split('@')[0] || undefined,
                documentName: docForPage.originalFilename || 'Your document',
                documentId,
                totalPages: docForPage.numPages,
                totalTimeSeconds,
                topPages,
                intentLevel,
              }).catch(err => console.error('📧 Completed email error:', err));

              await markNotificationSent('completed', currentSessionId, documentId);
            }
          }
        }

        // ── HUBSPOT SYNC: Document Completed ──────────────────────
        if (email && isLastPage && share.userId) {
          const hubSpotEnabled = await isHubSpotConnected(share.userId);
          if (hubSpotEnabled) {
            const hsViewerLogs = await db.collection('analytics_logs').find({
              documentId,
              action: 'page_view',
              ...(email ? { email } : { viewerId }),
            }).toArray();
            const hsTotalTime = hsViewerLogs.reduce((sum: number, l: any) => sum + (l.viewTime || 0), 0);
            const hsPageMap = new Map<number, number>();
            hsViewerLogs.forEach((l: any) => {
              hsPageMap.set(l.pageNumber, (hsPageMap.get(l.pageNumber) || 0) + (l.viewTime || 0));
            });
            const hsTopPages = Array.from(hsPageMap.entries())
              .sort((a, b) => b[1] - a[1]).slice(0, 3)
              .map(([p, t]) => ({ page: p, timeSpent: t }));
            const hsIntentLevel = hsTotalTime > 300 ? 'high' : hsTotalTime > 120 ? 'medium' : 'low';

            syncDocumentCompletedToHubSpot({
              userId: share.userId,
              viewerEmail: email,
              documentName: docForPage.originalFilename || 'Document',
              documentId,
              totalPages: docForPage.numPages || 1,
              totalTimeSeconds: hsTotalTime,
              topPages: hsTopPages,
              intentLevel: hsIntentLevel,
            }).catch(err => console.error('HubSpot sync error:', err));
          }
        }

        // ── SLACK: Document Completed ──────────────────────────────
        if (isLastPage && share.userId) {
          const slackViewerLogs = await db.collection('analytics_logs').find({
            documentId,
            action: 'page_view',
            ...(email ? { email } : { viewerId }),
          }).toArray();

          const slackTotalTime = slackViewerLogs.reduce(
            (sum: number, l: any) => sum + (l.viewTime || 0), 0
          );

          const slackPageMap = new Map<number, number>();
          slackViewerLogs.forEach((l: any) => {
            const existing = slackPageMap.get(l.pageNumber) || 0;
            slackPageMap.set(l.pageNumber, existing + (l.viewTime || 0));
          });
          const slackTopPages = Array.from(slackPageMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([p, t]) => ({ page: p, timeSpent: t }));

          const slackIntentLevel = slackTotalTime > 300 ? 'high' : slackTotalTime > 120 ? 'medium' : 'low';

          notifyDocumentCompleted({
            userId: share.userId,
            documentName: docForPage.originalFilename || 'Your document',
            viewerEmail: email || 'Anonymous viewer',
            totalTimeSeconds: slackTotalTime,
            totalPages: docForPage.numPages,
            topPages: slackTopPages,
            intentLevel: slackIntentLevel as 'high' | 'medium' | 'low',
            documentId,
          }).catch(err => console.error('Slack completed error:', err));
        }

        break;
      }

      // ── REAL-TIME PRESENCE ────────────────────────────────────────
case 'presence_ping': {
  await db.collection('viewer_presence').updateOne(
    { viewerId, documentId },
    {
      $set: {
        viewerId,
        documentId,
        shareToken: token,
        email: email || null,
        sessionId: currentSessionId,
        lastPing: now,
        page: page || 1,
        device,
        isActive: true,
      },
      $setOnInsert: { firstSeen: now },
    },
    { upsert: true }
  );
  break;
}

      // ── PAGE TIME (time spent on a specific page) ──────────────
      case 'page_time': {
        if (!page || isNaN(page) || !timeSpent || isNaN(timeSpent)) break;
        const pageNum = parseInt(page);
        const validTime = Math.min(parseInt(timeSpent), 300); // cap at 5 min per page

        // Write to shares for aggregate
        await db.collection('shares').updateOne(
          { _id: share._id },
          {
            $inc: {
              [`tracking.timePerPage.page_${pageNum}`]: validTime,
            },
            $set: {
              [`tracking.timePerPageByViewer.${viewerId}.page_${pageNum}`]: validTime,
              updatedAt: now,
            },
          }
        );

        // ── Update the existing analytics_log for this page/viewer ─
        // Try to update the most recent page_view log for this viewer+page
        // If none exists, insert a new record
        // Scope to CURRENT SESSION only — prevents cross-session time corruption
        const existing = await db.collection('analytics_logs').findOne({
          documentId,
          viewerId,
          sessionId: currentSessionId, // ← KEY: only current session
          action: 'page_view',
          pageNumber: pageNum,
        }, { sort: { timestamp: -1 } });

        if (existing) {
          await db.collection('analytics_logs').updateOne(
            { _id: existing._id },
            {
              $inc: { viewTime: validTime },
              $set: { email: email || existing.email },
            }
          );
        } else {
          // No page_view event was recorded (edge case), insert standalone
          await db.collection('analytics_logs').insertOne({
            documentId,
            shareToken: token,
            action: 'page_view',
            pageNumber: pageNum,
            viewTime: validTime,
            scrollDepth: 0,
            email: email || null,
            viewerId,
            sessionId: currentSessionId,
            device,
            timestamp: now,
            userAgent,
            ip,
          });
        }
        break;
      }

      // ── SCROLL ────────────────────────────────────────────────
      case 'scroll': {
        console.log('📜 [SCROLL EVENT]', { 
    page, 
    scrollDepth, 
    depth: Math.min(parseFloat(scrollDepth), 100),
    viewerId,
    sessionId: currentSessionId 
  });
        if (!page || isNaN(page) || scrollDepth === undefined || isNaN(scrollDepth)) break;
        const pageNum = parseInt(page);
        const depth = Math.min(parseFloat(scrollDepth), 100);

        // Write to shares
        await db.collection('shares').updateOne(
          { _id: share._id },
          {
            $max: {
              [`tracking.scrollDepth.page_${pageNum}`]: depth,
              [`tracking.scrollDepthByViewer.${viewerId}.page_${pageNum}`]: depth,
            },
            $set: { updatedAt: now },
          }
        );

        // Update the analytics_log for this page to record max scroll depth
      // Find the current session's page_view log, then update it
        const pageLog = await db.collection('analytics_logs').findOne(
          {
            documentId,
            viewerId,
            sessionId: currentSessionId, // scope to current session
            action: 'page_view',
            pageNumber: pageNum,
          },
          { sort: { timestamp: -1 } }
        );

        if (pageLog) {
          await db.collection('analytics_logs').updateOne(
            { _id: pageLog._id },
            {
              $max: { scrollDepth: depth },
              $set: { email: email || null },
            }
          );
        }
        break;
      }

      // ── TOTAL TIME SPENT (heartbeat every 30s) ─────────────────
      case 'time_spent': {
        const validTime = timeSpent && !isNaN(timeSpent)
          ? Math.min(parseInt(timeSpent), 60)
          : 0;
        if (validTime <= 0) break;

        await db.collection('shares').updateOne(
          { _id: share._id },
          {
            $inc: {
              'tracking.totalTimeSpent': validTime,
              [`tracking.timeSpentByViewer.${viewerId}`]: validTime,
            },
            $set: { updatedAt: now },
          }
        );
        break;
      }

      // ── SESSION START ──────────────────────────────────────────
      case 'session_start': {
        // ── Detect revisit BEFORE creating new session ────────────
        const previousSession = await db.collection('analytics_sessions').findOne({
          documentId,
          viewerId,
          sessionId: { $ne: currentSessionId },
        });
        const isRevisit = !!previousSession;

        console.log('🔄 [REVISIT CHECK]', {
          viewerId,
          documentId,
          currentSessionId,
          previousSessionFound: !!previousSession,
          previousSessionId: previousSession?.sessionId,
          isRevisit,
        });

        // Update viewer identity — increment visit count, boost intent if returning
        // First ensure document exists (setOnInsert only), then increment separately
        await db.collection('viewer_identities').updateOne(
          { viewerId, documentId },
          {
            $setOnInsert: {
              firstSeen: now,
              visitCount: 0,
              intentScore: 0,
            },
          },
          { upsert: true }
        );

        // Now safely increment without conflict
        await db.collection('viewer_identities').updateOne(
          { viewerId, documentId },
          {
            $inc: {
              visitCount: 1,
              intentScore: isRevisit ? 8 : 0,
            },
            $set: {
              lastSeen: now,
              device,
              email: email || null,
              isRevisit,
            },
          }
        );

        // Write to analytics_logs as document_viewed
        await db.collection('analytics_logs').insertOne({
          documentId,
          shareToken: token,
          action: 'document_viewed',
          email: email || null,
          viewerId,
          sessionId: currentSessionId,
          device,
          timestamp: now,
          userAgent,
          ip,
          location,
        });

        // Write to shares unique viewers
        await db.collection('shares').updateOne(
          { _id: share._id },
          {
            $addToSet: { 'tracking.uniqueViewers': viewerId },
            $inc: { 'tracking.views': 1 },
            $set: {
              'tracking.lastViewedAt': now,
              updatedAt: now,
            },
          }
        );

        // Write to document_views collection (for legacy analytics)
        await db.collection('document_views').insertOne({
          documentId,
          shareToken: token,
          viewerId,
          email: email || null,
          sessionId: currentSessionId,
          device,
          country: location?.country || null,
          city: location?.city || null,
          viewedAt: now,
          userAgent,
          ip,
          pagesViewed: 0,
          timeSpent: 0,
          downloaded: false,
        });

        // Create/update the session record
        await db.collection('analytics_sessions').insertOne({
          sessionId: currentSessionId,
          shareId: share._id.toString(),
          documentId,
          shareToken: token,
          viewerId,
          email: email || null,
          startedAt: now,
          endedAt: null,
          duration: 0,
          pagesViewed: [],
          device,
          location,
          isRevisit,
        });

        // ── NOTIFICATION: Document Opened ───────────────────────
  // Only fire once per session and only if owner has email
  const alreadySent = await hasNotificationBeenSent('opened', currentSessionId, documentId);
  
  if (!alreadySent && share.userId) {
    const owner = await getOwnerEmail(share.userId, db);
    
    if (owner.email) {
      // Get document name
      const doc = await db.collection('documents').findOne({ _id: share.documentId });
      const docName = doc?.originalFilename || 'Your document';

      // Check if this is the VERY first view ever on this document
      const previousSessions = await db.collection('analytics_sessions').countDocuments({
        documentId,
        sessionId: { $ne: currentSessionId },
      });
      const isFirstEverView = previousSessions === 0;

      // Fire and forget — don't await to avoid slowing down the response
      sendDocumentOpenedEmail({
        ownerEmail: owner.email,
        ownerName: owner.name,
        viewerEmail: email || undefined,
        viewerName: email?.split('@')[0] || undefined,
        documentName: docName,
        documentId,
        location: location || undefined,
        device,
        shareToken: token,
        isFirstEverView,
      }).catch(err => console.error('📧 Opened email error:', err));

      // Mark as sent so we don't send again for this session
      await markNotificationSent('opened', currentSessionId, documentId);
    }
  }

  // ── NOTIFICATION: Revisit ───────────────────────────────
  if (isRevisit && share.userId) {
    const alreadySentRevisit = await hasNotificationBeenSent('revisit', currentSessionId, documentId);

    if (!alreadySentRevisit) {
      const owner = await getOwnerEmail(share.userId, db);

      if (owner.email) {
        const doc = await db.collection('documents').findOne({ _id: share.documentId });
        const docName = doc?.originalFilename || 'Your document';

        // Count total visits for this viewer
        const visitCount = await db.collection('analytics_sessions').countDocuments({
          documentId,
          viewerId,
        });

        // Get previous session to calculate last visit time
        const prevSession = await db.collection('analytics_sessions').findOne(
          { documentId, viewerId, sessionId: { $ne: currentSessionId } },
          { sort: { startedAt: -1 } }
        );
        const lastVisitAgo = prevSession?.startedAt
          ? formatTimeAgo(new Date(prevSession.startedAt))
          : undefined;

        sendDocumentRevisitedEmail({
          ownerEmail: owner.email,
          viewerEmail: email || undefined,
          viewerName: email?.split('@')[0] || undefined,
          documentName: docName,
          documentId,
          visitCount,
          lastVisitAgo,
          device,
          location: location || undefined,
        }).catch(err => console.error('📧 Revisit email error:', err));

        await markNotificationSent('revisit', currentSessionId, documentId);
      }
    }
  }

   // ── HUBSPOT SYNC: Document Opened ──────────────────────
  if (email && share.userId) {
    const hubSpotEnabled = await isHubSpotConnected(share.userId);
    if (hubSpotEnabled) {
      syncDocumentOpenedToHubSpot({
        userId: share.userId,
        viewerEmail: email,
         documentName: (await db.collection('documents').findOne({ _id: share.documentId }))?.originalFilename || 'Your document',
        documentId,
        device,
        location: location || undefined,
        isRevisit,
        visitCount: isRevisit
          ? await db.collection('analytics_sessions').countDocuments({ documentId, viewerId })
          : 1,
      }).catch(err => console.error('HubSpot sync error:', err));
    }
  }

   // ── Slack: Document Opened ─────────────────────────────────
  if (share.userId) {
    const slackDoc = await db.collection('documents').findOne({ _id: share.documentId });
    const slackDocName = slackDoc?.originalFilename || 'Your document';

    // Count previous sessions to get visit number
    const previousVisits = await db.collection('analytics_sessions').countDocuments({
      documentId,
      viewerId,
      sessionId: { $ne: currentSessionId },
    });
    const visitCount = previousVisits + 1;

    const locationStr = location
      ? [location.city, location.country].filter(Boolean).join(', ')
      : undefined;

    notifyDocumentViewed({
      userId: share.userId,
      documentName: slackDocName,
      viewerName: email?.split('@')[0] || 'Anonymous',
      viewerEmail: email || 'Anonymous viewer',
      duration: 0, // session just started, no duration yet
      location: locationStr,
      device,
      documentId,
      pageCount: slackDoc?.numPages,
      isRevisit,
      visitCount,
    }).catch(err => console.error('Slack viewed error:', err));
  }



        break;
      }

      // ── SESSION END ───────────────────────────────────────────
      case 'session_end': {
        const duration = timeSpent && !isNaN(timeSpent)
          ? Math.min(parseInt(timeSpent), 7200) // cap at 2 hours
          : 0;

        await db.collection('analytics_sessions').updateOne(
          { sessionId: currentSessionId },
          { $set: { endedAt: now, duration } }
        );

        // Update document_views with final time spent
        await db.collection('document_views').updateOne(
          { sessionId: currentSessionId },
          { $set: { timeSpent: duration } }
        );

        // Update shares average view time
        await db.collection('shares').updateOne(
          { _id: share._id },
          {
            $inc: { 'tracking.totalSessions': 1 },
            $set: { updatedAt: now },
          }
        );

        // ── HUBSPOT SYNC: Session summary ──────────────────────
  if (share.userId) {
    const hubSpotEnabled = await isHubSpotConnected(share.userId);
    if (hubSpotEnabled) {
      // Get email from viewer_identities since session_end may not have it
      const identity = await db.collection('viewer_identities').findOne({
        viewerId,
        documentId,
      });
      const viewerEmailForSync = email || identity?.email;

      if (viewerEmailForSync) {
        const session = await db.collection('analytics_sessions').findOne({
          sessionId: currentSessionId,
        });
        const doc = await db.collection('documents').findOne({ _id: share.documentId });

        syncEngagementSummaryToHubSpot({
          userId: share.userId,
          viewerEmail: viewerEmailForSync,
          documentName: doc?.originalFilename || 'Document',
          documentId,
          sessionDurationSeconds: duration,
          pagesViewed: session?.pagesViewed || [],
          totalPages: doc?.numPages || 1,
          device,
        }).catch(err => console.error('HubSpot sync error:', err));
      }
    }
  }
  // ── Slack: Session Summary ─────────────────────────────────
if (share.userId && duration > 10) {
    const slackDoc = await db.collection('documents').findOne({ _id: share.documentId });

    // Get all pages this viewer viewed in this session
    const sessionLogs = await db.collection('analytics_logs').find({
      documentId,
      sessionId: currentSessionId,
      action: 'page_view',
    }).toArray();
    const pagesViewed = [...new Set(sessionLogs.map((l: any) => l.pageNumber))];

    const locationStr = location
      ? [location.city, location.country].filter(Boolean).join(', ')
      : undefined;

    // Only fire session summary if NOT already sent a "completed" notification
    // (avoids duplicate Slack messages when viewer reads entire doc)
    const alreadyCompleted = slackDoc && pagesViewed.length === slackDoc.numPages;

    if (!alreadyCompleted) {
      notifySessionSummary({
        userId: share.userId,
        documentName: slackDoc?.originalFilename || 'Your document',
        viewerEmail: email || 'Anonymous viewer',
        sessionDurationSeconds: totalTimeSeconds,
        pagesViewed,
        totalPages: slackDoc?.numPages || 1,
        device,
        location: locationStr,
        documentId,
      }).catch(err => console.error('Slack session summary error:', err));
    }
  }

        break;
      }

      // ── DOWNLOAD ──────────────────────────────────────────────
      case 'download_attempt': {
        const allowed = metadata?.allowed || false;
        await db.collection('shares').updateOne(
          { _id: share._id },
          {
            $inc: {
              'tracking.downloadAttempts': 1,
              ...(allowed
                ? { 'tracking.downloads': 1 }
                : { 'tracking.blockedDownloads': 1 }),
            },
            $push: {
              'tracking.downloadEvents': {
                viewerId,
                email: email || null,
                timestamp: now,
                allowed,
              },
            } as any,
            $set: { updatedAt: now },
          }
        );

        // Update document_views downloaded flag
        if (allowed) {
          await db.collection('document_views').updateOne(
            { sessionId: currentSessionId },
            { $set: { downloaded: true } }
          );
        }
        break;
      }

      case 'download_success': {
        await db.collection('shares').updateOne(
          { _id: share._id },
          {
            $inc: { 'tracking.downloads': 1 },
            $push: {
              'tracking.downloadEvents': {
                viewerId,
                email: email || null,
                timestamp: now,
                filename: metadata?.filename || 'unknown',
                success: true,
              },
            } as any,
          }
        );

        await db.collection('document_views').updateOne(
          { sessionId: currentSessionId },
          { $set: { downloaded: true } }
        );
        break;
      }

      // ── PRINT ─────────────────────────────────────────────────
      case 'print_attempt': {
        const allowed = metadata?.allowed || false;
        await db.collection('shares').updateOne(
          { _id: share._id },
          {
            $inc: {
              'tracking.printAttempts': 1,
              ...(allowed
                ? { 'tracking.prints': 1 }
                : { 'tracking.blockedPrints': 1 }),
            },
            $push: {
              'tracking.printEvents': {
                viewerId,
                email: email || null,
                timestamp: now,
                allowed,
              },
            } as any,
            $set: { updatedAt: now },
          }
        );
        break;
      }

      default:
        console.log('⚠️ Unknown event:', event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Tracking error:', error);
    return NextResponse.json(
      {
        error: 'Tracking failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


function formatTimeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours ago`;
  return `${Math.floor(secs / 86400)} days ago`;
}