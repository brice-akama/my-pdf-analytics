// app/api/upload/route.ts
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
 
import {
  convertToPdf,
  extractTextFromPdf,
  extractMetadata,
} from '@/lib/document-processor';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import { preExtractAllPages } from '@/lib/preExtractPages';

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

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// ✅ FIX: encodeURIComponent prevents 500 errors from spaces & special chars in filenames
async function uploadToCloudinary(buffer: Buffer, filename: string, folder: string) {
  return new Promise<string>((resolve, reject) => {
    const safePublicId = encodeURIComponent(filename.replace(/\.[^/.]+$/, ''));
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        public_id: safePublicId,
        resource_type: 'auto',
        type: 'upload',
        access_mode: 'public',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || '');
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// ✅ Runs AFTER response is sent — user never waits for this
async function runBackgroundAnalysis(docId: string, text: string, plan: string, db: any) {
  try {
    const { analyzeDocument } = await import('@/lib/document-processor');
    const { ObjectId } = await import('mongodb');
    const analysis = await analyzeDocument(text, plan);
    await db.collection('documents').updateOne(
      { _id: new ObjectId(docId) },
      {
        $set: {
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
            errorCounts: {
              grammar: analysis.grammar.length,
              spelling: analysis.spelling.length,
              clarity: analysis.clarity.length,
            },
            healthScore: analysis.healthScore,
            analyzed: true,
          },
          lastAnalyzedAt: new Date(),
        },
      }
    );
    console.log('✅ Background analysis complete for:', docId);
  } catch (err) {
    console.error('❌ Background analysis failed:', err);
  }
}

function generateSummary(text: string) {
  const sentences = text.split(/[.!?]/).filter(Boolean);
  if (sentences.length <= 3) return text;
  return sentences.slice(0, 3).join('. ') + '.';
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;
    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || null;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const fileType = SUPPORTED_FORMATS[file.type as keyof typeof SUPPORTED_FORMATS];
    if (!fileType) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const maxSize = user.plan === 'premium' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // ✅ STEP 1: Convert to PDF + Extract Metadata (PARALLEL)
    const [pdfBuffer, metadata] = await Promise.all([
      fileType !== 'pdf' ? convertToPdf(buffer, fileType, file.name) : Promise.resolve(buffer),
      extractMetadata(buffer, fileType),
    ]);

    // ✅ STEP 2: Extract Text
    const extractedText = await extractTextFromPdf(pdfBuffer);
    const scannedPdf = !extractedText || extractedText.trim().length < 30;
    const summary = generateSummary(extractedText);

    // ✅ STEP 3: Cloudinary Upload only — analysis runs in background
    const folder = `users/${user.id}/documents`;
    const [originalUrl, pdfUrl] = await Promise.all([
      uploadToCloudinary(buffer, file.name, folder),
      uploadToCloudinary(pdfBuffer, file.name.replace(/\.[^/.]+$/, '.pdf'), folder),
    ]);

    // Placeholder analytics — filled in by background job
    const pendingAnalytics = {
      readabilityScore: null,
      sentimentScore: null,
      grammarIssues: [],
      spellingErrors: [],
      clarityScore: [],
      formalityLevel: null,
      keywords: [],
      entities: [],
      language: null,
      errorCounts: { grammar: 0, spelling: 0, clarity: 0 },
      healthScore: null,
      analyzed: false,
    };

    // ✅ STEP 4: Check for existing document with same filename
    const existingDoc = await db.collection('documents').findOne({
      originalFilename: file.name,
      userId: user.id,
      organizationId,
      archived: { $ne: true },
    });

    if (existingDoc) {
      console.log('📦 Existing document found - creating new version');

      // Save current version to history
      await db.collection('documentVersions').insertOne({
        documentId: existingDoc._id,
        version: existingDoc.version || 1,
        filename: existingDoc.originalFilename,
        originalFormat: existingDoc.originalFormat,
        mimeType: existingDoc.mimeType,
        size: existingDoc.size,
        pdfSize: existingDoc.pdfSize,
        numPages: existingDoc.numPages,
        wordCount: existingDoc.wordCount,
        charCount: existingDoc.charCount,
        cloudinaryPdfUrl: existingDoc.cloudinaryPdfUrl,
        cloudinaryOriginalUrl: existingDoc.cloudinaryOriginalUrl,
        extractedText: existingDoc.extractedText,
        analytics: existingDoc.analytics,
        tracking: existingDoc.tracking,
        uploadedBy: existingDoc.userId,
        createdAt: existingDoc.updatedAt || existingDoc.createdAt,
        changeLog: `Version ${existingDoc.version || 1} - Replaced by new upload`,
      });

      await db.collection('documents').updateOne(
        { _id: existingDoc._id },
        {
          $set: {
            version: (existingDoc.version || 1) + 1,
            originalFormat: fileType,
            mimeType: file.type,
            size: buffer.length,
            pdfSize: pdfBuffer.length,
            cloudinaryOriginalUrl: originalUrl,
            cloudinaryPdfUrl: pdfUrl,
            extractedText: extractedText.substring(0, 10000),
            numPages: metadata.pageCount,
            wordCount: metadata.wordCount,
            charCount: metadata.charCount,
            summary,
            scannedPdf,
            analytics: pendingAnalytics,
            updatedAt: new Date(),
            lastAnalyzedAt: null,
          },
        }
      );

      await db.collection('analytics_logs').insertOne({
        documentId: existingDoc._id.toString(),
        action: 'version_created',
        userId: user.id,
        newVersion: (existingDoc.version || 1) + 1,
        previousVersion: existingDoc.version || 1,
        timestamp: new Date(),
      });

      // ✅ Fire background analysis — does NOT block response
      runBackgroundAnalysis(existingDoc._id.toString(), extractedText, user.plan, db).catch(console.error);
      // ✅ Pre-extract all pages for new version
      preExtractAllPages(pdfUrl, existingDoc._id.toString()).catch(err =>
        console.error('Pre-extraction error:', err)
      );
      return NextResponse.json({
        success: true,
        message: 'New version created',
        documentId: existingDoc._id.toString(),
        version: (existingDoc.version || 1) + 1,
        previousVersion: existingDoc.version || 1,
        filename: file.name,
        format: fileType,
        numPages: metadata.pageCount,
        wordCount: metadata.wordCount,
        size: buffer.length,
        cloudinaryOriginalUrl: originalUrl,
        cloudinaryPdfUrl: pdfUrl,
        analytics: {
          healthScore: null,
          readabilityScore: null,
          errorCounts: { grammar: 0, spelling: 0, clarity: 0 },
          topKeywords: [],
        },
        hasIssues: false,
        issuesSummary: 'Analysis pending...',
      }, { status: 200 });
    }

    // ✅ New document
    const doc = {
      userId: user.id,
      plan: user.plan,
      organizationId,
      version: 1,
      originalFilename: file.name,
      originalFormat: fileType,
      visibility: 'personal',
      mimeType: file.type,
      size: buffer.length,
      pdfSize: pdfBuffer.length,
      cloudinaryOriginalUrl: originalUrl,
      cloudinaryPdfUrl: pdfUrl,
      extractedText: extractedText.substring(0, 10000),
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      charCount: metadata.charCount,
      summary,
      scannedPdf,
      analytics: pendingAnalytics,
      tracking: {
        views: 0,
        uniqueVisitors: [],
        downloads: 0,
        shares: 0,
        averageViewTime: 0,
        viewsByPage: Array(metadata.pageCount).fill(0),
        lastViewed: null,
      },
      isPublic: false,
      sharedWith: [],
      shareLinks: [],
      tags: [],
      folder: null,
      starred: false,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: null,
    };

    const result = await db.collection('documents').insertOne(doc);

    // ✅ Fire background analysis — does NOT block response
    runBackgroundAnalysis(result.insertedId.toString(), extractedText, user.plan, db).catch(console.error);
  
    // ✅ Pre-extract all pages so first viewer never waits
    preExtractAllPages(pdfUrl, result.insertedId.toString()).catch(err =>
      console.error('Pre-extraction error:', err)
    );
    return NextResponse.json({
      success: true,
      documentId: result.insertedId.toString(),
      filename: file.name,
      format: fileType,
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      size: buffer.length,
      cloudinaryOriginalUrl: originalUrl,
      cloudinaryPdfUrl: pdfUrl,
      analytics: {
        healthScore: null,
        readabilityScore: null,
        errorCounts: { grammar: 0, spelling: 0, clarity: 0 },
        topKeywords: [],
      },
      hasIssues: false,
      issuesSummary: 'Analysis pending...',
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Document upload error:', error);
    return NextResponse.json({
      error: 'Failed to process document. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
