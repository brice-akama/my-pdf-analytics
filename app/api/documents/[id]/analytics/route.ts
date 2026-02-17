// app/api/documents/[id]/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // Verify ownership
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const tracking = document.tracking || {};
    const analyticsData = document.analytics || {};

    // ── Core views ──────────────────────────────────────────────
// Step 1: Get ALL sessions first (needed for totalViews calculation)
const allSessions = await db.collection('analytics_sessions')
  .find({ documentId: id })
  .toArray();

// Step 2: Get views from BOTH sources for backward compatibility
const oldViews = await db.collection('document_views')
  .find({ documentId })
  .sort({ viewedAt: -1 })
  .toArray();

// Step 3: Get modern analytics logs
const analyticsLogs = await db.collection('analytics_logs')
  .find({ 
    documentId: id,
    action: { $in: ['document_viewed', 'page_view'] }
  })
  .toArray();

// Step 4: Combine both sources for totalViews
const totalViews = Math.max(
  tracking.views || 0,
  oldViews.length,
  analyticsLogs.filter((l: any) => l.action === 'document_viewed').length,
  allSessions.length // Now it's safe to use allSessions
);

// Step 5: Get unique viewers from multiple sources
const uniqueViewerEmails = new Set<string>();

// From old views
oldViews.forEach((v: any) => {
  if (v.viewerEmail) uniqueViewerEmails.add(v.viewerEmail);
  else if (v.viewerId) uniqueViewerEmails.add(v.viewerId);
});

// From analytics logs
analyticsLogs.forEach((l: any) => {
  if (l.email) uniqueViewerEmails.add(l.email);
  else if (l.viewerId) uniqueViewerEmails.add(l.viewerId);
});

// From sessions
allSessions.forEach((s: any) => {
  if (s.email) uniqueViewerEmails.add(s.email);
  else if (s.viewerId) uniqueViewerEmails.add(s.viewerId);
});

const uniqueViewers = Math.max(
  tracking.uniqueVisitors?.length || 0,
  uniqueViewerEmails.size
);

// Step 6: Calculate average time (use both old and new data)
// Step 6: Calculate average time from ALL sources
const totalTimeFromOldViews = oldViews.reduce(
  (sum: number, v: any) => sum + (v.timeSpent || 0), 
  0
);

const totalTimeFromLogs = analyticsLogs
  .filter((l: any) => l.action === 'page_view')
  .reduce((sum: number, l: any) => sum + (l.viewTime || 0), 0);

const totalTimeFromSessions = allSessions.reduce(
  (sum: number, s: any) => sum + (s.duration || 0),
  0
);

// Use the best available source
// ── Per-session average (changes each visit — this is correct) ──
const sessionsWithDuration = allSessions.filter((s: any) => s.duration > 0);

const avgTimePerSession = sessionsWithDuration.length > 0
  ? Math.round(
      sessionsWithDuration.reduce((sum: number, s: any) => sum + s.duration, 0)
      / sessionsWithDuration.length
    )
  : totalTimeFromLogs > 0
  ? Math.round(totalTimeFromLogs / Math.max(allSessions.length, 1))
  : Math.round(totalTimeFromOldViews / (oldViews.length || 1));

// ── Per-viewer total — calculated from page_time logs (reliable source) ──
// Sessions may have duration=0 if session_end never fires.
// page_time logs are written per-page and are always accurate.
const allPageTimeLogs = await db.collection('analytics_logs').find({
  documentId: id,
  action: 'page_view',
}).toArray();

// Group total time by viewer key (email takes priority over viewerId)
const viewerTotalTimes = new Map<string, number>();
allPageTimeLogs.forEach((log: any) => {
  const key = log.email || log.viewerId;
  if (!key) return;
  viewerTotalTimes.set(key, (viewerTotalTimes.get(key) || 0) + (log.viewTime || 0));
});

// If page_time logs are empty, fall back to session durations
if (viewerTotalTimes.size === 0) {
  allSessions.forEach((s: any) => {
    const key = s.email || s.viewerId;
    if (!key) return;
    viewerTotalTimes.set(key, (viewerTotalTimes.get(key) || 0) + (s.duration || 0));
  });
}

const avgTotalTimePerViewer =
  viewerTotalTimes.size > 0
    ? Math.round(
        Array.from(viewerTotalTimes.values()).reduce((a, b) => a + b, 0) /
        viewerTotalTimes.size
      )
    : avgTimePerSession;

const averageTimeSeconds = avgTimePerSession; // keep existing field name

// Step 7: Calculate completion rate
// Check sessions where all pages were viewed

const completedSessionsCount = allSessions.filter((s: any) => {
  const pagesViewed = s.pagesViewed?.length || 0;
  return pagesViewed >= document.numPages;
}).length;

// Also check from analytics_logs — viewers who hit the last page
const lastPageLogs = await db.collection('analytics_logs').find({
  documentId: id,
  action: 'page_view',
  pageNumber: document.numPages,
}).toArray();
const uniqueLastPageViewers = new Set(lastPageLogs.map((l: any) => l.viewerId || l.email)).size;

