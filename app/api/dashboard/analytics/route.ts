// app/api/dashboard/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

    // Get all documents for this user
    const documents = await db.collection('documents')
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    const documentIds = documents.map((d: any) => d._id.toString());

    if (documentIds.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          totalViews: 0,
          uniqueViewers: 0,
          activeLinks: 0,
          pendingSignatures: 0,
          liveViewers: 0,
          viewsByDate: [],
          topDocuments: [],
          recentVisits: [],
          hotVisitors: [],
          recentNDAs: [],
        }
      });
    }

    // ── Views by day (last 30 days) ──────────────────────────────
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);

    // Get all sessions in last 30 days across all docs
    const allSessions = await db.collection('analytics_sessions')
      .find({
        documentId: { $in: documentIds },
        startedAt: { $gte: thirtyDaysAgo },
      })
      .toArray();

    // Build daily views map
    const dailyMap = new Map<string, { views: number; docs: Record<string, number> }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      dailyMap.set(key, { views: 0, docs: {} });
    }

    allSessions.forEach((s: any) => {
      const d = new Date(s.startedAt);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (dailyMap.has(key)) {
        const entry = dailyMap.get(key)!;
        entry.views++;
        entry.docs[s.documentId] = (entry.docs[s.documentId] || 0) + 1;
      }
    });

    // Find document names for tooltip
    const docNameMap = new Map<string, string>();
    documents.forEach((d: any) => {
      docNameMap.set(d._id.toString(), d.originalFilename || d.filename || 'Untitled');
    });

    const viewsByDate = Array.from(dailyMap.entries()).map(([date, data]) => {
      // Top docs for this day
      const topDocs = Object.entries(data.docs)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([docId, views]) => ({
          name: docNameMap.get(docId) || 'Unknown',
          views,
        }));

      return { date, views: data.views, topDocs };
    });

    // ── Total metrics ────────────────────────────────────────────
    const allSessionsEver = await db.collection('analytics_sessions')
      .find({ documentId: { $in: documentIds } })
      .toArray();

    const totalViews = allSessionsEver.length;

    const uniqueViewerSet = new Set<string>();
    allSessionsEver.forEach((s: any) => {
      if (s.email) uniqueViewerSet.add(s.email);
      else if (s.viewerId) uniqueViewerSet.add(s.viewerId);
    });
    const uniqueViewers = uniqueViewerSet.size;

    // ── Active links ─────────────────────────────────────────────
    const activeLinks = await db.collection('shares').countDocuments({
      documentId: { $in: documents.map((d: any) => d._id) },
      active: true,
    });

    // ── Pending signatures ───────────────────────────────────────
    const pendingSignatures = await db.collection('signature_requests').countDocuments({
      documentId: { $in: documentIds },
      status: { $in: ['pending', 'sent'] },
    });

    // ── Live viewers right now ───────────────────────────────────
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const liveViewers = await db.collection('viewer_presence').countDocuments({
      documentId: { $in: documentIds },
      lastPing: { $gte: twoMinutesAgo },
    });

    // ── Top documents by views ───────────────────────────────────
    const docViewCounts = new Map<string, number>();
    allSessionsEver.forEach((s: any) => {
      docViewCounts.set(s.documentId, (docViewCounts.get(s.documentId) || 0) + 1);
    });

    const topDocuments = documents
      .map((d: any) => ({
        id: d._id.toString(),
        name: d.originalFilename || d.filename || 'Untitled',
        views: docViewCounts.get(d._id.toString()) || 0,
        numPages: d.numPages || 0,
        createdAt: d.createdAt,
      }))
      .sort((a: any, b: any) => b.views - a.views)
      .slice(0, 5);

    // ── Recent visits ────────────────────────────────────────────
    const recentSessionsRaw = await db.collection('analytics_sessions')
      .find({ documentId: { $in: documentIds } })
      .sort({ startedAt: -1 })
      .limit(10)
      .toArray();

    const recentVisits = recentSessionsRaw.map((s: any) => ({
      email: s.email || `Anonymous (${s.viewerId?.substring(0, 8) || '?'})`,
      documentId: s.documentId,
      documentName: docNameMap.get(s.documentId) || 'Unknown',
      device: s.device || 'desktop',
      location: s.location
        ? [s.location.city, s.location.country].filter(Boolean).join(', ')
        : null,
      duration: s.duration || 0,
      startedAt: s.startedAt,
    }));

    // ── Hot visitors (high intent across all docs) ────────────────
