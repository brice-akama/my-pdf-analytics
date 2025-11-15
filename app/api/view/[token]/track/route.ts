// app/api/view/[token]/track/route.ts
// Real-time tracking endpoint for detailed analytics

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    
    const {
      event, // 'page_view', 'scroll', 'time_spent', 'download_attempt', 'print_attempt'
      page,
      scrollDepth,
      timeSpent, // in seconds
      totalPages,
      metadata,
      sessionId,
    } = body;

    // ✅ Validate required fields
    if (!event) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }

    const db = await dbPromise;

    // Find share record
    const share = await db.collection('shares').findOne({
      shareToken: token,
      active: true,
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Generate viewer ID
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const viewerId = Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);

    const now = new Date();
    const currentSessionId = sessionId || `${viewerId}-${Date.now()}`;

    // ✅ Validate data types based on event
    switch (event) {
      case 'page_view':
        if (page && !isNaN(page)) {
          await trackPageView(db, share, parseInt(page), viewerId, now);
        }
        break;
      
      case 'scroll':
        if (page && !isNaN(page) && scrollDepth && !isNaN(scrollDepth)) {
          await trackScroll(db, share, parseInt(page), parseFloat(scrollDepth), viewerId, now);
        }
        break;
      
      case 'time_spent':
        // ✅ Ensure timeSpent is a valid number
        const validTimeSpent = timeSpent && !isNaN(timeSpent) ? parseInt(timeSpent) : 0;
        if (validTimeSpent > 0) {
          await trackTimeSpent(db, share, validTimeSpent, viewerId, now);
        }
        break;
      
      case 'download_attempt':
        await trackDownloadAttempt(db, share, viewerId, now, metadata?.allowed || false);
        break;
      
      case 'print_attempt':
        await trackPrintAttempt(db, share, viewerId, now, metadata?.allowed || false);
        break;

      case 'session_start':
        await trackSessionStart(db, share, viewerId, currentSessionId, now);
        break;

      case 'session_end':
        const validEndTime = timeSpent && !isNaN(timeSpent) ? parseInt(timeSpent) : 0;
        await trackSessionEnd(db, share, viewerId, currentSessionId, validEndTime, now);
        break;
        
      default:
        console.log('⚠️ Unknown event type:', event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Tracking error:', error);
    return NextResponse.json({ 
      error: 'Tracking failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Track individual page views
async function trackPageView(db: any, share: any, page: number, viewerId: string, timestamp: Date) {
  await db.collection('shares').updateOne(
    { _id: share._id },
    {
      $inc: {
        [`tracking.pageViews.page_${page}`]: 1,
        'tracking.totalPageViews': 1,
      },
      $set: {
        [`tracking.pageViewsByViewer.${viewerId}.page_${page}`]: timestamp,
        updatedAt: timestamp,
      },
    }
  );

  // Log detailed event
  await db.collection('analytics_events').insertOne({
    shareId: share._id.toString(),
    documentId: share.documentId.toString(),
    viewerId,
    event: 'page_view',
    page,
    timestamp,
    userAgent: share.tracking?.userAgent,
    ip: share.tracking?.ip,
  });
}

// Track scroll depth per page
async function trackScroll(db: any, share: any, page: number, scrollDepth: number, viewerId: string, timestamp: Date) {
  await db.collection('shares').updateOne(
    { _id: share._id },
    {
      $max: {
        [`tracking.scrollDepth.page_${page}`]: scrollDepth,
        [`tracking.scrollDepthByViewer.${viewerId}.page_${page}`]: scrollDepth,
      },
      $set: { updatedAt: timestamp },
    }
  );
}

// Track time spent viewing
async function trackTimeSpent(db: any, share: any, timeSpent: number, viewerId: string, timestamp: Date) {
  await db.collection('shares').updateOne(
    { _id: share._id },
    {
      $inc: {
        'tracking.totalTimeSpent': timeSpent,
        [`tracking.timeSpentByViewer.${viewerId}`]: timeSpent,
      },
      $set: { updatedAt: timestamp },
    }
  );
}

// Track download attempts
async function trackDownloadAttempt(db: any, share: any, viewerId: string, timestamp: Date, allowed: boolean) {
  await db.collection('shares').updateOne(
    { _id: share._id },
    {
      $inc: {
        'tracking.downloadAttempts': 1,
        ...(allowed ? { 'tracking.downloads': 1 } : { 'tracking.blockedDownloads': 1 }),
      },
      $push: {
        'tracking.downloadEvents': {
          viewerId,
          timestamp,
          allowed,
        },
      },
      $set: { updatedAt: timestamp },
    }
  );

  await db.collection('analytics_events').insertOne({
    shareId: share._id.toString(),
    documentId: share.documentId.toString(),
    viewerId,
    event: 'download_attempt',
    allowed,
    timestamp,
  });
}

// Track print attempts
async function trackPrintAttempt(db: any, share: any, viewerId: string, timestamp: Date, allowed: boolean) {
  await db.collection('shares').updateOne(
    { _id: share._id },
    {
      $inc: {
        'tracking.printAttempts': 1,
        ...(allowed ? { 'tracking.prints': 1 } : { 'tracking.blockedPrints': 1 }),
      },
      $push: {
        'tracking.printEvents': {
          viewerId,
          timestamp,
          allowed,
        },
      },
      $set: { updatedAt: timestamp },
    }
  );

  await db.collection('analytics_events').insertOne({
    shareId: share._id.toString(),
    documentId: share.documentId.toString(),
    viewerId,
    event: 'print_attempt',
    allowed,
    timestamp,
  });
}

// Track session start
async function trackSessionStart(db: any, share: any, viewerId: string, sessionId: string, timestamp: Date) {
  await db.collection('analytics_sessions').insertOne({
    sessionId,
    shareId: share._id.toString(),
    documentId: share.documentId.toString(),
    viewerId,
    startedAt: timestamp,
    endedAt: null,
    duration: 0,
    pagesViewed: [],
    actions: [],
  });
}

// Track session end
async function trackSessionEnd(db: any, share: any, viewerId: string, sessionId: string, duration: number, timestamp: Date) {
  await db.collection('analytics_sessions').updateOne(
    { sessionId },
    {
      $set: {
        endedAt: timestamp,
        duration,
      },
    }
  );
}