const completedViews = Math.max(
  oldViews.filter((v: any) => v.pagesViewed >= document.numPages).length,
  completedSessionsCount,
  uniqueLastPageViewers
);
const completionRate = totalViews ? Math.round((completedViews / totalViews) * 100) : 0;


// ── Views by last 7 days ─────────────────────────────────────
const today = new Date();
const viewsByDate = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(today);
  date.setDate(today.getDate() - (6 - i));
  const start = new Date(date.setHours(0, 0, 0, 0));
  const end = new Date(date.setHours(23, 59, 59, 999));
  
  // Count from both sources
  const oldViewsCount = oldViews.filter((v: any) => {
    const viewedAt = new Date(v.viewedAt);
    return viewedAt >= start && viewedAt <= end;
  }).length;
  
  const newLogsCount = analyticsLogs.filter((l: any) => {
    const logTime = new Date(l.timestamp);
    return logTime >= start && logTime <= end && l.action === 'document_viewed';
  }).length;
  
  const count = Math.max(oldViewsCount, newLogsCount);
  
  return { date: `${date.getMonth() + 1}/${date.getDate()}`, views: count };
});

// ── Shares & downloads ───────────────────────────────────────
const shares = await db.collection('shares')
  .find({ documentId })
  .toArray();

const totalShares = tracking.shares || shares.length;
const downloads = tracking.downloads || oldViews.filter((v: any) => v.downloaded).length;

    // ── Page engagement (aggregate) ──────────────────────────────
    const pageEngagement = await Promise.all(
      Array.from({ length: document.numPages }, async (_, i) => {
        const pageNum = i + 1;

        // ── Use analytics_logs as the ONLY source of truth ─────────
        // The old shares.tracking.timePerPage data is corrupted with
        // accumulated garbage values — never trust it for time calculations
        const pageLogs = await db.collection('analytics_logs').find({
          documentId: id,
          action: 'page_view',
          pageNumber: pageNum,
        }).toArray();

        // Sum ALL time across all sessions and viewers for this page
        const totalTimeOnPage = pageLogs.reduce(
          (sum: number, l: any) => sum + (l.viewTime || 0), 0
        );

        // Count UNIQUE viewers (not raw log count — revisits count once)
        const uniqueViewerSet = new Set(
          pageLogs.map((l: any) => l.email || l.viewerId).filter(Boolean)
        );
        const pageViews = uniqueViewerSet.size || pageLogs.length;

        // Average = total time / unique viewers
        const avgTime = pageViews > 0
          ? Math.round(totalTimeOnPage / pageViews)
          : 0;

        const percentage = totalViews
          ? Math.round((pageViews / totalViews) * 100)
          : 0;

        return {
          page: pageNum,
          views: percentage,
          avgTime,
          totalViews: pageViews,
          totalTime: totalTimeOnPage,
        };
      })
    );

    // ── Per-recipient page tracking (NEW) ────────────────────────
    // Collect all unique viewer emails/IDs across shares
const allViewerEmails: string[] = [];
    for (const share of shares) {
      const emails = share.tracking?.viewerEmails || [];
      allViewerEmails.push(...emails);
    }

    // Also pull viewer IDs from analytics_sessions for anonymous viewers
    const sessionViewerIds = [...new Set(allSessions.map((s: any) => s.viewerId).filter(Boolean))];

    // Map viewer IDs to emails where possible
    const viewerIdentities = await db.collection('viewer_identities')
      .find({ documentId: id })
      .toArray();

    const identityMap = new Map<string, string>();
    viewerIdentities.forEach((v: any) => {
      if (v.email) identityMap.set(v.viewerId, v.email);
    });

    // Add anonymous viewers as viewerId strings if no email
    for (const vid of sessionViewerIds) {
      const email = identityMap.get(vid);
      if (email) {
        allViewerEmails.push(email);
      } else {
        allViewerEmails.push(`anon:${vid}`); // use as fallback key
      }
    }

    const uniqueEmailsForTracking = [...new Set(allViewerEmails)];

    const recipientPageTracking = await Promise.all(
      uniqueEmailsForTracking.map(async (emailOrId) => {
        const isAnon = emailOrId.startsWith('anon:');
        const viewerId = isAnon ? emailOrId.replace('anon:', '') : null;
        const email = isAnon ? null : emailOrId;

        // Get all page-level logs for this viewer — match by email OR viewerId
        const viewerLogs = await db.collection('analytics_logs')
          .find({
            documentId: id,
            action: 'page_view',
            ...(email ? { email } : { viewerId }),
          })
          .sort({ timestamp: 1 })
          .toArray();

       const firstLog = await db.collection('analytics_logs').findOne({
          documentId: id,
          action: 'document_viewed',
          ...(email ? { email } : { viewerId }),
        });

        const totalTime = viewerLogs.reduce((sum, l) => sum + (l.viewTime || 0), 0);

        // Build per-page data

        const pageData = Array.from({ length: document.numPages }, (_, i) => {
          const pageNum = i + 1;
          const pageLogs = viewerLogs.filter((l: any) => l.pageNumber === pageNum);
          
          // Sum time across ALL sessions for this viewer+page (accumulates revisits)
          const timeOnPage = pageLogs.reduce((sum: number, l: any) => sum + (l.viewTime || 0), 0);
          
          // Take the highest scroll depth ever reached across all sessions
          const maxScroll = pageLogs.length > 0
            ? Math.max(...pageLogs.map((l: any) => l.scrollDepth || 0))
            : 0;

          // Count unique sessions this viewer visited this page (not raw log count)
          const uniqueSessions = new Set(pageLogs.map((l: any) => l.sessionId)).size;

          return {
            page: pageNum,
            visited: pageLogs.length > 0,
            timeSpent: Math.min(timeOnPage, 1800), // cap at 30min total across all sessions
            scrollDepth: maxScroll,
            skipped: pageLogs.length === 0,
            visits: uniqueSessions, // how many separate sessions they viewed this page
          };
        });

        // Bounce = opened but spent < 30 seconds total
        const bounced = totalTime > 0 && totalTime < 30;
        const neverOpened = totalTime === 0 && !firstLog;

        return {
         recipientEmail: email || `Anonymous (${viewerId?.substring(0, 8)})`,
        totalTimeOnDoc: formatTime(totalTime),
        totalTimeSeconds: totalTime,
        bounced: bounced || neverOpened,
        neverOpened,
        firstOpened: firstLog?.timestamp || null,
        pageData,
      };
      })
    );


    // ── Revisit analytics ────────────────────────────────────────


