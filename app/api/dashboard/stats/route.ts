// app/api/dashboard/stats/route.ts
// app/api/dashboard/stats/route.ts
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
    const range = searchParams.get('range') || '30d';

    const db = await dbPromise;

    // Calculate date range
    const now = new Date();
    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all user's documents
    const documents = await db.collection('documents')
      .find({ userId: user.id })
      .toArray();

    const documentIds = documents.map(doc => doc._id);

    // Get all shares for user's documents
    const shares = await db.collection('shares')
      .find({ 
        userId: user.id,
        documentId: { $in: documentIds }
      })
      .toArray();

    // Get analytics events for advanced metrics
    const analyticsEvents = await db.collection('analytics_events')
      .find({
        documentId: { $in: documentIds.map(id => id.toString()) },
        timestamp: { $gte: startDate }
      })
      .toArray();

    // ✅ Get REAL analytics logs with emails
    const analyticsLogs = await db.collection('analytics_logs')
      .find({
        documentId: { $in: documentIds.map(id => id.toString()) },
        timestamp: { $gte: startDate }
      })
      .toArray();

    // Calculate basic stats
    const totalViews = shares.reduce((sum, share) => 
      sum + (share.tracking?.views || 0), 0
    );

    // ✅ REAL unique viewers (including emails)
    const allViewerEmails = new Set(
      shares.flatMap(share => share.tracking?.viewerEmails || [])
    );
    const allViewerIds = new Set(
      shares.flatMap(share => share.tracking?.uniqueViewers || [])
    );
    const uniqueViewers = allViewerEmails.size + allViewerIds.size;

    const totalDownloads = shares.reduce((sum, share) => 
      sum + (share.tracking?.downloads || 0), 0
    );

    const totalTimeSpent = shares.reduce((sum, share) => 
      sum + (share.tracking?.totalTimeSpent || 0), 0
    );

    const averageTimeSpent = totalViews > 0 
      ? Math.round(totalTimeSpent / totalViews) 
      : 0;

    const activeShares = shares.filter(share => 
      share.active && 
      (!share.expiresAt || new Date(share.expiresAt) > new Date())
    ).length;

    // Calculate engagement score
    let engagementScore = 0;
    if (totalViews > 0) {
      const viewerEngagement = (uniqueViewers / totalViews) * 100;
      const timeEngagement = Math.min((averageTimeSpent / 60) * 10, 50);
      const downloadEngagement = totalDownloads > 0 ? (totalDownloads / totalViews) * 100 : 0;
      engagementScore = Math.round((viewerEngagement + timeEngagement + downloadEngagement) / 3);
    }

    // Calculate trends
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysAgo);

    const previousLogs = analyticsLogs.filter(log => 
      log.timestamp >= previousPeriodStart && log.timestamp < startDate
    );
    const currentLogs = analyticsLogs.filter(log => log.timestamp >= startDate);

    const previousViews = previousLogs.filter(l => l.action === 'document_viewed').length;
    const currentViews = currentLogs.filter(l => l.action === 'document_viewed').length;
    const previousDownloads = shares.reduce((sum, s) => {
      const events = s.tracking?.downloadEvents?.filter((e: any) => 
        e.timestamp >= previousPeriodStart && e.timestamp < startDate
      ) || [];
      return sum + events.length;
    }, 0);
    const currentDownloads = shares.reduce((sum, s) => {
      const events = s.tracking?.downloadEvents?.filter((e: any) => 
        e.timestamp >= startDate
      ) || [];
      return sum + events.length;
    }, 0);

    const viewsChange = previousViews > 0 
      ? Math.round(((currentViews - previousViews) / previousViews) * 100)
      : currentViews > 0 ? 100 : 0;

    const downloadsChange = previousDownloads > 0
      ? Math.round(((currentDownloads - previousDownloads) / previousDownloads) * 100)
      : currentDownloads > 0 ? 100 : 0;

    const engagementChange = Math.round((viewsChange + downloadsChange) / 2);

    // ✅ REAL Views Over Time (from actual logs)
    const viewsOverTime = generateRealTimeSeriesData(analyticsLogs, shares, daysAgo);

    // ✅ REAL Geographic Data (from analytics events)
    const geographicData = generateRealGeographicData(analyticsEvents);

    // ✅ REAL Device & Browser Breakdown
    const deviceBreakdown = generateRealDeviceBreakdown(analyticsEvents);
    const browserBreakdown = generateRealBrowserBreakdown(analyticsEvents);

    // ✅ REAL Top Documents WITH REAL VIEWERS AND EMAILS
    const topDocuments = await Promise.all(
      documents.map(async (doc) => {
        const docShares = shares.filter(s => s.documentId.toString() === doc._id.toString());
        const views = docShares.reduce((sum, s) => sum + (s.tracking?.views || 0), 0);
        const downloads = docShares.reduce((sum, s) => sum + (s.tracking?.downloads || 0), 0);
        const engagement = views > 0 ? Math.round((downloads / views) * 100) : 0;
        
        // ✅ Get REAL viewers with emails from shares
        const viewersMap = new Map<string, any>();
        
        for (const share of docShares) {
          const viewerEmails = share.tracking?.viewerEmails || [];
          
          for (const email of viewerEmails) {
            if (!email) continue;
            
            // Get viewer details from analytics logs
            const viewerLogs = analyticsLogs.filter(log => 
              log.email === email && 
              log.documentId === doc._id.toString()
            );
            
            const viewCount = viewerLogs.filter(l => l.action === 'document_viewed').length;
            const lastView = viewerLogs.length > 0 
              ? viewerLogs.sort((a, b) => b.timestamp - a.timestamp)[0].timestamp 
              : new Date();
            const firstView = viewerLogs.length > 0
              ? viewerLogs.sort((a, b) => a.timestamp - b.timestamp)[0].timestamp
              : new Date();
            
            // Get time spent from share tracking
            let timeSpent = 0;
            for (const viewerId of (share.tracking?.uniqueViewers || [])) {
              timeSpent += share.tracking?.timeSpentByViewer?.[viewerId] || 0;
            }
            
            // Get location from analytics events
            const locationEvent = analyticsEvents.find(e => 
              e.email === email && e.location
            );
            
            // Calculate engagement level
            let engagementScore = 0;
            engagementScore += Math.min(viewCount * 10, 40);
            engagementScore += Math.min((timeSpent / 60) * 2, 40);
            const hoursSinceLastView = (Date.now() - new Date(lastView).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastView < 24) engagementScore += 20;
            else if (hoursSinceLastView < 72) engagementScore += 10;
            
            const engagementLevel = engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low';
            
            if (!viewersMap.has(email)) {
              viewersMap.set(email, {
                email,
                name: email.split('@')[0], // Extract name from email
                company: email.split('@')[1] || null, // Extract domain as company
                firstAccessAt: firstView,
                lastAccessAt: lastView,
                totalViews: viewCount,
                totalTimeSpent: timeSpent,
                location: locationEvent?.location ? {
                  city: locationEvent.location.city,
                  country: locationEvent.location.country,
                } : null,
                engagement: engagementLevel,
              });
            } else {
              const existing = viewersMap.get(email);
              existing.totalViews += viewCount;
              existing.totalTimeSpent += timeSpent;
              existing.lastAccessAt = new Date(Math.max(
                new Date(existing.lastAccessAt).getTime(),
                new Date(lastView).getTime()
              ));
            }
          }
        }
        
        return {
          id: doc._id.toString(),
          name: doc.originalFilename,
          views,
          downloads,
          engagement,
          viewers: Array.from(viewersMap.values()),
        };
      })
    );

    // Sort by views
    topDocuments.sort((a, b) => b.views - a.views);

    // ✅ REAL Hourly Activity Pattern
    const hourlyActivity = generateRealHourlyActivity(analyticsLogs);

    // ✅ REAL Conversion Funnel
    const linkOpened = totalViews;
    const viewed = analyticsLogs.filter(l => l.action === 'document_viewed').length;
    const downloads = totalDownloads;
    
    const conversionFunnel = [
      { stage: 'Link Opened', count: linkOpened, percentage: 100 },
      { stage: 'Document Viewed', count: viewed, percentage: linkOpened > 0 ? Math.round((viewed / linkOpened) * 100) : 0 },
      { stage: 'Downloaded', count: downloads, percentage: linkOpened > 0 ? Math.round((downloads / linkOpened) * 100) : 0 },
    ];

    // ✅ REAL Viewer Engagement Segments
    const viewerEngagement = calculateRealViewerEngagement(shares, averageTimeSpent);

    // ✅ REAL Recent Activity WITH EMAILS
    const recentActivity = analyticsLogs
      .filter(log => log.action === 'document_viewed' || log.action === 'download')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
      .map(log => {
        const document = documents.find(doc => 
          doc._id.toString() === log.documentId
        );

        return {
          id: log._id.toString(),
          type: log.action === 'document_viewed' ? 'view' as const : 'download' as const,
          documentName: document?.originalFilename || 'Unknown Document',
          timestamp: log.timestamp.toISOString(),
          viewer: log.email || 'Anonymous', // ✅ REAL EMAIL
        };
      });

    return NextResponse.json({
      success: true,
      stats: {
        totalDocuments: documents.length,
        totalViews,
        uniqueViewers,
        totalDownloads,
        averageEngagement: Math.min(engagementScore, 100),
        averageTimeSpent,
        activeShares,
        recentActivity,
        trending: {
          viewsChange,
          downloadsChange,
          engagementChange,
        },
        // Advanced analytics
        viewsOverTime,
        geographicData,
        deviceBreakdown,
        browserBreakdown,
        topDocuments, // ✅ NOW WITH REAL VIEWERS AND EMAILS
        hourlyActivity,
        conversionFunnel,
        viewerEngagement,
      }
    });

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ REAL time series data from actual logs
function generateRealTimeSeriesData(logs: any[], shares: any[], days: number) {
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const dayViews = logs.filter(log => 
      log.action === 'document_viewed' &&
      log.timestamp >= startOfDay &&
      log.timestamp <= endOfDay
    ).length;

    const dayDownloads = shares.reduce((sum, share) => {
      const events = share.tracking?.downloadEvents?.filter((e: any) =>
        new Date(e.timestamp) >= startOfDay &&
        new Date(e.timestamp) <= endOfDay
      ) || [];
      return sum + events.length;
    }, 0);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: dayViews,
      downloads: dayDownloads,
    });
  }

  return data;
}

