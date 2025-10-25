import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { 
      shareToken, 
      documentId,
      viewerEmail, 
      timeSpent, 
      pagesViewed,
      pageTimeSpent,
      downloaded 
    } = await request.json();

    const db = await dbPromise;

    // Get viewer info from headers
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Detect device type
    const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);
    const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    // Create view record
    const view = {
      documentId: new ObjectId(documentId),
      shareToken: shareToken || null,
      viewerEmail: viewerEmail || null,
      viewerIp: ip,
      device,
      userAgent,
      country: 'Unknown', // In production, use IP geolocation service
      timeSpent: timeSpent || 0,
      pagesViewed: pagesViewed || 0,
      pageTimeSpent: pageTimeSpent || {},
      downloaded: downloaded || false,
      viewedAt: new Date(),
    };

    await db.collection('document_views').insertOne(view);

    // Update share record view count if applicable
    if (shareToken) {
  await db.collection('shares').updateOne(
    { shareToken },
    [
      {
        $set: {
          views: { $add: ["$views", 1] },
          viewedBy: {
            $concatArrays: [
              { $ifNull: ["$viewedBy", []] },
              [
                {
                  email: viewerEmail,
                  viewedAt: new Date(),
                },
              ],
            ],
          },
        },
      },
    ]
  );
}

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}