const revisitData = {
  totalSessions: allSessions.length,
  uniqueVisitors: new Set(allSessions.map((s: any) => s.viewerId)).size,
  revisits: allSessions.filter((s: any) => s.isRevisit).length,
  firstTimeVisits: allSessions.filter((s: any) => !s.isRevisit).length,
  avgVisitsPerViewer: allSessions.length > 0
    ? parseFloat((allSessions.length /
        Math.max(new Set(allSessions.map((s: any) => s.viewerId)).size, 1)
      ).toFixed(1))
    : 0,
  // Viewers who came back 3+ times — highest intent
  highFrequencyViewers: (() => {
    const counts = new Map<string, { count: number; email: string | null }>();
    allSessions.forEach((s: any) => {
      const existing = counts.get(s.viewerId) || { count: 0, email: s.email };
      counts.set(s.viewerId, { count: existing.count + 1, email: s.email || existing.email });
    });
    return Array.from(counts.entries())
      .filter(([, v]) => v.count >= 3)
      .map(([viewerId, v]) => ({
        viewerId,
        email: v.email,
        visitCount: v.count,
      }))
      .sort((a, b) => b.visitCount - a.visitCount);
  })(),
};

// ── Intent scores per viewer ─────────────────────────────────
const viewerIntents = await db.collection('viewer_identities')
  .find({ documentId: id })
  .toArray();

const intentScores = viewerIntents.map((v: any) => ({
  email: v.email,
  viewerId: v.viewerId,
  intentScore: v.intentScore || 0,
  intentLevel:
    (v.intentScore || 0) >= 30 ? 'high' :
    (v.intentScore || 0) >= 15 ? 'medium' : 'low',
  signals: v.intentSignals || [],
  device: v.device,
  lastSeen: v.lastSeen,
})).sort((a: any, b: any) => b.intentScore - a.intentScore);

// ── Heatmap data per page ────────────────────────────────────
const heatmapRaw = await db.collection('heatmap_events')
  .find({ documentId: id })
  .toArray();

// Group by page and type
const heatmapByPage: Record<number, {
  clicks: { x: number; y: number; count: number }[];
  scrollStops: { y: number; dwellTime: number }[];
  movementDensity: { x: number; y: number; density: number }[];
}> = {};

for (let p = 1; p <= document.numPages; p++) {
  const pageEvents = heatmapRaw.filter((e: any) => e.page === p);

  // Clicks — cluster nearby clicks into hotspots
  const clicks = pageEvents.filter((e: any) => e.type === 'click');
  const clickClusters: { x: number; y: number; count: number }[] = [];
  clicks.forEach((click: any) => {
    const existing = clickClusters.find(
      c => Math.abs(c.x - click.x) < 5 && Math.abs(c.y - click.y) < 5
    );
    if (existing) {
      existing.count++;
      existing.x = (existing.x + click.x) / 2;
      existing.y = (existing.y + click.y) / 2;
    } else {
      clickClusters.push({ x: click.x, y: click.y, count: 1 });
    }
  });

  // Scroll stops — where people paused reading
  const scrollStops = pageEvents
    .filter((e: any) => e.type === 'scroll_stop')
    .map((e: any) => ({ y: e.y, dwellTime: e.dwellTime || 0 }))
    .sort((a: any, b: any) => b.dwellTime - a.dwellTime)
    .slice(0, 20);

  // Movement density — where the mouse spent most time
  const moveEvents = pageEvents.filter((e: any) => e.type === 'move');
  const densityGrid: Record<string, { x: number; y: number; density: number }> = {};
  moveEvents.forEach((e: any) => {
    (e.points || []).forEach((pt: any) => {
      const gx = Math.floor(pt.x / 5) * 5;
      const gy = Math.floor(pt.y / 5) * 5;
      const key = `${gx}-${gy}`;
      if (!densityGrid[key]) densityGrid[key] = { x: gx, y: gy, density: 0 };
      densityGrid[key].density++;
    });
  });

  heatmapByPage[p] = {
    clicks: clickClusters.sort((a, b) => b.count - a.count).slice(0, 50),
    scrollStops,
    movementDensity: Object.values(densityGrid)
      .sort((a, b) => b.density - a.density)
      .slice(0, 100),
  };
}

