// app/api/documents/[id]/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params in Next.js 15
    const { id } = await params;
    
    // ✅ Verify user via HTTP-only cookie
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;
    const documentId = new ObjectId(id);
    console.log(id); // Add this to debug

    // ✅ Verify ownership of the document
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    // ✅ Aggregated tracking from document
    const tracking = document.tracking || {};
    const analyticsData = document.analytics || {};

    // Fetch detailed document views
    const views = await db.collection('document_views')
      .find({ documentId })
      .sort({ viewedAt: -1 })
      .toArray();

    const totalViews = tracking.views || views.length;
    const uniqueViewers = tracking.uniqueVisitors?.length || new Set(views.map(v => v.viewerEmail || v.viewerIp)).size;

    // Average view time
    const averageTimeSeconds = tracking.averageViewTime || Math.round((views.reduce((sum, v) => sum + (v.timeSpent || 0), 0)) / (views.length || 1));

    // Completion rate
    const completedViews = views.filter(v => v.pagesViewed >= document.numPages).length;
    const completionRate = totalViews ? Math.round((completedViews / totalViews) * 100) : 0;

    // Views by last 7 days
    const today = new Date();
    const viewsByDate = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));

      const count = views.filter(v => {
        const viewedAt = new Date(v.viewedAt);
        return viewedAt >= start && viewedAt <= end;
      }).length;

      return { date: `${date.getMonth() + 1}/${date.getDate()}`, views: count };
    });

    // ✅ CORRECT VERSION - Use this
const shares = await db.collection('shares')
  .find({ documentId })
  .toArray();

const pageEngagement = await Promise.all(
  Array.from({ length: document.numPages }, async (_, i) => {
    const pageNum = i + 1;
    
    let pageViews = 0;
    let totalTimeOnPage = 0;
    
    // All shares are already for this document
    for (const share of shares) {
      const pageKey = `page_${pageNum}`;
      pageViews += share.tracking?.pageViews?.[pageKey] || 0;
      totalTimeOnPage += share.tracking?.timePerPage?.[pageKey] || 0;
    }
    
    const percentage = totalViews ? Math.round((pageViews / totalViews) * 100) : 0;
    const avgTime = pageViews > 0 ? Math.round(totalTimeOnPage / pageViews) : 0;

    return { 
      page: pageNum, 
      views: percentage, 
      avgTime,
      totalViews: pageViews,
      totalTime: totalTimeOnPage,
    };
  })
);

    
    
    // Top viewers - UPDATED to show real viewer emails from shares
const topViewers: any[] = [];

// Get all shares for this document
const documentShares = await db.collection('shares')
  .find({ documentId })
  .toArray();

// Collect viewer data from all shares
const viewerEmailMap = new Map<string, {
  email: string;
  views: number;
  lastViewed: Date;
  totalTime: number;
  shares: string[];
}>();

for (const share of documentShares) {
  // Get viewer emails from this share
  const viewerEmails = share.tracking?.viewerEmails || [];
  
  for (const email of viewerEmails) {
    if (!email) continue;
    
    // Get analytics events for this email
    const emailEvents = await db.collection('analytics_logs')
      .find({ 
        documentId: id,
        email: email,
        action: 'document_viewed'
      })
      .sort({ timestamp: -1 })
      .toArray();
    
    const viewCount = emailEvents.length || 1; // At least 1 view if email is recorded
    const lastView = emailEvents[0]?.timestamp || share.tracking?.lastViewedAt || new Date();
    
    // Get viewer ID hash from share tracking
    const viewerIds = share.tracking?.uniqueViewers || [];
    let timeSpent = 0;
    
    // Try to match email to viewer ID and get time spent
    for (const viewerId of viewerIds) {
      const viewerTime = share.tracking?.timeSpentByViewer?.[viewerId] || 0;
      timeSpent += viewerTime;
    }
    
    if (viewerEmailMap.has(email)) {
      const existing = viewerEmailMap.get(email)!;
      existing.views += viewCount;
      existing.lastViewed = new Date(Math.max(existing.lastViewed.getTime(), new Date(lastView).getTime()));
      existing.totalTime += timeSpent;
      if (!existing.shares.includes(share.shareToken)) {
        existing.shares.push(share.shareToken);
      }
    } else {
      viewerEmailMap.set(email, {
        email,
        views: viewCount,
        lastViewed: new Date(lastView),
        totalTime: timeSpent,
        shares: [share.shareToken]
      });
    }
  }
  
  // Also include anonymous viewers with IDs (only if no emails recorded)
  if (viewerEmails.length === 0) {
    const uniqueViewers = share.tracking?.uniqueViewers || [];
    for (const viewerId of uniqueViewers) {
      const anonKey = `Anonymous (${viewerId.substring(0, 8)})`;
      const timeSpent = share.tracking?.timeSpentByViewer?.[viewerId] || 0;
      
      if (!viewerEmailMap.has(anonKey)) {
        viewerEmailMap.set(anonKey, {
          email: anonKey,
          views: 1,
          lastViewed: share.tracking?.lastViewedAt || new Date(),
          totalTime: timeSpent,
          shares: [share.shareToken]
        });
      }
    }
  }
}

