// app/api/documents/[id]/signature-analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await verifyUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

    // DEBUG — remove after confirming
    console.log('🔍 Fetching sig analytics for documentId:', id);
    const sampleDoc = await db.collection('signature_requests').findOne({});
    console.log('🔍 Sample signature_request keys:', sampleDoc ? Object.keys(sampleDoc) : 'collection empty');
    console.log('🔍 Sample documentId field:', sampleDoc?.documentId, '| docId field:', sampleDoc?.docId);

    // Fetch all signature requests — try documentId first, fallback to docId
    let requests = await db
      .collection('signature_requests')
      .find({ documentId: id })
      .toArray();

    if (requests.length === 0) {
      console.log('🔍 No results for documentId, trying docId fallback...');
      requests = await db
        .collection('signature_requests')
        .find({ docId: id })
        .toArray();
    }

    // Also try ObjectId variant if id is a valid ObjectId
    if (requests.length === 0) {
      try {
        const objectId = new ObjectId(id);
        console.log('🔍 Trying ObjectId fallback...');
        requests = await db
          .collection('signature_requests')
          .find({ $or: [{ documentId: objectId }, { docId: objectId }] })
          .toArray();
      } catch {
        // id is not a valid ObjectId, skip
      }
    }

    if (requests.length === 0) {
      return NextResponse.json({ success: true, analytics: null });
    }

    const now = Date.now();

    const recipients = requests.map((r) => {
      const sentAt = r.createdAt ? new Date(r.createdAt).getTime() : null;
      const viewedAt = r.viewedAt ? new Date(r.viewedAt).getTime() : null;
      const signedAt = r.signedAt ? new Date(r.signedAt).getTime() : null;

      const timeToOpenMs = sentAt && viewedAt ? viewedAt - sentAt : null;
      const timeToSignMs = viewedAt && signedAt ? signedAt - viewedAt : null;

      const numPages = r.pagesViewed?.length || 0;
      const totalDocPages = r.totalPages || 1;
      const completionRate = totalDocPages > 0
        ? Math.round((numPages / totalDocPages) * 100)
        : 0;

      return {
        id: r._id?.toString(),
        name: r.recipient?.name || r.recipientName || 'Unknown',
        email: r.recipient?.email || r.recipientEmail || '',
        role: r.recipient?.role || '',
        color: r.recipient?.color || '#9333ea',
        status: r.status || 'pending',
        sentAt: r.createdAt || null,
        viewedAt: r.viewedAt || null,
        lastViewedAt: r.lastViewedAt || null,
        signedAt: r.signedAt || null,
        declinedAt: r.declinedAt || null,
        declineReason: r.declineReason || null,
        delegatedTo: r.delegatedTo || null,
        viewCount: r.viewCount || 0,
        totalTimeSpentSeconds: r.totalTimeSpentSeconds || 0,
        pagesViewed: r.pagesViewed || [],
        completionRate,
        lastActivePage: r.lastActivePage || null,
        timeToOpenSeconds: timeToOpenMs ? Math.floor(timeToOpenMs / 1000) : null,
        timeToSignSeconds: timeToSignMs ? Math.floor(timeToSignMs / 1000) : null,
        device: r.device || null,
        location: r.location || null,
        accessCodeVerified: !!r.accessCodeVerifiedAt,
        selfieVerified: !!r.selfieVerifiedAt,
        intentVideoUrl: r.intentVideoUrl || null,
        viewHistory: r.viewHistory || [],
      };
    });

    // Summary stats
    const total = recipients.length;
    const viewed = recipients.filter((r) => r.viewedAt).length;
    const signed = recipients.filter((r) => r.status === 'signed' || r.signedAt).length;
    const declined = recipients.filter((r) => r.status === 'declined').length;
    const pending = recipients.filter(
      (r) => !r.signedAt && r.status !== 'declined'
    ).length;

    const avgTimeToOpen = (() => {
      const vals = recipients
        .filter((r) => r.timeToOpenSeconds !== null)
        .map((r) => r.timeToOpenSeconds as number);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    })();

    const avgTimeSpent = (() => {
      const vals = recipients
        .filter((r) => r.totalTimeSpentSeconds > 0)
        .map((r) => r.totalTimeSpentSeconds);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    })();

    const completionRate = total > 0 ? Math.round((signed / total) * 100) : 0;

    // Funnel: sent → viewed → signed
    const funnel = [
      { label: 'Sent', count: total, pct: 100 },
      { label: 'Opened', count: viewed, pct: total > 0 ? Math.round((viewed / total) * 100) : 0 },
      { label: 'Signed', count: signed, pct: total > 0 ? Math.round((signed / total) * 100) : 0 },
    ];


    // ── PAGE ENGAGEMENT from pagesViewed arrays ──────────────────────
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
  } catch { /* best-effort */ }
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

const totalTimeSpentSeconds = requests.reduce(
  (sum, r) => sum + (r.totalTimeSpentSeconds || 0), 0
);

    return NextResponse.json({
      success: true,
      analytics: {
        recipients,
        summary: {
          total,
          viewed,
          signed,
          declined,
          pending,
          completionRate,
          avgTimeToOpenSeconds: avgTimeToOpen,
          avgTimeSpentSeconds: avgTimeSpent,
          totalTimeSpentSeconds,  
        },
        funnel,
        allSigned: signed === total && total > 0,
        pageEngagement,                 // ← ADD
    totalDocPages,  
      },
    });
  } catch (err) {
    console.error('Signature analytics error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}