// ✅ REAL geographic data from events
function generateRealGeographicData(events: any[]) {
  const locationCounts: Record<string, { 
    country: string; 
    city: string; 
    views: number; 
    lat: number; 
    lng: number 
  }> = {};

  events.forEach(event => {
    if (event.location && event.location.country && event.location.city) {
      const key = `${event.location.country}-${event.location.city}`;
      
      if (!locationCounts[key]) {
        locationCounts[key] = {
          country: event.location.country,
          city: event.location.city,
          lat: event.location.lat || 0,
          lng: event.location.lng || 0,
          views: 0,
        };
      }
      locationCounts[key].views++;
    }
  });

  return Object.values(locationCounts)
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);
}

// ✅ REAL device breakdown
function generateRealDeviceBreakdown(events: any[]) {
  const devices: Record<string, number> = {
    Desktop: 0,
    Mobile: 0,
    Tablet: 0,
  };

  events.forEach(event => {
    const ua = (event.userAgent || '').toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      devices.Mobile++;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      devices.Tablet++;
    } else {
      devices.Desktop++;
    }
  });

  const total = events.length || 1;
  
  return Object.entries(devices).map(([device, count]) => ({
    device,
    count,
    percentage: Math.round((count / total) * 100),
  }));
}

// ✅ REAL browser breakdown
function generateRealBrowserBreakdown(events: any[]) {
  const browsers: Record<string, number> = {
    Chrome: 0,
    Safari: 0,
    Firefox: 0,
    Edge: 0,
    Other: 0,
  };

  events.forEach(event => {
    const ua = (event.userAgent || '').toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edge')) {
      browsers.Chrome++;
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browsers.Safari++;
    } else if (ua.includes('firefox')) {
      browsers.Firefox++;
    } else if (ua.includes('edge') || ua.includes('edg/')) {
      browsers.Edge++;
    } else {
      browsers.Other++;
    }
  });

  return Object.entries(browsers)
    .map(([browser, count]) => ({ browser, count }))
    .filter(b => b.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ✅ REAL hourly activity
function generateRealHourlyActivity(logs: any[]) {
  const hours = Array(24).fill(0);

  logs.forEach(log => {
    if (log.timestamp && log.action === 'document_viewed') {
      const hour = new Date(log.timestamp).getHours();
      hours[hour]++;
    }
  });

  return hours.map((views, hour) => ({
    hour: hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
    views,
  }));
}

// ✅ REAL viewer engagement calculation
function calculateRealViewerEngagement(shares: any[], avgTime: number) {
  const allViewers: Array<{ timeSpent: number }> = [];
  
  shares.forEach(share => {
    const timeByViewer = share.tracking?.timeSpentByViewer || {};
    Object.values(timeByViewer).forEach((time: any) => {
      if (typeof time === 'number') {
        allViewers.push({ timeSpent: time });
      }
    });
  });

  const highEngagement = allViewers.filter(v => v.timeSpent > avgTime * 1.5).length;
  const mediumEngagement = allViewers.filter(v => v.timeSpent >= avgTime * 0.5 && v.timeSpent <= avgTime * 1.5).length;
  const lowEngagement = allViewers.filter(v => v.timeSpent < avgTime * 0.5).length;

  return [
    { segment: 'High', count: highEngagement, avgTime: avgTime * 2 },
    { segment: 'Medium', count: mediumEngagement, avgTime: avgTime },
    { segment: 'Low', count: lowEngagement, avgTime: Math.round(avgTime * 0.5) },
  ];
}