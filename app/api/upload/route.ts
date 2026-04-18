// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import {
  convertToPdf,
  extractTextFromPdf,
  extractMetadata,
} from '@/lib/document-processor';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import { preExtractAllPages } from '@/lib/preExtractPages';
import { checkAccess } from '@/lib/checkAccess'
import {
  getPlanLimits,
  isStorageAvailable,
  isFileSizeAllowed,
} from '@/lib/planLimits'

// ✅ Increase to 300s (Vercel Pro allows up to 300s, Hobby is 60s)
// If on Hobby plan keep at 60 but the other optimizations still help
export const maxDuration = 300;

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

// ✅ OPTIMIZED: Stream directly to Cloudinary with timeout + chunk size
async function uploadToCloudinary(buffer: Buffer, filename: string, folder: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const safePublicId = encodeURIComponent(filename.replace(/\.[^/.]+$/, ''));

    // ✅ Timeout: fail fast if Cloudinary hangs
    const timeout = setTimeout(() => {
      reject(new Error('Cloudinary upload timed out after 120s'));
    }, 120_000);

    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        public_id: safePublicId,
        resource_type: 'auto',
        type: 'upload',
        access_mode: 'public',
        // ✅ Larger chunk size = fewer round trips = faster upload
        chunk_size: 6_000_000, // 6MB chunks
        timeout: 120_000,
      },
      (error, result) => {
        clearTimeout(timeout);
        if (error) return reject(error);
        resolve(result?.secure_url || '');
      }
    );

    streamifier.createReadStream(buffer, {
      // ✅ High water mark = larger reads = faster streaming
      highWaterMark: 512 * 1024, // 512KB
    }).pipe(uploadStream);
  });
}

// ✅ Background analysis — runs AFTER response sent
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
    // ── Step 1: Authenticate and get effective plan ───────────────────────────
// checkAccess reads the JWT cookie, fetches the user from MongoDB, and
// computes the EFFECTIVE plan — meaning if their trial expired, they get
// free limits even if user.plan still says "pro" in the DB.
const access = await checkAccess(request)
if (!access.ok) return access.response

const { user, plan, limits } = access
const db = await dbPromise

const profile = await db.collection('profiles').findOne({ user_id: user._id.toString() })
const organizationId = profile?.organization_id || null

// ── Step 2: Read the file from the request ────────────────────────────────
const formData = await request.formData()
const file = formData.get('file') as File
if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

const fileType = SUPPORTED_FORMATS[file.type as keyof typeof SUPPORTED_FORMATS]
if (!fileType) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })

const bytes = await file.arrayBuffer()
const buffer = Buffer.from(bytes)

// ── Step 3: Enforce per-file size limit ───────────────────────────────────
// Each plan has a different ceiling. Free = 10MB, Starter = 100MB, etc.
// isFileSizeAllowed() reads from planLimits.ts — one source of truth.
// We check this BEFORE the document count so the error message is specific.
if (!isFileSizeAllowed(plan, buffer.length)) {
  const limitMB = Math.round(limits.maxFileSizeBytes / (1024 * 1024))
  return NextResponse.json(
    {
      error: `File too large for your ${plan} plan. Maximum file size is ${limitMB}MB. Upgrade your plan to upload larger files.`,
      code: 'FILE_TOO_LARGE',
      limitBytes: limits.maxFileSizeBytes,
      plan,
    },
    { status: 413 }
  )
}

// ── Step 4: Enforce document count limit ──────────────────────────────────
// Free plan allows 5 documents. -1 means unlimited (Starter/Pro/Business).
// We count existing non-archived documents for this user before allowing
// the upload. This prevents free users from bypassing the limit by uploading
// quickly in parallel — the count check happens server-side every time.
if (limits.maxDocuments !== -1) {
  const existingCount = await db.collection('documents').countDocuments({
    userId: user._id.toString(),
    archived: { $ne: true },
  })

  if (existingCount >= limits.maxDocuments) {
    return NextResponse.json(
      {
        error: `You've reached the ${limits.maxDocuments} document limit on the free plan. Upgrade to Starter or higher for unlimited documents.`,
        code: 'DOCUMENT_LIMIT_REACHED',
        limit: limits.maxDocuments,
        used: existingCount,
        plan,
      },
      { status: 403 }
    )
  }
}

