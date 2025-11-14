import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { analyzeDocument } from '@/lib/document-processor';

export async function POST(
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

    const { fixedText } = await request.json();

    if (!fixedText || typeof fixedText !== 'string') {
      return NextResponse.json({ error: 'Invalid text content' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Re-analyze the fixed content
    const newAnalysis = await analyzeDocument(fixedText, user.plan);

    // Update word and character counts
    const wordCount = fixedText.trim().split(/\s+/).filter(Boolean).length;
    const charCount = fixedText.length;

    // Update document with fixed text and new analytics - match database structure
    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $set: {
          extractedText: fixedText.substring(0, 10000),
          wordCount,
          charCount,
          analytics: {
            readabilityScore: newAnalysis.readability,
            sentimentScore: newAnalysis.sentiment,
            grammarIssues: newAnalysis.grammar,
            spellingErrors: newAnalysis.spelling,
            clarityScore: newAnalysis.clarity, // Match DB field name
            formalityLevel: newAnalysis.formality,
            keywords: newAnalysis.keywords,
            entities: newAnalysis.entities,
            language: newAnalysis.language,
            errorCounts: {
              grammar: newAnalysis.grammar.length,
              spelling: newAnalysis.spelling.length,
              clarity: newAnalysis.clarity.length,
            },
            healthScore: newAnalysis.healthScore,
          },
          updatedAt: new Date(),
          lastAnalyzedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Document content updated successfully',
      analytics: {
        healthScore: newAnalysis.healthScore,
        readabilityScore: newAnalysis.readability,
        sentimentScore: newAnalysis.sentiment,
        errorCounts: {
          grammar: newAnalysis.grammar.length,
          spelling: newAnalysis.spelling.length,
          clarity: newAnalysis.clarity.length,
        },
      },
      documentInfo: {
        wordCount,
        charCount,
      }
    });
  } catch (error) {
    console.error('❌ Content fix error:', error);
    return NextResponse.json({
      error: 'Failed to save fixed content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}