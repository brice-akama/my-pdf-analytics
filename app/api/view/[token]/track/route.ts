// app/api/view/[token]/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

// ✅ REAL IP Geolocation Function (using ipapi.co - FREE, no API key needed)
async function getLocationFromIP(ip: string) {
  // Skip localhost and invalid IPs
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
    console.log('⚠️ Skipping localhost/private IP:', ip);
    return null;
  }

  try {
    console.log('🌍 Fetching location for IP:', ip);
    
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'DocMetrics-Analytics/1.0'
      },
      // Add timeout
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      console.error('❌ Geolocation API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    // Check for API errors (rate limit, invalid IP, etc.)
    if (data.error) {
      console.error('❌ Geolocation error:', data.reason);
      return null;
    }
    
    console.log('✅ Location found:', data.city, data.country_name);
    
    return {
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      region: data.region,
      lat: data.latitude,
      lng: data.longitude,
      timezone: data.timezone,
      postal: data.postal,
      org: data.org, // ISP/Organization
    };
  } catch (error) {
    console.error('❌ Failed to get location:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    
    const {
      event,
      page,
      scrollDepth,
      timeSpent,
      totalPages,
      metadata,
      sessionId,
    } = body;

    if (!event) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }

    const db = await dbPromise;

    const share = await db.collection('shares').findOne({
      shareToken: token,
      active: true,
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // ✅ Get REAL IP address (handles proxies and load balancers)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
    
    // Get the first IP from x-forwarded-for (client's real IP)
    let ip = 'unknown';
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim();
    } else if (realIP) {
      ip = realIP;
    } else if (cfConnectingIP) {
      ip = cfConnectingIP;
    }

    const userAgent = request.headers.get('user-agent') || 'unknown';
    const viewerId = Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);

    const now = new Date();
    const currentSessionId = sessionId || `${viewerId}-${Date.now()}`;

    // ✅ Get REAL location data from IP
    let location = null;
    if (ip !== 'unknown') {
      location = await getLocationFromIP(ip);
    }

    // Validate data types based on event
    switch (event) {
      case 'page_view':
        if (page && !isNaN(page)) {
          await trackPageView(db, share, parseInt(page), viewerId, now, location);
        }
        break;
      
      case 'scroll':
        if (page && !isNaN(page) && scrollDepth && !isNaN(scrollDepth)) {
          await trackScroll(db, share, parseInt(page), parseFloat(scrollDepth), viewerId, now);
        }
        break;
      
      case 'time_spent':
        const validTimeSpent = timeSpent && !isNaN(timeSpent) ? parseInt(timeSpent) : 0;
        if (validTimeSpent > 0) {
          await trackTimeSpent(db, share, validTimeSpent, viewerId, now);
        }
        break;
      
      case 'download_attempt':
        await trackDownloadAttempt(db, share, viewerId, now, metadata?.allowed || false, location);
        break;
      
      case 'print_attempt':
        await trackPrintAttempt(db, share, viewerId, now, metadata?.allowed || false);
        break;

      case 'session_start':
        await trackSessionStart(db, share, viewerId, currentSessionId, now, location);
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

// ✅ Updated: Track page view with location
async function trackPageView(
  db: any, 
  share: any, 
  page: number, 
  viewerId: string, 
  timestamp: Date,
  location: any
) {
  await db.collection('shares').updateOne(
    { _id: share._id },
    {
      $setOnInsert: {
        'tracking.pageViews': {},
        'tracking.totalPageViews': 0,
        'tracking.pageViewsByViewer': {},
      }
    },
    { upsert: false }
  );

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

  // ✅ Log event with REAL location data
  await db.collection('analytics_events').insertOne({
    shareId: share._id.toString(),
    documentId: share.documentId.toString(),
    viewerId,
    event: 'page_view',
    page,
    timestamp,
    userAgent: share.tracking?.userAgent,
    location, // ✅ Real geographic data
  }).catch(err => console.error('Failed to log page view:', err));
}

// ✅ Other tracking functions remain the same
async function trackScroll(db: any, share: any, page: number, scrollDepth: number, viewerId: string, timestamp: Date) {
  await db.collection('shares').updateOne(
    { _id: share._id },
    {
      $setOnInsert: {
        'tracking.scrollDepth': {},
        'tracking.scrollDepthByViewer': {},
      }
    },
    { upsert: false }
  );

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

async function trackTimeSpent(db: any, share: any, timeSpent: number, viewerId: string, timestamp: Date) {
  await db.collection('shares').updateOne(
    { _id: share._id },
    {
      $setOnInsert: {
        'tracking.totalTimeSpent': 0,
        'tracking.timeSpentByViewer': {},
      }
    },
    { upsert: false }
  );

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

async function trackDownloadAttempt(
  db: any, 
  share: any, 
  viewerId: string, 
  timestamp: Date, 
  allowed: boolean,
  location: any
) {
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
    location, // ✅ Location for downloads too
  });
}

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

async function trackSessionStart(
  db: any, 
  share: any, 
  viewerId: string, 
  sessionId: string, 
  timestamp: Date,
  location: any
) {
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
    location, // ✅ Session location
  });
}

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