// ── Step 5: Enforce total storage limit ───────────────────────────────────
// totalStorageUsedBytes is a running total maintained by the upload and
// delete routes using MongoDB $inc. We read it once here and check if
// adding this file would push them over their plan's storage ceiling.
// isStorageAvailable() handles the math — we just pass the values.
const storageUsedBytes: number = user.totalStorageUsedBytes ?? 0

if (!isStorageAvailable(plan, storageUsedBytes, buffer.length)) {
  const usedMB = Math.round(storageUsedBytes / (1024 * 1024))
  const limitMB = Math.round(limits.storageLimitBytes / (1024 * 1024))
  return NextResponse.json(
    {
      error: `Storage full. You are using ${usedMB}MB of your ${limitMB}MB limit. Delete some files or upgrade your plan.`,
      code: 'STORAGE_LIMIT_REACHED',
      usedBytes: storageUsedBytes,
      limitBytes: limits.storageLimitBytes,
      plan,
    },
    { status: 403 }
  )
}

    //  STEP 1: Convert to PDF + Extract Metadata in PARALLEL
    const [pdfBuffer, metadata] = await Promise.all([
      fileType !== 'pdf'
        ? convertToPdf(buffer, fileType, file.name)
        : Promise.resolve(buffer),
      extractMetadata(buffer, fileType),
    ]);

    // ✅ STEP 2: Extract text + Upload BOTH files to Cloudinary in PARALLEL
    // No need to wait for text before starting uploads — they're independent
   const folder = `users/${user._id.toString()}/documents`;
    const pdfFilename = file.name.replace(/\.[^/.]+$/, '.pdf');

    const [extractedText, originalUrl, pdfUrl] = await Promise.all([
      extractTextFromPdf(pdfBuffer),
      uploadToCloudinary(buffer, file.name, folder),
      uploadToCloudinary(pdfBuffer, pdfFilename, folder),
    ]);

    const scannedPdf = !extractedText || extractedText.trim().length < 30;
    const summary = generateSummary(extractedText);

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

    // ✅ STEP 3: Check existing doc + DB write
    const existingDoc = await db.collection('documents').findOne({
  originalFilename: file.name,
  userId: user._id.toString(),
  organizationId,
  archived: { $ne: true },
});

    if (existingDoc) {
      console.log('📦 Existing document found - creating new version');

      // Run version save + doc update in PARALLEL
      await Promise.all([
        db.collection('documentVersions').insertOne({
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
        }),
        db.collection('documents').updateOne(
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
        ),
        db.collection('analytics_logs').insertOne({
          documentId: existingDoc._id.toString(),
          action: 'version_created',
           userId: user._id.toString(),
          newVersion: (existingDoc.version || 1) + 1,
          previousVersion: existingDoc.version || 1,
          timestamp: new Date(),
        }),
      ]);

      // ✅ Fire-and-forget — never await these
      runBackgroundAnalysis(existingDoc._id.toString(), extractedText, plan, db).catch(console.error);
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

    // ✅ New document insert
    const doc = {
      userId: user._id.toString(),
plan: plan,
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

    // After insertOne succeeds, increment the user's storage counter.
// This keeps totalStorageUsedBytes accurate so future storage checks work.
// We use $inc so concurrent uploads don't race and overwrite each other.
await db.collection('users').updateOne(
  { _id: user._id },
  { $inc: { totalStorageUsedBytes: buffer.length } }
)

    // ✅ Fire-and-forget — never await these
    runBackgroundAnalysis(result.insertedId.toString(), extractedText, plan, db).catch(console.error);
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