// Use analytics_logs page_view viewTime — sessions.duration is
// unreliable because session_end rarely fires correctly
const hotVisitorPageLogs = await db.collection('analytics_logs')
  .find({
    documentId: { $in: documentIds },
    action: 'page_view',
    $or: [
      { email: { $exists: true, $ne: null } },
      { viewerId: { $exists: true, $ne: null } },
    ],
  })
  .toArray()

const viewerActivityMap = new Map<string, {
  email: string
  totalTime: number
  visits: number
  lastSeen: Date
  docs: Set<string>
  sessions: Set<string>
}>()

// First build visit counts from sessions
allSessionsEver.forEach((s: any) => {
  const key = s.email || s.viewerId
  if (!key) return
  const existing = viewerActivityMap.get(key) || {
    email: s.email || `Anonymous (${s.viewerId?.substring(0, 8)})`,
    totalTime: 0,
    visits: 0,
    lastSeen: new Date(s.startedAt),
    docs: new Set<string>(),
    sessions: new Set<string>(),
  }
  // Count unique sessions only
  if (!existing.sessions.has(s.sessionId)) {
    existing.sessions.add(s.sessionId)
    existing.visits++
  }
  existing.docs.add(s.documentId)
  if (new Date(s.startedAt) > existing.lastSeen) {
    existing.lastSeen = new Date(s.startedAt)
  }
  viewerActivityMap.set(key, existing)
})

// Then add accurate time from page_view logs
hotVisitorPageLogs.forEach((log: any) => {
  const key = log.email || log.viewerId
  if (!key) return
  const existing = viewerActivityMap.get(key)
  if (existing) {
    existing.totalTime += log.viewTime || 0
  } else {
    // Viewer appeared in logs but not in sessions — add them
    viewerActivityMap.set(key, {
      email: log.email || `Anonymous (${log.viewerId?.substring(0, 8)})`,
      totalTime: log.viewTime || 0,
      visits: 1,
      lastSeen: new Date(log.timestamp),
      docs: new Set([log.documentId]),
      sessions: new Set(),
    })
  }
})

const hotVisitors = Array.from(viewerActivityMap.values())
  .filter(v => v.visits >= 2 || v.totalTime > 120)
  .sort((a, b) => (b.totalTime + b.visits * 30) - (a.totalTime + a.visits * 30))
  .slice(0, 5)
  .map(v => ({
    email: v.email,
    visits: v.visits,
    totalTime: v.totalTime,
    docsViewed: v.docs.size,
    lastSeen: v.lastSeen,
    intentLevel: v.totalTime > 300 ? 'high' : v.totalTime > 120 ? 'medium' : 'low',
  }))
  
    // ── Recent NDA signings ──────────────────────────────────────
    const recentNDAs = await db.collection('nda_acceptances')
      .find({ documentId: { $in: documentIds } })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    const recentNDAsMapped = recentNDAs.map((n: any) => ({
      email: n.viewerEmail || 'Unknown',
      documentName: docNameMap.get(n.documentId) || 'Unknown',
      timestamp: n.timestamp,
      certificateId: n.certificateId,
    }));

   // Get user's organizationId to identify team docs vs personal docs
const userProfile = await db.collection('profiles').findOne({ user_id: user.id })
const organizationId = userProfile?.organization_id || user.id