// Convert to array and sort by views
const sortedViewers = Array.from(viewerEmailMap.values())
  .sort((a, b) => b.views - a.views)
  .slice(0, 10)
  .map(v => ({
    email: v.email,
    views: v.views,
    lastViewed: formatTimeAgo(v.lastViewed),
    time: formatTime(v.totalTime),
    shares: v.shares.length, // Number of different share links used
  }));

topViewers.push(...sortedViewers);
    // Device breakdown
    const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
    type DeviceType = 'desktop' | 'mobile' | 'tablet';
    
    views.forEach(v => { 
      if (v.device && (v.device as DeviceType)) {
        deviceCounts[v.device as DeviceType]++;
      }
    });
    const devicePercentages = Object.fromEntries(
      Object.entries(deviceCounts).map(([k, v]) => [k, totalViews ? Math.round((v / totalViews) * 100) : 0])
    );

    // Top 5 locations
    const locationMap = new Map<string, number>();
    views.forEach(v => locationMap.set(v.country || 'Unknown', (locationMap.get(v.country || 'Unknown') || 0) + 1));
    const locations = Array.from(locationMap.entries())
      .map(([country, count]) => ({ country, views: count, percentage: totalViews ? Math.round((count / totalViews) * 100) : 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Shares & downloads
    const totalShares = tracking.shares || await db.collection('shares').countDocuments({ documentId });
    const downloads = tracking.downloads || views.filter(v => v.downloaded).length;

    // Return full analytics + content quality + document info + sharing
    return NextResponse.json({
      success: true,
      analytics: {
        // Engagement
        totalViews,
        uniqueViewers,
        averageTime: formatTime(averageTimeSeconds),
        completionRate,
        downloads,
        shares: totalShares,
        viewsByDate,
        pageEngagement,
        topViewers,
        devices: devicePercentages,
        locations,
        lastViewed: tracking.lastViewed || null,

        // Content quality metrics
        contentQuality: {
          healthScore: analyticsData.healthScore || 0,
          readabilityScore: analyticsData.readabilityScore || 0,
          sentimentScore: analyticsData.sentimentScore || 0,
          grammarErrors: analyticsData.errorCounts?.grammar || 0,
          spellingErrors: analyticsData.errorCounts?.spelling || 0,
          clarityErrors: analyticsData.errorCounts?.clarity || 0,
          topKeywords: analyticsData.keywords?.slice(0, 10) || [],
          entities: analyticsData.entities?.slice(0, 10) || [],
          language: analyticsData.language || 'en',
          formalityLevel: analyticsData.formalityLevel || 'neutral',
        },

        // Document info
        documentInfo: {
          filename: document.originalFilename,
          format: document.originalFormat,
          numPages: document.numPages,
          wordCount: document.wordCount,
          size: document.size,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        },

        // Sharing info
        sharingInfo: {
          isPublic: document.isPublic || false,
          sharedWith: document.sharedWith?.length || 0,
          shareLinks: document.shareLinks?.length || 0,
        },
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}

// 📈 POST - Track interactions and update tracking object
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params in Next.js 15
    const { id } = await params;
    
    const db = await dbPromise;
    const documentId = id;
    const body = await request.json();
    const { action, pageNumber, viewTime = 0, visitorId } = body;

    if (!ObjectId.isValid(documentId)) 
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });

    const document = await db.collection('documents').findOne({ _id: new ObjectId(documentId) });
    if (!document) 
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const tracking = document.tracking || {
      views: 0,
      uniqueVisitors: [],
      downloads: 0,
      shares: 0,
      averageViewTime: 0,
      lastViewed: null,
      viewsByPage: {}
    };

    // Update tracking object based on action
    switch (action) {
      case 'view':
        tracking.views += 1;
        if (visitorId && !tracking.uniqueVisitors.includes(visitorId)) {
          tracking.uniqueVisitors.push(visitorId);
        }
        tracking.lastViewed = new Date();
        tracking.averageViewTime = ((tracking.averageViewTime * (tracking.views - 1)) + viewTime) / tracking.views;
        break;

      case 'download':
        tracking.downloads += 1;
        break;

      case 'share':
        tracking.shares += 1;
        break;

      case 'page_view':
        if (pageNumber !== undefined) {
          tracking.viewsByPage[pageNumber] = (tracking.viewsByPage[pageNumber] || 0) + 1;
        }
        tracking.lastViewed = new Date();
        tracking.averageViewTime = ((tracking.averageViewTime * (tracking.views - 1)) + viewTime) / tracking.views;
        break;
    }

    // Save updated tracking object
    await db.collection('documents').updateOne(
      { _id: new ObjectId(documentId) },
      { $set: { tracking } }
    );

    // Log detailed analytics (optional for deep analytics)
    if (['view', 'page_view'].includes(action)) {
      await db.collection('analytics_logs').insertOne({
        documentId,
        action,
        pageNumber,
        viewTime,
        visitorId,
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
    }

    return NextResponse.json({ success: true, message: 'Interaction tracked successfully' });

  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json({ error: 'Failed to track interaction' }, { status: 500 });
  }
}

// Helpers
function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}