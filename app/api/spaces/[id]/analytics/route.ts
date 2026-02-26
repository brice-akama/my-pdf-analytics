// app/api/spaces/[id]/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise
      ? await context.params
      : context.params;

    const spaceId = params.id;

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Verify user has access to this space
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const isOwner = space.userId === user.id;
    const isMember = space.members?.some((m: any) =>
      m.email === user.email || m.userId === user.id
    );

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ─── Fetch all activity logs for this space ───────────────────────────
    const logs = await db.collection('activityLogs')
      .find({ spaceId: new ObjectId(spaceId) })
      .sort({ timestamp: -1 })
      .toArray();

    const now = Date.now();

    // ─── 1. TOP STATS ─────────────────────────────────────────────────────
    const totalEvents    = logs.length;
    const totalViews     = logs.filter(l => l.event === 'document_view' || l.event === 'view').length;
    const totalDownloads = logs.filter(l => l.event === 'download').length;

    const uniqueVisitors = new Set(
      logs.map(l => l.visitorEmail).filter(Boolean)
    ).size;

    const lastActivity = logs.length > 0 ? logs[0].timestamp : null;

    // ─── 2. VISITOR ENGAGEMENT TABLE ─────────────────────────────────────
    const visitorMap: Record<string, {
      email: string
      totalEvents: number
      docsViewed: Set<string>
      downloads: number
      firstSeen: Date
      lastSeen: Date
      shareLinks: Set<string>
    }> = {};

    for (const log of logs) {
      const email = log.visitorEmail;
      if (!email) continue;

      if (!visitorMap[email]) {
        visitorMap[email] = {
          email,
          totalEvents: 0,
          docsViewed: new Set(),
          downloads: 0,
          firstSeen: log.timestamp,
          lastSeen: log.timestamp,
          shareLinks: new Set()
        };
      }

      const v = visitorMap[email];
      v.totalEvents++;
      if (log.documentId) v.docsViewed.add(log.documentId.toString());
      if (log.event === 'download') v.downloads++;
      if (log.shareLink) v.shareLinks.add(log.shareLink);
      if (new Date(log.timestamp) > new Date(v.lastSeen)) v.lastSeen = log.timestamp;
      if (new Date(log.timestamp) < new Date(v.firstSeen)) v.firstSeen = log.timestamp;
    }

    const visitors = Object.values(visitorMap).map(v => {
      const hoursSinceLastSeen = (now - new Date(v.lastSeen).getTime()) / (1000 * 60 * 60);
      const recencyScore   = Math.max(0, 100 - hoursSinceLastSeen * 2);
      const frequencyScore = Math.min(100, v.totalEvents * 10);
      const depthScore     = Math.min(100, v.docsViewed.size * 15);
      const downloadBonus  = v.downloads * 20;

      const engagementScore = Math.min(
        100,
        Math.round((recencyScore * 0.4) + (frequencyScore * 0.3) + (depthScore * 0.2) + (downloadBonus * 0.1))
      );

      let status: 'hot' | 'warm' | 'cold' | 'new';
      if (engagementScore >= 70) status = 'hot';
      else if (engagementScore >= 40) status = 'warm';
      else if (hoursSinceLastSeen < 24) status = 'new';
      else status = 'cold';

      return {
        email: v.email,
        totalEvents: v.totalEvents,
        docsViewed: v.docsViewed.size,
        downloads: v.downloads,
        firstSeen: v.firstSeen,
        lastSeen: v.lastSeen,
        engagementScore,
        status
      };
    }).sort((a, b) => b.engagementScore - a.engagementScore);

    // ─── 3. DOCUMENT PERFORMANCE ──────────────────────────────────────────
    const docMap: Record<string, {
      documentId: string
      documentName: string
      views: number
      downloads: number
      uniqueViewers: Set<string>
      lastViewed: Date | null
    }> = {};

    for (const log of logs) {
      if (!log.documentId) continue;
      const docId   = log.documentId.toString();
      const docName = log.documentName || 'Unknown Document';

      if (!docMap[docId]) {
        docMap[docId] = {
          documentId: docId,
          documentName: docName,
          views: 0,
          downloads: 0,
          uniqueViewers: new Set(),
          lastViewed: null
        };
      }

      const d = docMap[docId];
      if (log.event === 'document_view' || log.event === 'view') {
        d.views++;
        if (!d.lastViewed || new Date(log.timestamp) > new Date(d.lastViewed)) {
          d.lastViewed = log.timestamp;
        }
      }
      if (log.event === 'download') d.downloads++;
      if (log.visitorEmail) d.uniqueViewers.add(log.visitorEmail);
    }

    const documents = Object.values(docMap).map(d => ({
      documentId: d.documentId,
      documentName: d.documentName,
      views: d.views,
      downloads: d.downloads,
      uniqueViewers: d.uniqueViewers.size,
      lastViewed: d.lastViewed
    })).sort((a, b) => b.views - a.views);

    // ─── 4. ACTIVITY TIMELINE ────────────────────────────────────────────
    const timeline = logs.slice(0, 50).map(log => ({
      id: log._id.toString(),
      email: log.visitorEmail || 'Anonymous',
      event: log.event,
      documentName: log.documentName || null,
      documentId: log.documentId?.toString() || null,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress || null,
      shareLink: log.shareLink || null
    }));

    // ─── 5. DAILY VISITS (last 30 days) ──────────────────────────────────
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const recentLogs    = logs.filter(l => new Date(l.timestamp) >= thirtyDaysAgo);

    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d   = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    for (const log of recentLogs) {
      const key = new Date(log.timestamp).toISOString().split('T')[0];
      if (dailyMap[key] !== undefined) dailyMap[key]++;
    }

    const dailyVisits = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ─── 6. DEAL HEAT SCORE ───────────────────────────────────────────────
    const last7DaysLogs = logs.filter(l => new Date(l.timestamp) >= new Date(now - 7 * 24 * 60 * 60 * 1000));
    const last24hLogs   = logs.filter(l => new Date(l.timestamp) >= new Date(now - 24 * 60 * 60 * 1000));

    const dealHeatScore = Math.round(
      Math.min(40, last24hLogs.length * 8) +
      Math.min(30, last7DaysLogs.length * 3) +
      Math.min(20, uniqueVisitors * 5) +
      Math.min(10, totalDownloads * 5)
    );

   // ─────────────────────────────────────────────────────────────────────────────
