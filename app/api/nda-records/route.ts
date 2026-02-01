// app/api/nda-records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // '7days', '30days', '90days'

    const db = await dbPromise;

    // Build query
    const query: any = {
      ownerId: user.id,
    };

    // Add date filter
    if (period) {
      const daysAgo = period === '7days' ? 7 : period === '30days' ? 30 : 90;
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      
      query.timestamp = { $gte: dateThreshold };
    }

    // Fetch records
    const records = await db.collection('nda_acceptances')
      .find(query)
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      records: records.map(r => ({
        _id: r._id.toString(),
        certificateId: r.certificateId,
        documentId: r.documentId,
        documentTitle: r.documentTitle,
        shareId: r.shareId,
        viewerName: r.viewerName,
        viewerEmail: r.viewerEmail,
        viewerCompany: r.viewerCompany,
        timestamp: r.timestamp,
        ip: r.ip,
        ndaVersion: r.ndaVersion || 'Standard',
      })),
      total: records.length,
    });

  } catch (error) {
    console.error('❌ Fetch NDA records error:', error);
    return NextResponse.json({
      error: 'Failed to fetch records',
    }, { status: 500 });
  }
}