// app/api/dashboard/signature-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // Use the auth helper instead of manual cookie handling
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;
    
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);

    const db = await dbPromise;

    // Get all signature requests for this user
    const allRequests = await db.collection("signature_requests")
      .find({ 
        ownerId: userId,
        createdAt: { $gte: startDate }
      })
      .toArray();

    // Calculate stats
    const totalRequests = allRequests.length;
    const pendingRequests = allRequests.filter(r => r.status === 'pending').length;
    const viewedRequests = allRequests.filter(r => r.status === 'viewed').length;
    const signedRequests = allRequests.filter(r => r.status === 'signed').length;
    
    // Get previous period for comparison
    let prevStartDate = new Date(startDate);
    if (range === '7d') prevStartDate.setDate(startDate.getDate() - 7);
    else if (range === '30d') prevStartDate.setDate(startDate.getDate() - 30);
    else if (range === '90d') prevStartDate.setDate(startDate.getDate() - 90);

    const prevRequests = await db.collection("signature_requests")
      .find({ 
        ownerId: userId,
        createdAt: { $gte: prevStartDate, $lt: startDate }
      })
      .toArray();

    const prevSigned = prevRequests.filter(r => r.status === 'signed').length;
    const signedChange = prevSigned > 0 
      ? ((signedRequests - prevSigned) / prevSigned) * 100 
      : signedRequests > 0 ? 100 : 0;

    // Get unique signers
    const uniqueSigners = new Set(allRequests.map(r => r.recipient.email)).size;

    // Calculate average time to sign
    const signedWithTime = allRequests.filter(r => r.signedAt && r.createdAt);
    const avgTimeToSign = signedWithTime.length > 0
      ? signedWithTime.reduce((sum, r) => {
          return sum + (new Date(r.signedAt).getTime() - new Date(r.createdAt).getTime());
        }, 0) / signedWithTime.length / 1000 // Convert to seconds
      : 0;

    // Get signature requests over time (daily)
    const requestsOverTime: { date: string; sent: number; signed: number }[] = [];
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayRequests = allRequests.filter(r => {
        const reqDate = new Date(r.createdAt).toISOString().split('T')[0];
        return reqDate === dateStr;
      });
      const daySigned = allRequests.filter(r => {
        if (!r.signedAt) return false;
        const signDate = new Date(r.signedAt).toISOString().split('T')[0];
        return signDate === dateStr;
      });

      requestsOverTime.push({
        date: dateStr,
        sent: dayRequests.length,
        signed: daySigned.length,
      });
    }

    // Get documents with signature requests
    const documentIds = [...new Set(allRequests.map(r => r.documentId))];
    const documents = await db.collection("documents")
      .find({
        _id: { $in: documentIds.map(id => new ObjectId(id)) }
      })
      .toArray();

    // Get top documents
    const topDocuments = await Promise.all(
      documentIds.slice(0, 10).map(async (docId) => {
        const docRequests = allRequests.filter(r => r.documentId === docId);
        const doc = documents.find(d => d._id.toString() === docId);
        
        const signedCount = docRequests.filter(r => r.status === 'signed').length;
        const totalCount = docRequests.length;
        const completionRate = totalCount > 0 ? Math.round((signedCount / totalCount) * 100) : 0;

        // Get views for this document's signatures
        const signatureIds = docRequests.map(r => r.uniqueId);
        const views = await db.collection("signature_views")
          .countDocuments({ signatureId: { $in: signatureIds } });

        return {
          id: docId,
          documentId: docId,
          name: doc?.filename || doc?.originalFilename || 'Unknown Document',
          totalSigners: totalCount,
          signedCount: signedCount,
          pendingCount: totalCount - signedCount,
          completionRate: completionRate,
          views: views,
          status: doc?.status || 'pending',
          createdAt: docRequests[0]?.createdAt,
          signers: docRequests.map(r => ({
            name: r.recipient.name,
            email: r.recipient.email,
            status: r.status,
            uniqueId: r.uniqueId,
            viewedAt: r.viewedAt,
            signedAt: r.signedAt,
          })),
        };
      })
    );

    // Sort by most recent
    topDocuments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Recent activity
    const recentActivity = allRequests
      .sort((a, b) => {
        const aTime = a.signedAt || a.viewedAt || a.createdAt;
        const bTime = b.signedAt || b.viewedAt || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      })
      .slice(0, 15)
      .map(r => {
        const doc = documents.find(d => d._id.toString() === r.documentId);
        return {
          id: r.uniqueId,
          type: r.status === 'signed' ? 'signed' : r.status === 'viewed' ? 'viewed' : 'sent',
          documentName: doc?.originalFilename || doc?.filename || 'Unknown',
          signerName: r.recipient.name,
          signerEmail: r.recipient.email,
          timestamp: r.signedAt || r.viewedAt || r.createdAt,
        };
      });

    // Completion funnel
    const funnelData = [
      { stage: 'Sent', count: totalRequests, percentage: 100 },
      { stage: 'Viewed', count: viewedRequests + signedRequests, percentage: totalRequests > 0 ? Math.round(((viewedRequests + signedRequests) / totalRequests) * 100) : 0 },
      { stage: 'Signed', count: signedRequests, percentage: totalRequests > 0 ? Math.round((signedRequests / totalRequests) * 100) : 0 },
    ];

    // Signer engagement
    const highEngagement = allRequests.filter(r => r.status === 'signed' && r.signedAt && r.createdAt && 
      (new Date(r.signedAt).getTime() - new Date(r.createdAt).getTime()) < 86400000 // < 24 hours
    ).length;
    const mediumEngagement = allRequests.filter(r => r.status === 'viewed').length;
    const lowEngagement = allRequests.filter(r => r.status === 'pending').length;

    return NextResponse.json({
      success: true,
      stats: {
        totalRequests,
        pendingRequests,
        viewedRequests,
        signedRequests,
        uniqueSigners,
        avgTimeToSign: Math.round(avgTimeToSign),
        completionRate: totalRequests > 0 ? Math.round((signedRequests / totalRequests) * 100) : 0,
        trending: {
          signedChange: Math.round(signedChange),
        },
        requestsOverTime,
        topDocuments,
        recentActivity,
        conversionFunnel: funnelData,
        signerEngagement: [
          { segment: 'High', count: highEngagement, avgTime: 3600 },
          { segment: 'Medium', count: mediumEngagement, avgTime: 86400 },
          { segment: 'Low', count: lowEngagement, avgTime: 0 },
        ],
      },
    });
  } catch (error) {
    console.error("❌ Error fetching signature stats:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}