// My docs = owned by this user
// Team docs = sharedToTeam in the same org, owned by someone else
const myDocumentIds = documents
  .filter((d: any) => d.userId === user.id && !d.sharedToTeam)
  .map((d: any) => d._id.toString())

const teamDocumentIds = documents
  .filter((d: any) => d.sharedToTeam === true)
  .map((d: any) => d._id.toString())

const thirtyDaysAgoC = new Date()
thirtyDaysAgoC.setDate(thirtyDaysAgoC.getDate() - 30)

// Sessions for time calculation
const recentContactSessions = await db.collection('analytics_sessions')
  .find({
    documentId: { $in: documentIds },
    startedAt: { $gte: thirtyDaysAgoC },
    email: { $exists: true, $ne: null },
  })
  .toArray()

// Page logs for accurate time (sessions.duration is often 0)
const recentPageLogs = await db.collection('analytics_logs')
  .find({
    documentId: { $in: documentIds },
    action: 'page_view',
    timestamp: { $gte: thirtyDaysAgoC },
    email: { $exists: true, $ne: null },
  })
  .toArray()

const contactMap2 = new Map<string, any>()

// Build visit/doc counts from sessions — and tag source
recentContactSessions.forEach((s: any) => {
  if (!s.email) return
  const e = contactMap2.get(s.email) || {
    email: s.email,
    visits: 0,
    docs: new Set<string>(),
    totalTime: 0,
    lastSeen: new Date(s.startedAt),
    topDocName: docNameMap.get(s.documentId) || '',
    topDocId: s.documentId,
    viewedMyDocIds: new Set<string>(),
    viewedTeamDocIds: new Set<string>(),
    pageTimeMap: new Map<number, number>(),
  }
  e.visits++
  e.docs.add(s.documentId)
  if (new Date(s.startedAt) > e.lastSeen) {
    e.lastSeen = new Date(s.startedAt)
    e.topDocName = docNameMap.get(s.documentId) || e.topDocName
    e.topDocId = s.documentId || e.topDocId
  }
  if (myDocumentIds.includes(s.documentId)) {
    e.viewedMyDocIds.add(s.documentId)
  }
  if (teamDocumentIds.includes(s.documentId)) {
    e.viewedTeamDocIds.add(s.documentId)
  }
  contactMap2.set(s.email, e)
})

// Add time from page_view logs
recentPageLogs.forEach((log: any) => {
  if (!log.email) return
  const e = contactMap2.get(log.email)
  const pageNum = Number(log.pageNumber || log.page)
  if (!pageNum) return
  if (e) {
    e.totalTime += log.viewTime || 0
    const existing = e.pageTimeMap.get(pageNum) || 0
    e.pageTimeMap.set(pageNum, existing + (log.viewTime || 0))
  } else {
    const pageTimeMap = new Map<number, number>()
    pageTimeMap.set(pageNum, log.viewTime || 0)
    contactMap2.set(log.email, {
      email: log.email,
      visits: 1,
      docs: new Set([log.documentId]),
      totalTime: log.viewTime || 0,
      lastSeen: new Date(log.timestamp),
      topDocName: docNameMap.get(log.documentId) || '',
      topDocId: log.documentId,
      viewedMyDocIds: myDocumentIds.includes(log.documentId)
        ? new Set([log.documentId])
        : new Set(),
      viewedTeamDocIds: teamDocumentIds.includes(log.documentId)
        ? new Set([log.documentId])
        : new Set(),
      pageTimeMap,
    })
  }
})

