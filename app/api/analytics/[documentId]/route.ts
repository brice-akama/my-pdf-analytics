// app/api/analytics/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// 📊 GET - Fetch analytics for a document
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const { documentId } = params;

    if (!ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const document = await db.collection('documents').findOne({
      _id: new ObjectId(documentId),
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get detailed analytics
    const analytics = {
      // Basic stats
      views: document.tracking?.views || 0,
      uniqueVisitors: document.tracking?.uniqueVisitors?.length || 0,
      downloads: document.tracking?.downloads || 0,
      shares: document.tracking?.shares || 0,
      averageViewTime: document.tracking?.averageViewTime || 0,
      lastViewed: document.tracking?.lastViewed,
      
      // Page-level analytics
      viewsByPage: document.tracking?.viewsByPage || [],
      
      // Content quality metrics
      contentHealth: {
        healthScore: document.analytics?.healthScore || 0,
        readabilityScore: document.analytics?.readabilityScore || 0,
        sentimentScore: document.analytics?.sentimentScore || 0,
        
        errors: {
          grammar: document.analytics?.errorCounts?.grammar || 0,
          spelling: document.analytics?.errorCounts?.spelling || 0,
          clarity: document.analytics?.errorCounts?.clarity || 0,
        },
        
        topKeywords: document.analytics?.keywords?.slice(0, 10) || [],
        entities: document.analytics?.entities?.slice(0, 10) || [],
        language: document.analytics?.language || 'en',
        formalityLevel: document.analytics?.formalityLevel || 'neutral',
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
    };

    return NextResponse.json({ success: true, analytics }, { status: 200 });
    
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics' 
    }, { status: 500 });
  }
}

// 📈 POST - Track view/interaction
export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const db = await dbPromise;
    const { documentId } = params;
    const body = await request.json();

    if (!ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const { 
      action, // 'view', 'download', 'share', 'page_view'
      pageNumber, 
      viewTime,
      visitorId, // Anonymous tracking ID from frontend
    } = body;

    const now = new Date();

    // Build update query based on action
    let updateQuery: any = {
      'tracking.lastViewed': now,
    };

    switch (action) {
      case 'view':
        updateQuery['tracking.views'] = 1;
        if (visitorId) {
          updateQuery['tracking.uniqueVisitors'] = visitorId;
        }
        break;
        
      case 'download':
        updateQuery['tracking.downloads'] = 1;
        break;
        
      case 'share':
        updateQuery['tracking.shares'] = 1;
        break;
        
      case 'page_view':
        if (pageNumber !== undefined) {
          updateQuery[`tracking.viewsByPage.${pageNumber}`] = 1;
        }
        break;
    }

    // Update document tracking
    const result = await db.collection('documents').updateOne(
      { _id: new ObjectId(documentId) },
      {
        $inc: updateQuery,
        ...(visitorId && action === 'view' ? {
          $addToSet: { 'tracking.uniqueVisitors': visitorId }
        } : {}),
      }
    );

    // Store detailed view log
    if (action === 'view' || action === 'page_view') {
      await db.collection('analytics_logs').insertOne({
        documentId,
        action,
        pageNumber,
        viewTime,
        visitorId,
        timestamp: now,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Analytics tracked successfully' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ 
      error: 'Failed to track analytics' 
    }, { status: 500 });
  }
}