// REPLACE ONLY SECTION 7 in your analytics-route-v2.ts
// Find: "// ─── 7. PER SHARE LINK BREAKDOWN"  and replace through "shareLinks.sort..."
// ─────────────────────────────────────────────────────────────────────────────

    // ─── 7. PER SHARE LINK BREAKDOWN (DocSend-style) ─────────────────────
    // publicAccess is now an ARRAY — handle both old (object) and new (array) format
    const publicAccessList: any[] = Array.isArray(space.publicAccess)
      ? space.publicAccess
      : space.publicAccess
        ? [space.publicAccess]   // backwards compat: old single-object format
        : [];

    const totalDocsInSpace = await db.collection('documents').countDocuments({
      spaceId: new ObjectId(spaceId),
      archived: { $ne: true }
    });

    const viewEvents     = ['view', 'document_view', 'docment_enter', 'space_open', 'page_view'];
    const downloadEvents = ['download', 'file_download', 'document_download'];

    const shareLinks = publicAccessList.map((pa: any) => {
      const linkSlug = pa.shareLink || '';

      // All logs that came through this specific share link
      const linkLogs = logs.filter((l: any) => l.shareLink === linkSlug);

      const visits         = linkLogs.filter((l: any) => viewEvents.includes(l.event)).length;
      const allEvents      = linkLogs.length
      const linkVisitors   = new Set(linkLogs.map((l: any) => l.visitorEmail).filter(Boolean)).size;
      const downloads      = linkLogs.filter((l: any) => downloadEvents.includes(l.event)).length;
      const docsVisited    = new Set(
        linkLogs.filter((l: any) => l.documentId).map((l: any) => l.documentId.toString())
      ).size;

      // Last activity from this link
      const sortedLinkLogs = [...linkLogs].sort(
        (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const linkLastActivity = sortedLinkLogs.length > 0 ? sortedLinkLogs[0].timestamp : null;

      // Heat score for this specific link
      const linkLast24h = linkLogs.filter(
        (l: any) => new Date(l.timestamp) >= new Date(now - 24 * 60 * 60 * 1000)
      );
      const linkLast7d  = linkLogs.filter(
        (l: any) => new Date(l.timestamp) >= new Date(now - 7 * 24 * 60 * 60 * 1000)
      );
      const linkHeat = Math.min(100, Math.round(
        Math.min(40, linkLast24h.length * 10) +
        Math.min(40, linkLast7d.length  * 4)  +
        Math.min(20, linkVisitors        * 10)
      ));

      let linkStatus: 'hot' | 'warm' | 'cold' | 'never';
      if (allEvents === 0)    linkStatus = 'never';
      else if (linkHeat >= 60) linkStatus = 'hot';
      else if (linkHeat >= 25) linkStatus = 'warm';
      else                     linkStatus = 'cold';

      return {
        shareLink:     linkSlug,
        label:         pa.label || null,
        securityLevel: pa.securityLevel || 'open',
        createdAt:     pa.createdAt     || null,
        expiresAt:     pa.expiresAt     || null,
        isExpired:     pa.expiresAt ? new Date(pa.expiresAt) < new Date() : false,
        enabled:       pa.enabled !== false,
        visits,
        allEvents,
        visitors:      linkVisitors,
        downloads,
        docsVisited,
        totalDocs:     totalDocsInSpace,
        lastActivity:  linkLastActivity,
        heatScore:     linkHeat,
        status:        linkStatus,
        publicUrl:     pa.publicUrl || `${process.env.NEXT_PUBLIC_APP_URL}/portal/${linkSlug}`
      };
    }).sort((a: any, b: any) => {
      // Sort: links with activity first, then by heat score
      if (b.allEvents !== a.allEvents) return b.allEvents - a.allEvents;
      return b.heatScore - a.heatScore;
    });

    // ─── RESPONSE ─────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalViews,
          totalDownloads,
          uniqueVisitors,
          totalEvents,
          lastActivity,
          dealHeatScore,
          totalShareLinks: shareLinks.length
        },
        shareLinks,   // ← NEW
        visitors,
        documents,
        timeline,
        dailyVisits
      }
    });

  } catch (error) {
    console.error('❌ Analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}