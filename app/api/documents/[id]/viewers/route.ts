// app/api/documents/[id]/viewers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // Verify ownership
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get all shares for this document
    const shares = await db.collection('shares')
      .find({ 
        documentId,
        userId: user.id 
      })
      .toArray();

    const shareIds = shares.map(s => s._id.toString());

    // Get all viewers from share_viewers collection
    const viewers = await db.collection('share_viewers')
      .find({ 
        shareId: { $in: shareIds }
      })
      .sort({ lastAccessAt: -1 })
      .toArray();

    // Get location data from analytics events
    const analyticsEvents = await db.collection('analytics_events')
      .find({
        shareId: { $in: shareIds },
        event: 'page_view',
        location: { $exists: true, $ne: null }
      })
      .toArray();

    // Build viewer profiles with location
    const viewerProfiles = viewers.map(viewer => {
      // Find location from analytics events
      const viewerEvents = analyticsEvents.filter(e => 
        e.email === viewer.email || e.viewerId === viewer.viewerId
      );
      
      const locationEvent = viewerEvents.find(e => e.location);
      const location = locationEvent?.location || null;

      // Calculate engagement level
      const engagement = calculateEngagement(viewer);

      return {
        email: viewer.email,
        name: viewer.name,
        company: viewer.company,
        firstAccessAt: viewer.firstAccessAt,
        lastAccessAt: viewer.lastAccessAt,
        totalViews: viewer.totalViews || 1,
        totalTimeSpent: viewer.totalTimeSpent || 0,
        location: location ? {
          city: location.city,
          country: location.country,
        } : null,
        engagement,
      };
    });

    // Calculate summary stats
    const summary = {
      totalViewers: viewerProfiles.length,
      uniqueCompanies: new Set(viewerProfiles.map(v => v.company).filter(Boolean)).size,
      avgTimeSpent: viewerProfiles.length > 0
        ? Math.round(viewerProfiles.reduce((sum, v) => sum + v.totalTimeSpent, 0) / viewerProfiles.length)
        : 0,
      topLocations: getTopLocations(viewerProfiles),
    };

    return NextResponse.json({
      success: true,
      viewers: viewerProfiles,
      summary,
    });

  } catch (error) {
    console.error('❌ Fetch viewers error:', error);
    return NextResponse.json({
      error: 'Failed to fetch viewers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateEngagement(viewer: any): 'high' | 'medium' | 'low' {
  let score = 0;

  // Views contribute
  score += Math.min(viewer.totalViews * 10, 40);

  // Time spent contributes
  const minutes = viewer.totalTimeSpent / 60;
  score += Math.min(minutes * 2, 40);

  // Recency contributes
  const hoursSinceLastView = (Date.now() - new Date(viewer.lastAccessAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastView < 24) score += 20;
  else if (hoursSinceLastView < 72) score += 10;

  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function getTopLocations(viewers: any[]): Array<{ location: string; count: number }> {
  const locationCounts: Record<string, number> = {};

  viewers.forEach(viewer => {
    if (viewer.location) {
      const key = `${viewer.location.city}, ${viewer.location.country}`;
      locationCounts[key] = (locationCounts[key] || 0) + 1;
    }
  });

  return Object.entries(locationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}