// ── Real-time: who is viewing RIGHT NOW ──────────────────────
const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
const liveViewers = await db.collection('viewer_presence')
  .find({
    documentId: id,
    lastPing: { $gte: twoMinutesAgo },
  })
  .toArray();

const realTimeViewers = liveViewers.map((v: any) => ({
  email: v.email,
  viewerId: v.viewerId,
  page: v.page,
  device: v.device,
  lastPing: v.lastPing,
}));

    // ── Bounce analytics summary (NEW) ──────────────────────────
    const totalTrackedRecipients = recipientPageTracking.length;
    const bouncedCount = recipientPageTracking.filter(r => r.bounced).length;
    const engagedRecipients = recipientPageTracking.filter(r => !r.bounced && !r.neverOpened);
    const avgEngagementTime = engagedRecipients.length > 0
      ? formatTime(Math.round(
          engagedRecipients.reduce((sum, r) => sum + r.totalTimeSeconds, 0) / engagedRecipients.length
        ))
      : '0m 0s';

    const bounceAnalytics = {
      totalRecipients: totalTrackedRecipients,
      bounced: bouncedCount,
      engaged: engagedRecipients.length,
      bounceRate: totalTrackedRecipients > 0
        ? Math.round((bouncedCount / totalTrackedRecipients) * 100)
        : 0,
      avgEngagementTime,
    };

    // ── Top viewers ──────────────────────────────────────────────
    const viewerEmailMap = new Map<string, {
      email: string;
      views: number;
      lastViewed: Date;
      totalTime: number;
      shares: string[];
    }>();

    for (const share of shares) {
      const viewerEmails = share.tracking?.viewerEmails || [];
      for (const email of viewerEmails) {
        if (!email) continue;

        const emailEvents = await db.collection('analytics_logs')
          .find({ documentId: id, email, action: 'document_viewed' })
          .sort({ timestamp: -1 })
          .toArray();

        const viewCount = emailEvents.length || 1;
        const lastView = emailEvents[0]?.timestamp || share.tracking?.lastViewedAt || new Date();
        const timeSpent = emailEvents.reduce((sum: number, e: any) => sum + (e.viewTime || 0), 0);

        if (viewerEmailMap.has(email)) {
          const existing = viewerEmailMap.get(email)!;
          existing.views += viewCount;
          existing.lastViewed = new Date(
            Math.max(existing.lastViewed.getTime(), new Date(lastView).getTime())
          );
          existing.totalTime += timeSpent;
          if (!existing.shares.includes(share.shareToken)) {
            existing.shares.push(share.shareToken);
          }
        } else {
          viewerEmailMap.set(email, {
            email,
            views: viewCount,
            lastViewed: new Date(lastView),
            totalTime: timeSpent,
            shares: [share.shareToken],
          });
        }
      }

      // Anonymous viewers fallback
      if (viewerEmails.length === 0) {
        const uniqueIds = share.tracking?.uniqueViewers || [];
        for (const viewerId of uniqueIds) {
          const anonKey = `Anonymous (${viewerId.substring(0, 8)})`;
          const timeSpent = share.tracking?.timeSpentByViewer?.[viewerId] || 0;
          if (!viewerEmailMap.has(anonKey)) {
            viewerEmailMap.set(anonKey, {
              email: anonKey,
              views: 1,
              lastViewed: share.tracking?.lastViewedAt || new Date(),
              totalTime: timeSpent,
              shares: [share.shareToken],
            });
          }
        }
      }
    }

    const topViewers = Array.from(viewerEmailMap.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map(v => ({
        email: v.email,
        views: v.views,
        lastViewed: formatTimeAgo(v.lastViewed),
        time: formatTime(v.totalTime),
        shares: v.shares.length,
      }));

    // ── Device & location breakdown ──────────────────────────────
   const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
    type DeviceType = 'desktop' | 'mobile' | 'tablet';
    oldViews.forEach((v: any) => {
      if (v.device && deviceCounts[v.device as DeviceType] !== undefined) {
        deviceCounts[v.device as DeviceType]++;
      }
    });
    const devices = Object.fromEntries(
      Object.entries(deviceCounts).map(([k, v]) => [
        k,
        totalViews ? Math.round((v / totalViews) * 100) : 0,
      ])
    );

    // Pull from analytics_sessions which have full location data
    const locationMap = new Map<string, { count: number; countryCode?: string; cities: Set<string> }>();
    
    allSessions.forEach((s: any) => {
      const country = s.location?.country || 'Unknown';
      const countryCode = s.location?.countryCode;
      const city = s.location?.city;
      const existing = locationMap.get(country) || { count: 0, countryCode, cities: new Set() };
      existing.count++;
      if (city) existing.cities.add(city);
      locationMap.set(country, existing);
    });
    
    // Fallback to oldViews if sessions have no location
    if (locationMap.size === 0) {
      oldViews.forEach((v: any) => {
        const country = v.country || 'Unknown';
        const existing = locationMap.get(country) || { count: 0, cities: new Set() };
        existing.count++;
        locationMap.set(country, existing);
      });
    }
    
    const locations = Array.from(locationMap.entries())
      .map(([country, data]) => ({
        country,
        countryCode: data.countryCode,
        views: data.count,
        percentage: totalViews ? Math.round((data.count / totalViews) * 100) : 0,
        topCities: Array.from(data.cities).slice(0, 3),
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    // ── E-signature analytics ────────────────────────────────────
    const signatureRequests = await db.collection('signature_requests')
      .find({ documentId: id })
      .toArray();

    const totalRecipients = signatureRequests.length;
    const completedRecipients = signatureRequests.filter(sr => sr.status === 'completed');
    const completedCount = completedRecipients.length;

    const signingTimings = completedRecipients
      .filter(sr => sr.timeSpentSeconds != null)
      .map(sr => sr.timeSpentSeconds);

    const averageSigningTimeSeconds = signingTimings.length > 0
      ? Math.floor(signingTimings.reduce((a: number, b: number) => a + b, 0) / signingTimings.length)
      : null;

    // ── Signature friction funnel (NEW) ──────────────────────────
    const openedCount = signatureRequests.filter(sr => sr.firstViewedAt).length;
    const scrolledToSig = signatureRequests.filter(sr => sr.scrolledToSignature).length;
    const startedSigning = signatureRequests.filter(
      sr => sr.status === 'completed' || sr.status === 'started'
    ).length;

    const signatureFriction = [
      {
        step: 'Document Opened',
        users: openedCount,
        avgTime: '0s',
        dropOff: 0,
      },
      {
        step: 'Scrolled to Signature',
        users: scrolledToSig,
        avgTime: formatTime(
          signatureRequests
            .filter(sr => sr.scrolledToSignatureAt && sr.firstViewedAt)
            .reduce((sum: number, sr: any) => {
              return sum + Math.floor(
                (new Date(sr.scrolledToSignatureAt).getTime() -
                  new Date(sr.firstViewedAt).getTime()) / 1000
              );
            }, 0) /
            (signatureRequests.filter(sr => sr.scrolledToSignatureAt).length || 1)
        ),
        dropOff: openedCount > 0
          ? Math.round(((openedCount - scrolledToSig) / openedCount) * 100)
          : 0,
      },
      {
        step: 'Started Signing',
        users: startedSigning,
        avgTime: '0s',
        dropOff: scrolledToSig > 0
          ? Math.round(((scrolledToSig - startedSigning) / scrolledToSig) * 100)
          : 0,
      },
      {
        step: 'Completed Signing',
        users: completedCount,
        avgTime: averageSigningTimeSeconds ? formatTime(averageSigningTimeSeconds) : '0s',
        dropOff: startedSigning > 0
          ? Math.round(((startedSigning - completedCount) / startedSigning) * 100)
          : 0,
      },
    ];

    const eSignatureAnalytics = {
      totalRecipients,
      completedCount,
      completionRate: totalRecipients > 0
        ? Math.floor((completedCount / totalRecipients) * 100)
        : 0,
      averageTimeSeconds: averageSigningTimeSeconds,
      averageTimeFormatted: averageSigningTimeSeconds
        ? formatTime(averageSigningTimeSeconds)
        : 'N/A',
      recipientTimings: completedRecipients
        .filter(sr => sr.timeSpentSeconds != null)
        .map(sr => ({
          recipient: sr.recipient?.name || sr.recipientEmail,
          email: sr.recipientEmail,
          timeSpent: sr.timeSpentSeconds,
          timeSpentFormatted: formatTime(sr.timeSpentSeconds),
          completedAt: sr.signedAt,
        })),
      fastestTime: signingTimings.length > 0 ? Math.min(...signingTimings) : null,
      slowestTime: signingTimings.length > 0 ? Math.max(...signingTimings) : null,
      signatureFriction,
    };

    // ── Decline analysis (NEW) ───────────────────────────────────
    const declinedRequests = signatureRequests.filter(sr => sr.status === 'declined');
    const declineReasonMap = new Map<string, number>();

    declinedRequests.forEach(sr => {
      const reason = sr.declineReason || 'No reason given';
      declineReasonMap.set(reason, (declineReasonMap.get(reason) || 0) + 1);
    });

    const totalDeclines = declinedRequests.length;
    const declineReasons = Array.from(declineReasonMap.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalDeclines > 0 ? Math.round((count / totalDeclines) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Decline patterns — when in the flow did they decline?
    const declinePatterns = {
      avgTimeBeforeDecline: formatTime(
        declinedRequests.length > 0
          ? Math.round(
              declinedRequests
                .filter(sr => sr.declinedAt && sr.firstViewedAt)
                .reduce((sum: number, sr: any) => {
                  return sum + Math.floor(
                    (new Date(sr.declinedAt).getTime() -
                      new Date(sr.firstViewedAt).getTime()) / 1000
                  );
                }, 0) /
              (declinedRequests.filter(sr => sr.declinedAt && sr.firstViewedAt).length || 1)
            )
          : 0
      ),
      instantDeclines: declinedRequests.filter(sr => {
        if (!sr.declinedAt || !sr.firstViewedAt) return false;
        const seconds = (new Date(sr.declinedAt).getTime() - new Date(sr.firstViewedAt).getTime()) / 1000;
        return seconds < 30;
      }).length,
      deepReviewDeclines: declinedRequests.filter(sr => {
        if (!sr.declinedAt || !sr.firstViewedAt) return false;
        const seconds = (new Date(sr.declinedAt).getTime() - new Date(sr.firstViewedAt).getTime()) / 1000;
        return seconds > 300; // 5+ minutes
      }).length,
      recipients: declinedRequests.map(sr => ({
        email: sr.recipientEmail,
        name: sr.recipient?.name || sr.recipientEmail,
        reason: sr.declineReason || 'No reason given',
        declinedAt: sr.declinedAt,
        timeBeforeDecline: sr.declinedAt && sr.firstViewedAt
          ? formatTime(Math.floor(
              (new Date(sr.declinedAt).getTime() - new Date(sr.firstViewedAt).getTime()) / 1000
            ))
          : 'N/A',
        pageDeclinedOn: sr.pageDeclinedOn || null,
      })),
    };

    // ── Intent signals (NEW) ─────────────────────────────────────
    // Compute from analytics_logs per viewer
    const intentSignals: { signal: string; count: number }[] = [];

    const multipleViewers = recipientPageTracking.filter(r => r.pageData
      .reduce((sum, p) => sum + p.visits, 0) > 3
    ).length;

    const longTimeViewers = recipientPageTracking.filter(
      r => r.totalTimeSeconds > 300
    ).length;

    const returnVisitors = Array.from(viewerEmailMap.values()).filter(
      v => v.views > 1
    ).length;

    const completedPageViewers = recipientPageTracking.filter(r =>
      r.pageData.every(p => p.visited)
    ).length;

    if (multipleViewers > 0) intentSignals.push({ signal: 'Multiple page views', count: multipleViewers });
    if (longTimeViewers > 0) intentSignals.push({ signal: 'Long time spent (5+ min)', count: longTimeViewers });
    if (returnVisitors > 0) intentSignals.push({ signal: 'Returned multiple times', count: returnVisitors });
    if (completedPageViewers > 0) intentSignals.push({ signal: 'Scrolled to end', count: completedPageViewers });

    const highIntentCount = recipientPageTracking.filter(
      r => r.totalTimeSeconds > 300 && !r.bounced
    ).length;
    const lowIntentCount = recipientPageTracking.filter(
      r => r.bounced || r.neverOpened
    ).length;
    const mediumIntentCount = Math.max(
      0,
      totalTrackedRecipients - highIntentCount - lowIntentCount
    );

    const intentData = {
      highIntent: highIntentCount,
      mediumIntent: mediumIntentCount,
      lowIntent: lowIntentCount,
      signals: intentSignals,
    };

    // ── Reminder effectiveness (NEW) ────────────────────────────
    // Track reminders sent vs outcomes from reminder_logs collection
    const reminderLogs = await db.collection('reminder_logs')
      .find({ documentId: id })
      .toArray();

    const reminderGroups = new Map<number, { total: number; signed: number; times: number[] }>();

    for (const req of signatureRequests) {
      const remindersForReq = reminderLogs.filter(
        r => r.signatureRequestId?.toString() === req._id?.toString()
      ).length;

      const bucket = Math.min(remindersForReq, 3); // 0, 1, 2, 3+
      const existing = reminderGroups.get(bucket) || { total: 0, signed: 0, times: [] };
      existing.total++;
      if (req.status === 'completed') {
        existing.signed++;
        if (req.timeSpentSeconds) existing.times.push(req.timeSpentSeconds);
      }
      reminderGroups.set(bucket, existing);
    }

    const reminderLabels = ['No Reminder', '1 Reminder', '2 Reminders', '3+ Reminders'];
    const reminderEffectiveness = reminderLabels.map((label, i) => {
      const group = reminderGroups.get(i) || { total: 0, signed: 0, times: [] };
      const avgTimeSeconds = group.times.length > 0
        ? Math.round(group.times.reduce((a, b) => a + b, 0) / group.times.length)
        : 0;
      return {
        reminderType: label,
        signRate: group.total > 0 ? Math.round((group.signed / group.total) * 100) : 0,
        avgTime: avgTimeSeconds > 0 ? formatTime(avgTimeSeconds) : 'N/A',
        total: group.total,
        signed: group.signed,
      };
    });

    // ── Dead Deal Score (NEW) ────────────────────────────────────
    let deadDealScore = 0;
    const deadDealSignals: { signal: string; weight: number; type: string }[] = [];

    // Signal 1: Has declines
    if (declinedRequests.length > 0) {
      deadDealScore += 30;
      deadDealSignals.push({
        signal: `Declined by ${declinedRequests.length} recipient(s)`,
        weight: 30,
        type: 'CRITICAL',
      });
    }

    // Signal 2: No re-engagement after 14+ days
    const lastActivity = tracking.lastViewed
      ? new Date(tracking.lastViewed)
      : oldViews[0]?.viewedAt
      ? new Date(oldViews[0].viewedAt)
      : null;

    if (lastActivity) {
      const daysSinceActivity =
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity > 14 && declinedRequests.length > 0) {
        deadDealScore += 25;
        deadDealSignals.push({
          signal: `No activity for ${Math.floor(daysSinceActivity)} days after decline`,
          weight: 25,
          type: 'CRITICAL',
        });
      } else if (daysSinceActivity > 30) {
        deadDealScore += 20;
        deadDealSignals.push({
          signal: `No activity for ${Math.floor(daysSinceActivity)} days`,
          weight: 20,
          type: 'HIGH',
        });
      }
    }

    // Signal 3: High bounce rate
    if (bounceAnalytics.bounceRate > 60) {
      deadDealScore += 20;
      deadDealSignals.push({
        signal: `High bounce rate: ${bounceAnalytics.bounceRate}%`,
        weight: 20,
        type: 'HIGH',
      });
    }

    // Signal 4: Deep review declines (informed rejections)
    if (declinePatterns.deepReviewDeclines > 0) {
      deadDealScore += 15;
      deadDealSignals.push({
        signal: `${declinePatterns.deepReviewDeclines} recipient(s) declined after 5+ min review`,
        weight: 15,
        type: 'HIGH',
      });
    }

    // Signal 5: Zero engagement on key pages
    const zeroEngagementPages = pageEngagement.filter(
      p => p.totalViews === 0 && p.page > 1
    ).length;
    if (zeroEngagementPages > 0) {
      deadDealScore += 10;
      deadDealSignals.push({
        signal: `${zeroEngagementPages} page(s) never viewed`,
        weight: 10,
        type: 'MEDIUM',
      });
    }

    deadDealScore = Math.min(100, deadDealScore);

    const deadDealVerdict =
      deadDealScore >= 80 ? 'DEAD' :
      deadDealScore >= 60 ? 'AT_RISK' :
      deadDealScore >= 30 ? 'WATCH' :
      'HEALTHY';

    const recoveryProbability = Math.max(0, 100 - deadDealScore);

    const deadDeal = {
      score: deadDealScore,
      verdict: deadDealVerdict,
      confidence: Math.min(95, 50 + deadDealScore / 2),
      signals: deadDealSignals,
      recoveryProbability,
      recommendations: buildDeadDealRecommendations(deadDealVerdict, declineReasons, daysSinceLastActivity(lastActivity)),
    };

    // ── NDA acceptances ──────────────────────────────────────────
    const ndaAcceptances = await db.collection('nda_acceptances')
      .find({ documentId: id })
      .sort({ timestamp: -1 })
      .toArray();

    // ── Final response ───────────────────────────────────────────
    return NextResponse.json({
      success: true,
      analytics: {
        // Core metrics
        totalViews,
        uniqueViewers,
averageTime: formatTime(averageTimeSeconds),
        avgTimePerSession: formatTime(avgTimePerSession),
        avgTotalTimePerViewer: formatTime(avgTotalTimePerViewer),
        totalTimeAllSessions: formatTime(
          allSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
        ),
        completionRate,
        downloads,
        shares: totalShares,
        lastViewed: tracking.lastViewed || null,

        // Time series
        viewsByDate,

        // Page analytics
        pageEngagement,

        // Viewer analytics
        topViewers,
        recipientPageTracking,
        bounceAnalytics,

        // ── REVISIT DATA (was declared but never returned) ────────
        revisitData,

        // ── INTENT SCORES per viewer (was declared but never returned) ─
        intentScores,

        // Real-time viewers (was declared but never returned)
        realTimeViewers,
        liveViewerCount: realTimeViewers.length,

        // Device & geo
        devices,
        locations,

        // E-signatures
        eSignature: eSignatureAnalytics,
        signatureFriction,

        // Decline analysis
        declineReasons,
        declinePatterns,

        // Intent
        intentData,

        // Reminders
        reminderEffectiveness,

        // Dead deal detection
        deadDeal,

        // NDA
        ndaAcceptances,

        // Content & document info (unchanged)
        contentQuality: {
          healthScore: analyticsData.healthScore || 0,
          readabilityScore: analyticsData.readabilityScore || 0,
          sentimentScore: analyticsData.sentimentScore || 0,
          grammarErrors: analyticsData.errorCounts?.grammar || 0,
          spellingErrors: analyticsData.errorCounts?.spelling || 0,
          clarityErrors: analyticsData.errorCounts?.clarity || 0,
          topKeywords: analyticsData.keywords?.slice(0, 10) || [],
          entities: analyticsData.entities?.slice(0, 10) || [],
          language: analyticsData.language || 'en',
          formalityLevel: analyticsData.formalityLevel || 'neutral',
        },
        documentInfo: {
          filename: document.originalFilename,
          format: document.originalFormat,
          numPages: document.numPages,
          wordCount: document.wordCount,
          size: document.size,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        },
        sharingInfo: {
          isPublic: document.isPublic || false,
          sharedWith: document.sharedWith?.length || 0,
          shareLinks: document.shareLinks?.length || 0,
        },
      },
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}

// ── POST (unchanged from your original) ─────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await dbPromise;
    const body = await request.json();
    const { action, pageNumber, viewTime = 0, visitorId, signatureId, email, scrollDepth } = body;

    // E-signature tracking
    if (action === 'first_view' || action === 'completed' || action === 'scrolled_to_signature') {
      const signatureRequest = await db.collection('signature_requests').findOne({
        uniqueId: signatureId,
      });
      if (!signatureRequest) {
        return NextResponse.json({ success: false, message: 'Signature request not found' }, { status: 404 });
      }

      if (action === 'first_view' && !signatureRequest.firstViewedAt) {
        await db.collection('signature_requests').updateOne(
          { uniqueId: signatureId },
          { $set: { firstViewedAt: new Date() } }
        );
      } else if (action === 'scrolled_to_signature' && !signatureRequest.scrolledToSignature) {
        // NEW: track when they scroll to the signature field
        await db.collection('signature_requests').updateOne(
          { uniqueId: signatureId },
          { $set: { scrolledToSignature: true, scrolledToSignatureAt: new Date() } }
        );
      } else if (action === 'completed') {
        const firstViewed = signatureRequest.firstViewedAt;
        const completedAt = new Date();
        const timeSpentSeconds = firstViewed
          ? Math.floor((completedAt.getTime() - new Date(firstViewed).getTime()) / 1000)
          : null;
        await db.collection('signature_requests').updateOne(
          { uniqueId: signatureId },
          { $set: { completedAt, timeSpentSeconds, status: 'completed' } }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });

    const document = await db.collection('documents').findOne({ _id: new ObjectId(id) });
    if (!document)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const tracking = document.tracking || {
      views: 0,
      uniqueVisitors: [],
      downloads: 0,
      shares: 0,
      averageViewTime: 0,
      lastViewed: null,
      viewsByPage: {},
    };

    switch (action) {
      case 'view':
        tracking.views += 1;
        if (visitorId && !tracking.uniqueVisitors.includes(visitorId)) {
          tracking.uniqueVisitors.push(visitorId);
        }
        tracking.lastViewed = new Date();
        tracking.averageViewTime =
          ((tracking.averageViewTime * (tracking.views - 1)) + viewTime) / tracking.views;
        break;
      case 'download':
        tracking.downloads += 1;
        break;
      case 'share':
        tracking.shares += 1;
        break;
      case 'page_view':
        if (pageNumber !== undefined) {
          tracking.viewsByPage[pageNumber] = (tracking.viewsByPage[pageNumber] || 0) + 1;
        }
        tracking.lastViewed = new Date();
        if (tracking.views > 0) {
          tracking.averageViewTime =
            ((tracking.averageViewTime * (tracking.views - 1)) + viewTime) / tracking.views;
        }
        break;
    }

    await db.collection('documents').updateOne(
      { _id: new ObjectId(id) },
      { $set: { tracking } }
    );
    

    // Detailed log — now includes email and scrollDepth
    if (['view', 'page_view'].includes(action)) {
      await db.collection('analytics_logs').insertOne({
        documentId: id,
        action,
        pageNumber,
        viewTime,
        visitorId,
        email: email || null,
        scrollDepth: scrollDepth || 0,
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json({ error: 'Failed to track interaction' }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0m 0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function daysSinceLastActivity(lastActivity: Date | null): number {
  if (!lastActivity) return 0;
  return Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
}

function buildDeadDealRecommendations(
  verdict: string,
  declineReasons: { reason: string; count: number }[],
  daysSince: number
): { action: string; priority: string; reason: string }[] {
  const recs: { action: string; priority: string; reason: string }[] = [];
  const topReason = declineReasons[0]?.reason || null;

  if (verdict === 'DEAD') {
    recs.push({ action: 'Archive this deal', priority: 'HIGH', reason: 'Multiple critical signals detected' });
    if (topReason) {
      recs.push({
        action: `Re-engage addressing: "${topReason}"`,
        priority: 'MEDIUM',
        reason: 'Top decline reason — needs direct response',
      });
    }
    recs.push({ action: 'Mark as Lost in CRM', priority: 'HIGH', reason: 'Keep pipeline data clean' });
  } else if (verdict === 'AT_RISK') {
    recs.push({ action: 'Send personalised follow-up within 24h', priority: 'HIGH', reason: 'Window closing fast' });
    if (daysSince > 7) {
      recs.push({ action: 'Escalate to senior contact', priority: 'MEDIUM', reason: `${daysSince} days of silence` });
    }
  } else if (verdict === 'WATCH') {
    recs.push({ action: 'Schedule gentle check-in', priority: 'MEDIUM', reason: 'Early warning signs present' });
  }

  return recs;
}