const mostEngagedContacts = await Promise.all(
      Array.from(contactMap2.values())
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 50)
        .map(async c => {

          // ── Cross-session re-read detection per email ──────────────
          // Same logic as document analytics fix — count distinct
          // sessions per page for this viewer across ALL their docs
          const allViewerPageLogs = await db.collection('analytics_logs').find({
            documentId: { $in: documentIds },
            action: 'page_view',
            email: c.email,
          }).toArray();

          // Group by documentId+page, count distinct sessions
          const pageSessionMap = new Map<string, Set<string>>();
          allViewerPageLogs.forEach((log: any) => {
            const key = `${log.documentId}::${log.pageNumber}`;
            if (!pageSessionMap.has(key)) pageSessionMap.set(key, new Set());
            if (log.sessionId) pageSessionMap.get(key)!.add(log.sessionId);
          });

          // Build re-read pages — only pages visited in 2+ distinct sessions
          const reReadPages: { page: number; docId: string; docName: string; count: number }[] = [];
          pageSessionMap.forEach((sessions, key) => {
            if (sessions.size >= 2) {
              const [docId, pageStr] = key.split('::');
              reReadPages.push({
                page: parseInt(pageStr),
                docId,
                docName: docNameMap.get(docId) || 'Unknown',
                count: sessions.size,
              });
            }
          });
          reReadPages.sort((a, b) => b.count - a.count);

          // ── Video replays for this viewer across all docs ──────────
          const viewerVideoLogs = await db.collection('analytics_logs').find({
            documentId: { $in: documentIds },
            action: 'video_replayed',
            email: c.email,
          }).toArray();

          const videoPageMap = new Map<string, number>();
          viewerVideoLogs.forEach((log: any) => {
            const key = `${log.documentId}::${log.pageNumber}`;
            videoPageMap.set(key, (videoPageMap.get(key) || 0) + 1);
          });
          const videoReplays = Array.from(videoPageMap.entries())
            .filter(([, count]) => count >= 1)
            .map(([key, count]) => {
              const [docId, pageStr] = key.split('::');
              return {
                page: parseInt(pageStr),
                docId,
                docName: docNameMap.get(docId) || 'Unknown',
                count,
              };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

          // ── Build narrative if signals exist ───────────────────────
          let dealInsight: {
            narrative: string;
            reReadPages: typeof reReadPages;
            videoReplays: typeof videoReplays;
          } | null = null;

          if (reReadPages.length > 0 || videoReplays.length > 0) {
            const parts: string[] = [];
            if (reReadPages.length > 0) {
              const top = reReadPages[0];
              parts.push(
                `Page ${top.page} of "${top.docName}" was re-read ${top.count} time${top.count > 1 ? 's' : ''}`
              );
            }
            if (videoReplays.length > 0) {
              const top = videoReplays[0];
              parts.push(
                `the page ${top.page} video in "${top.docName}" was replayed ${top.count} time${top.count > 1 ? 's' : ''}`
              );
            }
            const narrative = parts.join(' and ') + '. They may need help justifying this internally.';
            dealInsight = {
              narrative,
              reReadPages: reReadPages.slice(0, 3),
              videoReplays,
            };
          }

          return {
            email: c.email,
            visits: c.visits,
            docs: c.docs.size,
            totalTime: c.totalTime,
            lastSeen: c.lastSeen,
            topDocId: c.topDocId,
            topDocName: c.topDocName,
            pageData: (Array.from(c.pageTimeMap.entries()) as [number, number][]) 
              .sort(([a], [b]) => a - b)
              .map(([page, timeSpent]) => ({
                page,
                timeSpent,
                // Now correctly counts distinct sessions for this page
                visits: pageSessionMap.get(`${c.topDocId}::${page}`)?.size || 1,
                skipped: timeSpent === 0,
              })),
            dealInsight,
            source: c.viewedMyDocIds.size > 0 && c.viewedTeamDocIds.size > 0
              ? 'both'
              : c.viewedTeamDocIds.size > 0
              ? 'team'
              : 'my',
          };
        })
    );

    return NextResponse.json({
      success: true,
      analytics: {
        totalViews,
        uniqueViewers,
        activeLinks,
        pendingSignatures,
        liveViewers,
        viewsByDate,
        mostEngagedContacts,
        topDocuments,
        recentVisits,
        hotVisitors,
        recentNDAs: recentNDAsMapped,
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json({ error: 'Failed to get dashboard analytics' }, { status: 500 });
  }
}