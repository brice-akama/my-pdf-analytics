import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(params.id);
    
    // Verify document ownership
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get all views for this document
    const views = await db.collection('document_views')
      .find({ documentId })
      .sort({ viewedAt: -1 })
      .toArray();

    // Calculate total views
    const totalViews = views.length;

    // Calculate unique viewers
    const uniqueViewers = new Set(views.map(v => v.viewerEmail || v.viewerIp)).size;

    // Calculate average time (in seconds)
    const viewsWithTime = views.filter(v => v.timeSpent);
    const averageTime = viewsWithTime.length > 0
      ? Math.round(viewsWithTime.reduce((sum, v) => sum + v.timeSpent, 0) / viewsWithTime.length)
      : 0;

    // Format average time
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };

    // Calculate completion rate (viewed all pages)
    const completedViews = views.filter(v => v.pagesViewed >= document.numPages).length;
    const completionRate = totalViews > 0 ? Math.round((completedViews / totalViews) * 100) : 0;

    // Views by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const viewsByDate = last7Days.map(date => {
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayViews = views.filter(v => {
        const viewDate = new Date(v.viewedAt);
        return viewDate >= dayStart && viewDate <= dayEnd;
      });

      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        views: dayViews.length
      };
    });

    // Page engagement
    const pageEngagement = Array.from({ length: document.numPages }, (_, i) => {
      const pageNum = i + 1;
      const pageViews = views.filter(v => v.pagesViewed >= pageNum);
      const pageViewsCount = pageViews.length;
      const percentage = totalViews > 0 ? Math.round((pageViewsCount / totalViews) * 100) : 0;
      
      // Calculate average time on this page
      const pageTimes = views
        .filter(v => v.pageTimeSpent && v.pageTimeSpent[pageNum])
        .map(v => v.pageTimeSpent[pageNum]);
      const avgTime = pageTimes.length > 0
        ? Math.round(pageTimes.reduce((sum, t) => sum + t, 0) / pageTimes.length)
        : 0;

      return {
        page: pageNum,
        views: percentage,
        avgTime
      };
    });

    // Top viewers
    const viewerStats = new Map<string, { 
      email: string, 
      views: number, 
      lastViewed: Date,
      totalTime: number 
    }>();

    views.forEach(view => {
      const email = view.viewerEmail || `Anonymous (${view.viewerIp?.slice(0, 10)}...)`;
      const existing = viewerStats.get(email);
      
      if (existing) {
        existing.views++;
        if (new Date(view.viewedAt) > existing.lastViewed) {
          existing.lastViewed = new Date(view.viewedAt);
        }
        existing.totalTime += view.timeSpent || 0;
      } else {
        viewerStats.set(email, {
          email,
          views: 1,
          lastViewed: new Date(view.viewedAt),
          totalTime: view.timeSpent || 0
        });
      }
    });

    const topViewers = Array.from(viewerStats.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map(viewer => ({
        email: viewer.email,
        views: viewer.views,
        lastViewed: getTimeAgo(viewer.lastViewed),
        time: formatTime(viewer.totalTime)
      }));

    // Device breakdown
    const devices = {
      desktop: views.filter(v => v.device === 'desktop').length,
      mobile: views.filter(v => v.device === 'mobile').length,
      tablet: views.filter(v => v.device === 'tablet').length,
    };
    
    const devicePercentages = {
      desktop: totalViews > 0 ? Math.round((devices.desktop / totalViews) * 100) : 0,
      mobile: totalViews > 0 ? Math.round((devices.mobile / totalViews) * 100) : 0,
      tablet: totalViews > 0 ? Math.round((devices.tablet / totalViews) * 100) : 0,
    };

    // Geographic distribution
    const locationCounts = new Map<string, number>();
    views.forEach(view => {
      const country = view.country || 'Unknown';
      locationCounts.set(country, (locationCounts.get(country) || 0) + 1);
    });

    const locations = Array.from(locationCounts.entries())
      .map(([country, count]) => ({
        country,
        views: count,
        percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Get shares count
    const shares = await db.collection('shares')
      .countDocuments({ documentId });

    // Get downloads count
    const downloads = views.filter(v => v.downloaded).length;

    return NextResponse.json({
      success: true,
      analytics: {
        totalViews,
        uniqueViewers,
        averageTime: formatTime(averageTime),
        completionRate,
        downloads,
        shares,
        viewsByDate,
        pageEngagement,
        topViewers,
        devices: devicePercentages,
        locations,
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}