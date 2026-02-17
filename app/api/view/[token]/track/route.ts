// app/api/view/[token]/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { notifyDocumentView } from '@/lib/notifications';

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