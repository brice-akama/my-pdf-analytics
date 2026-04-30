// Route: GET /api/documents/[id]/signature-analytics
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { checkAccess } from '@/lib/checkAccess';
import { getAnalyticsLevel } from '@/lib/planLimits';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Auth + plan ───────────────────────────────────────────────
    const access = await checkAccess(req)
    if (!access.ok) return access.response

    const analyticsLevel = getAnalyticsLevel(access.plan)

    const db = await dbPromise;

    // ── Fetch requests ────────────────────────────────────────────
    let requests = await db
      .collection('signature_requests')
      .find({ documentId: id })
      .toArray();

    if (requests.length === 0) {
      requests = await db
        .collection('signature_requests')
        .find({ docId: id })
        .toArray();
    }

    if (requests.length === 0) {
      try {
        const objectId = new ObjectId(id);
        requests = await db
          .collection('signature_requests')
          .find({ $or: [{ documentId: objectId }, { docId: objectId }] })
          .toArray();
      } catch { }
    }

    if (requests.length === 0) {
      return NextResponse.json({ success: true, analytics: null });
    }

    // ── Summary counts — always computed, shown on all plans ──────
    const total = requests.length;
    const viewed = requests.filter(r => r.viewedAt).length;
    const signed = requests.filter(r => r.status === 'signed' || r.signedAt).length;
    const declined = requests.filter(r => r.status === 'declined').length;
    const pending = requests.filter(r => !r.signedAt && r.status !== 'declined').length;
    const completionRate = total > 0 ? Math.round((signed / total) * 100) : 0;

    const funnel = [
      { label: 'Sent',   count: total,  pct: 100 },
      { label: 'Opened', count: viewed, pct: total > 0 ? Math.round((viewed / total) * 100) : 0 },
      { label: 'Signed', count: signed, pct: total > 0 ? Math.round((signed / total) * 100) : 0 },
    ];

    const allSigned = signed === total && total > 0;

    // ── BASIC plan — return counts only, no per-recipient data ────
    if (analyticsLevel === 'basic') {
      return NextResponse.json({
        success: true,
        analyticsLevel: 'basic',
        analytics: {
          summary: {
            total,
            viewed,
            signed,
            declined,
            pending,
            completionRate,
            avgTimeToOpenSeconds: null,
            avgTimeSpentSeconds: null,
            totalTimeSpentSeconds: 0,
          },
          funnel,
          allSigned,
          // Strip everything that requires full plan
          recipients: [],
          pageEngagement: [],
          totalDocPages: 1,
          signerVideoStats: [],
        },
      });
    }

    // ── FULL / ADVANCED — compute everything ──────────────────────
    const recipients = requests.map(r => {
      const sentAt    = r.createdAt ? new Date(r.createdAt).getTime() : null;
      const viewedAt  = r.viewedAt  ? new Date(r.viewedAt).getTime()  : null;
      const signedAt  = r.signedAt  ? new Date(r.signedAt).getTime()  : null;

      const timeToOpenMs = sentAt && viewedAt ? viewedAt - sentAt : null;
      const timeToSignMs = viewedAt && signedAt ? signedAt - viewedAt : null;

      const numPages       = r.pagesViewed?.length || 0;
      const totalDocPages  = r.totalPages || 1;
      const completionRate = totalDocPages > 0
        ? Math.round((numPages / totalDocPages) * 100)
        : 0;

      return {
        id:                    r._id?.toString(),
        name:                  r.recipient?.name     || r.recipientName  || 'Unknown',
        email:                 r.recipient?.email    || r.recipientEmail || '',
        role:                  r.recipient?.role     || '',
        color:                 r.recipient?.color    || '#9333ea',
        status:                r.status              || 'pending',
        sentAt:                r.createdAt           || null,
        viewedAt:              r.viewedAt            || null,
        lastViewedAt:          r.lastViewedAt        || null,
        signedAt:              r.signedAt            || null,
        declinedAt:            r.declinedAt          || null,
        uniqueId:              r.uniqueId            || null,
        declineReason:         r.declineReason       || null,
        delegatedTo:           r.delegatedTo         || null,
        viewCount:             r.viewCount           || 0,
        totalTimeSpentSeconds: r.totalTimeSpentSeconds || 0,
        pagesViewed:           r.pagesViewed         || [],
        completionRate,
        lastActivePage:        r.lastActivePage      || null,
        timeToOpenSeconds:     timeToOpenMs ? Math.floor(timeToOpenMs / 1000) : null,
        timeToSignSeconds:     timeToSignMs ? Math.floor(timeToSignMs / 1000) : null,
        device:                r.device              || null,
        location:              r.location            || null,
        accessCodeVerified:    !!r.accessCodeVerifiedAt,
        selfieVerifiedAt:      r.selfieVerifiedAt    || null,
        selfieVerification:    r.selfieVerification  || null,
        intentVideoUrl:        r.intentVideoUrl      || null,
        intentVideoRecordedAt: r.intentVideoRecordedAt || null,
        viewHistory:           r.viewHistory         || [],
        pageData:              (r.pageData || []).sort((a: any, b: any) => a.page - b.page),
      };
    });

    const avgTimeToOpen = (() => {
      const vals = recipients
        .filter(r => r.timeToOpenSeconds !== null)
        .map(r => r.timeToOpenSeconds as number);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    })();

    const avgTimeSpent = (() => {
      const vals = recipients
        .filter(r => r.totalTimeSpentSeconds > 0)
        .map(r => r.totalTimeSpentSeconds);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    })();

    const totalTimeSpentSeconds = requests.reduce(
      (sum, r) => sum + (r.totalTimeSpentSeconds || 0), 0
    );

    // ── Page engagement ───────────────────────────────────────────
    const documentRef = requests[0]?.documentId || requests[0]?.docId;
    let totalDocPages = 1;
    if (documentRef) {
      try {
        const docRecord = await db.collection('documents').findOne({
          $or: [
            { _id: new ObjectId(documentRef.toString()) },
            { _id: documentRef },
          ]
        });
        totalDocPages = docRecord?.numPages || 1;
      } catch { }
    }

    const pageMap: Record<number, { views: number; totalTime: number }> = {};
    for (let p = 1; p <= totalDocPages; p++) pageMap[p] = { views: 0, totalTime: 0 };

    for (const r of requests) {
      const viewed: number[] = r.pagesViewed || [];
      const timePerPage = viewed.length > 0
        ? Math.round((r.totalTimeSpentSeconds || 0) / viewed.length)
        : 0;
      for (const p of viewed) {
        if (!pageMap[p]) pageMap[p] = { views: 0, totalTime: 0 };
        pageMap[p].views += 1;
        pageMap[p].totalTime += timePerPage;
      }
    }

    const pageEngagement = Object.entries(pageMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([page, data]) => ({
        page: Number(page),
        totalViews: data.views,
        views: data.views,
        avgTime: data.views > 0 ? Math.round(data.totalTime / data.views) : 0,
        totalTime: data.totalTime,
      }));

    // ── Per-signer video stats ────────────────────────────────────
    const signerEmails = recipients.map(r => r.email).filter(Boolean)

    const signerVideoLogs = signerEmails.length > 0
      ? await db.collection('analytics_logs').find({
          documentId: id,
          action: { $in: ['video_watched', 'video_progress', 'video_replayed'] },
          email: { $in: signerEmails }
        }).toArray()
      : []

    const signerVideoMap: Record<string, any> = {}

    signerVideoLogs.forEach((log: any) => {
      const email = log.email
      if (!email) return
      if (!signerVideoMap[email]) signerVideoMap[email] = { email, pages: {} }
      const page = log.pageNumber
      if (!signerVideoMap[email].pages[page]) {
        signerVideoMap[email].pages[page] = {
          page, watchCount: 0, replays: 0, maxCompletion: 0,
          replayedAt: [], lastWatchedAt: null,
        }
      }
      const p = signerVideoMap[email].pages[page]
      if (log.action === 'video_watched') { p.watchCount++; p.lastWatchedAt = log.timestamp || null }
      if (log.action === 'video_replayed') { p.replays++; if (log.replayedAt) p.replayedAt.push(log.replayedAt) }
      if (log.action === 'video_progress' && log.watchPercent) p.maxCompletion = Math.max(p.maxCompletion, log.watchPercent)
    })

    const signerVideoStats = Object.values(signerVideoMap).map((signer: any) => ({
      email: signer.email,
      pages: Object.values(signer.pages).map((p: any) => ({
        page: p.page,
        watchCount: p.watchCount,
        replays: p.replays,
        maxCompletion: p.maxCompletion,
        replayedAt: p.replayedAt,
        lastWatchedAt: p.lastWatchedAt,
        signal: p.replays >= 3 ? 'needs_clarification'
          : p.maxCompletion >= 75 ? 'understood'
          : p.watchCount > 0 ? 'partial'
          : 'not_watched',
      })).sort((a: any, b: any) => a.page - b.page),
      overallSignal: (() => {
        const pages = Object.values(signer.pages) as any[]
        if (!pages.length) return 'not_watched'
        const totalReplays = pages.reduce((s, p) => s + p.replays, 0)
        const avgCompletion = pages.reduce((s, p) => s + p.maxCompletion, 0) / pages.length
        if (totalReplays >= 3) return 'needs_clarification'
        if (avgCompletion >= 75) return 'understood'
        if (pages.some(p => p.watchCount > 0)) return 'partial'
        return 'not_watched'
      })(),
    }))

    return NextResponse.json({
      success: true,
      analyticsLevel,
      analytics: {
        recipients,
        summary: {
          total, viewed, signed, declined, pending, completionRate,
          avgTimeToOpenSeconds: avgTimeToOpen,
          avgTimeSpentSeconds: avgTimeSpent,
          totalTimeSpentSeconds,
        },
        funnel,
        allSigned,
        pageEngagement,
        totalDocPages,
       signerVideoStats,
        signerDealInsight: await (async () => {
  // Build per-signer, per-session re-read signals
  // A "re-read" = same signer visited same page across 2+ distinct sessions
  // This mirrors exactly the fix applied to document analytics
  const allSignerInsights: any[] = []

  for (const r of recipients) {
    if (!r.email) continue

    // Query ALL analytics_logs for this signer across all sessions
    // This is the key fix — pageData in signature_requests only has
    // the latest session data, not cross-session re-reads
    const signerPageLogs = await db.collection('analytics_logs').find({
      documentId: id,
      action: 'page_view',
      email: r.email,
    }).toArray()

    // Also check signature_requests pageData for page visits
    // since signing page tracking writes there too
    const pageDataEntries = r.pageData || []

    // Group analytics_logs by page, count distinct sessions
    const pageSessionMap = new Map<number, Set<string>>()
    signerPageLogs.forEach((log: any) => {
      const p = log.pageNumber
      if (!pageSessionMap.has(p)) pageSessionMap.set(p, new Set())
      if (log.sessionId) pageSessionMap.get(p)!.add(log.sessionId)
    })

    // Also count from pageData — multiple entries for same page = re-read
    // This handles the signature-specific tracking path
    const pageDataVisitCounts = new Map<number, number>()
    pageDataEntries.forEach((p: any) => {
      pageDataVisitCounts.set(
        p.page,
        (pageDataVisitCounts.get(p.page) || 0) + 1
      )
    })

    // Merge both sources — take the higher count
    const reReadPages: { page: number; count: number }[] = []

    // From analytics_logs sessions
    pageSessionMap.forEach((sessions, pageNum) => {
      if (sessions.size >= 2) {
        reReadPages.push({ page: pageNum, count: sessions.size })
      }
    })

    // From pageData multiple entries — catches single-prospect case
    pageDataVisitCounts.forEach((count, pageNum) => {
      if (count >= 2) {
        const existing = reReadPages.find(x => x.page === pageNum)
        if (existing) {
          existing.count = Math.max(existing.count, count)
        } else {
          reReadPages.push({ page: pageNum, count })
        }
      }
    })

    reReadPages.sort((a, b) => b.count - a.count)

    // Video replays for this specific signer
    const signerVideo = signerVideoStats.find((s: any) => s.email === r.email)
    const videoReplays: { page: number; count: number }[] = []
    signerVideo?.pages?.forEach((p: any) => {
      if (p.replays >= 1) {
        videoReplays.push({ page: p.page, count: p.replays })
      }
    })
    videoReplays.sort((a, b) => b.count - a.count)

    if (reReadPages.length === 0 && videoReplays.length === 0) continue

    // Build narrative for this specific signer
    const parts: string[] = []
    if (reReadPages.length > 0) {
      const top = reReadPages[0]
      parts.push(
        `Page ${top.page} was re-read ${top.count} time${top.count > 1 ? 's' : ''}`
      )
    }
    if (videoReplays.length > 0) {
      const top = videoReplays[0]
      parts.push(
        `the page ${top.page} video was replayed ${top.count} time${top.count > 1 ? 's' : ''}`
      )
    }
    if (r.status === 'pending' && r.viewedAt) {
      parts.push('opened but has not signed yet')
    }

    const narrative =
      parts.join(' and ') + '. They may need help justifying this internally.'

    allSignerInsights.push({
      viewerEmail: r.email,
      narrative,
      reReadPages: reReadPages.slice(0, 3),
      videoReplays: videoReplays.slice(0, 3),
      backNavigations: [],
      engagementDropping: false,
      neverForwarded: false,
      documentId: id,
      totalTimeSpentSeconds: r.totalTimeSpentSeconds || 0,
    })
  }

  if (allSignerInsights.length === 0) return null

  // Sort by most time spent first
  allSignerInsights.sort(
    (a, b) => b.totalTimeSpentSeconds - a.totalTimeSpentSeconds
  )

  // Return all signer insights — same shape as document analytics fix
  return {
    viewers: allSignerInsights,
    ...allSignerInsights[0],
  }
})(),
      },
    });

  } catch (err) {
    console.error('Signature analytics error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}