// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { 
  convertToPdf, 
  extractTextFromPdf, 
  analyzeDocument,
  extractMetadata 
} from '@/lib/document-processor';

export const maxDuration = 60;

const SUPPORTED_FORMATS = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/markdown': 'md',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export async function POST(request: NextRequest) {
  try {
    // ✅ Use cookie-based auth
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ✅ Validate file type
    const fileType = SUPPORTED_FORMATS[file.type as keyof typeof SUPPORTED_FORMATS];
    if (!fileType) {
      return NextResponse.json({ 
        error: 'Unsupported file type',
        supported: Object.values(SUPPORTED_FORMATS)
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('📄 Processing file:', file.name, 'Type:', fileType, 'Size:', buffer.length);

    // ✅ Check file size based on plan
    const maxSize = user.plan === 'premium' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB for ${user.plan} plan` 
      }, { status: 400 });
    }

    // 🔄 Convert to PDF if needed
    let pdfBuffer: Buffer;
    let originalBuffer = buffer;
    
    if (fileType !== 'pdf') {
      console.log('🔄 Converting to PDF...');
      pdfBuffer = await convertToPdf(buffer, fileType, file.name);
    } else {
      pdfBuffer = buffer;
    }

    // 📝 Extract text content
    console.log('📝 Extracting text...');
    const extractedText = await extractTextFromPdf(pdfBuffer);

    // 📊 Analyze document content (Grammar, Readability, etc.)
    console.log('📊 Analyzing content...');
    const analysis = await analyzeDocument(extractedText, user.plan);

    // 📄 Extract metadata
    const metadata = await extractMetadata(pdfBuffer, fileType);

    const db = await dbPromise;
    
    // 💾 Store document with analytics
    const doc = {
      userId: user.id,
      plan: user.plan,
      
      // File info
      originalFilename: file.name,
      originalFormat: fileType,
      mimeType: file.type,
      size: buffer.length,
      pdfSize: pdfBuffer.length,
      
      // Content
      pdfData: pdfBuffer.toString('base64'),
      originalData: fileType !== 'pdf' ? originalBuffer.toString('base64') : null,
      extractedText: extractedText.substring(0, 10000), // First 10k chars for search
      
      // Metadata
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      charCount: metadata.charCount,
      
      // 📊 Content Analytics
      analytics: {
        readabilityScore: analysis.readability,
        sentimentScore: analysis.sentiment,
        grammarIssues: analysis.grammar,
        spellingErrors: analysis.spelling,
        clarityScore: analysis.clarity,
        formalityLevel: analysis.formality,
        keywords: analysis.keywords,
        entities: analysis.entities,
        language: analysis.language,
        
        // Error counts
        errorCounts: {
          grammar: analysis.grammar.length,
          spelling: analysis.spelling.length,
          clarity: analysis.clarity.length,
        },
        
        // Document health score (0-100)
        healthScore: analysis.healthScore,
      },
      
      // 📈 Tracking (DocSend-style)
      tracking: {
        views: 0,
        uniqueVisitors: [],
        downloads: 0,
        shares: 0,
        averageViewTime: 0,
        viewsByPage: Array(metadata.pageCount).fill(0),
        lastViewed: null,
      },
      
      // 🔒 Privacy & Sharing
      isPublic: false,
      sharedWith: [],
      shareLinks: [],
      
      // 🏷️ Organization (Notion-style)
      tags: [],
      folder: null,
      starred: false,
      archived: false,
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: new Date(),
    };

    const result = await db.collection('documents').insertOne(doc);
    
    console.log('✅ Document saved with analytics:', result.insertedId);

    // 📊 Return comprehensive response
    return NextResponse.json({
      success: true,
      documentId: result.insertedId.toString(),
      
      // File info
      filename: file.name,
      format: fileType,
      convertedToPdf: fileType !== 'pdf',
      
      // Stats
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      size: buffer.length,
      
      // Analytics summary
      analytics: {
        healthScore: analysis.healthScore,
        readabilityScore: analysis.readability,
        errorCounts: {
          grammar: analysis.grammar.length,
          spelling: analysis.spelling.length,
          clarity: analysis.clarity.length,
        },
        topKeywords: analysis.keywords.slice(0, 5),
      },
      
      // Quick issues preview
      hasIssues: analysis.grammar.length > 0 || analysis.spelling.length > 0,
      issuesSummary: `Found ${analysis.grammar.length} grammar issues, ${analysis.spelling.length} spelling errors`,
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Document upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to process document. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}