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

    // Await params in Next.js 15+
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get the analytics data - match database structure exactly
    const analytics = document.analytics || {};
    
    return NextResponse.json({
      success: true,
      analytics: {
        // Core scores
        healthScore: analytics.healthScore || 0,
        readabilityScore: analytics.readabilityScore || 0,
        sentimentScore: analytics.sentimentScore || 0,
        
        // Issues arrays
        grammarIssues: analytics.grammarIssues || [],
        spellingErrors: analytics.spellingErrors || [],
        clarityScore: analytics.clarityScore || [], // Keep original field name from DB
        
        // Additional fields
        formalityLevel: analytics.formalityLevel || 'neutral',
        keywords: analytics.keywords || [],
        entities: analytics.entities || [],
        language: analytics.language || 'en',
        
        // Error counts
        errorCounts: analytics.errorCounts || {
          grammar: (analytics.grammarIssues || []).length,
          spelling: (analytics.spellingErrors || []).length,
          clarity: (analytics.clarityScore || []).length,
        },
      },
      extractedText: document.extractedText || '',
      scannedPdf: document.scannedPdf || false,
      
      // Additional document info
      documentInfo: {
        filename: document.originalFilename,
        numPages: document.numPages,
        wordCount: document.wordCount,
        charCount: document.charCount,
        format: document.originalFormat,
      }
    });
  } catch (error) {
    console.error('❌ Content analytics fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}