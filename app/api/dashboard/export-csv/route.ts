import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
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

    // Get all signature requests
    const allRequests = await db.collection("signature_requests")
      .find({ 
        ownerId: userId,
        createdAt: { $gte: startDate },
        archived: { $ne: true }
      })
      .toArray();

    // Build CSV data
    const csvRows = [
      // Header
      [
        'Document Name',
        'Recipient Name',
        'Recipient Email',
        'Status',
        'Sent Date',
        'Viewed Date',
        'Signed Date',
        'Device',
        'Browser',
        'OS',
        'Time Spent (seconds)',
        'IP Address',
      ].join(',')
    ];

    // Data rows
    allRequests.forEach(req => {
      const timeSpent = req.viewedAt && req.signedAt
        ? Math.floor((new Date(req.signedAt).getTime() - new Date(req.viewedAt).getTime()) / 1000)
        : '';

      csvRows.push([
        `"${req.documentName || 'Unknown'}"`,
        `"${req.recipient?.name || ''}"`,
        `"${req.recipient?.email || ''}"`,
        req.status || 'pending',
        req.createdAt ? new Date(req.createdAt).toISOString() : '',
        req.viewedAt ? new Date(req.viewedAt).toISOString() : '',
        req.signedAt ? new Date(req.signedAt).toISOString() : '',
        req.device || '',
        req.browser || '',
        req.os || '',
        timeSpent,
        req.ipAddress || '',
      ].join(','));
    });

    const csv = csvRows.join('\n');

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="signature-analytics-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error("❌ Error exporting CSV:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}