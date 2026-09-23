// FILE: app/api/upload/complete/route.ts
//
// STEP 3 of the direct-upload flow (after /api/upload/signature and the
// browser's direct-to-Cloudinary upload).
//
// The browser has already uploaded the ORIGINAL file straight to Cloudinary
// using the signed params from /api/upload/signature. This route receives
// only a small JSON payload — the resulting Cloudinary URL + public_id —
// never the file bytes. That's what keeps this route's request body tiny
// regardless of source file size, so Vercel's serverless body limit never
// applies to it.
//
// This route then downloads the file back down from Cloudinary — an
// OUTBOUND fetch from the server, which has no equivalent size limit — and
// runs the same PDF-conversion / text-extraction / DB pipeline the old
// single-step /api/upload route used to run inline.

import { NextRequest, NextResponse } from 'next/server'
import cloudinary from 'cloudinary'
import { dbPromise } from '../../lib/mongodb'
import {
  convertToPdf,
  extractTextFromPdf,
  extractMetadata,
} from '@/lib/document-processor'
import { preExtractAllPages } from '@/lib/preExtractPages'
import { checkAccess } from '@/lib/checkAccess'
import { isStorageAvailable, isFileSizeAllowed } from '@/lib/planLimits'
import { SUPPORTED_FORMATS } from '@/lib/uploadConstants'
 

export const maxDuration = 300

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

async function uploadToCloudinary(buffer: Buffer, filename: string, folder: string): Promise<string> {
  const streamifier = (await import('streamifier')).default
  return new Promise<string>((resolve, reject) => {
    const safePublicId = encodeURIComponent(filename.replace(/\.[^/.]+$/, ''))
    const timeout = setTimeout(() => {
      reject(new Error('Cloudinary upload timed out after 120s'))
    }, 120_000)

    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        public_id: safePublicId,
        resource_type: 'auto',
        type: 'upload',
        access_mode: 'public',
        chunk_size: 6_000_000,
        timeout: 120_000,
      },
      (error, result) => {
        clearTimeout(timeout)
        if (error) return reject(error)
        resolve(result?.secure_url || '')
      }
    )

    streamifier.createReadStream(buffer, { highWaterMark: 512 * 1024 }).pipe(uploadStream)
  })
}

async function runBackgroundAnalysis(docId: string, text: string, plan: string, db: any) {
  try {
    const { analyzeDocument } = await import('@/lib/document-processor')
    const { ObjectId } = await import('mongodb')
    const analysis = await analyzeDocument(text, plan)
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
    )
    console.log('✅ Background analysis complete for:', docId)
  } catch (err) {
    console.error('❌ Background analysis failed:', err)
  }
}

function generateSummary(text: string) {
  const sentences = text.split(/[.!?]/).filter(Boolean)
  if (sentences.length <= 3) return text
  return sentences.slice(0, 3).join('. ') + '.'
}

// Downloads the original file back from Cloudinary so it can be converted.
// This is a server → Cloudinary outbound request, not subject to the
// Vercel inbound body-size limit that caused the original 29MB/57MB failures.
async function downloadOriginal(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to download original file from storage (${res.status})`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

const destroyAsset = (id: string, type: string) =>
  cloudinary.v2.uploader
    .destroy(id, { resource_type: type === 'raw' ? 'raw' : 'image' })
    .catch(() => {})


export async function POST(request: NextRequest) {
  // Tracks the Cloudinary asset the browser already uploaded, so we can
  // clean it up if anything downstream fails or a limit is violated.
  let cleanupPublicId: string | null = null
  let cleanupResourceType = 'image'

  try {
    // ── Step 1: Authenticate and get effective plan ───────────────────────
    const access = await checkAccess(request)
    if (!access.ok) return access.response
    const { user, plan, limits } = access
    const db = await dbPromise

    const profile = await db.collection('profiles').findOne({ user_id: user._id.toString() })
    const organizationId = profile?.organization_id || null

    // ── Step 2: Read the (tiny) JSON body ─────────────────────────────────
    const body = await request.json().catch(() => null)
    if (!body || !body.originalUrl || !body.publicId || !body.filename || !body.mimeType) {
      return NextResponse.json(
        { error: 'originalUrl, publicId, filename and mimeType are required' },
        { status: 400 }
      )
    }
   const { originalUrl, publicId, filename, mimeType, resourceType } = body as {
  originalUrl: string
  publicId: string
  filename: string
  mimeType: string
  resourceType?: string
}

// Security: only accept files inside THIS user's folder on OUR Cloudinary account
const expectedPrefix = `users/${user._id.toString()}/documents/`
if (
  !publicId.startsWith(expectedPrefix) ||
  !originalUrl.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/`)
) {
  return NextResponse.json({ error: 'Invalid upload reference' }, { status: 400 })
}
cleanupPublicId = publicId
cleanupResourceType = resourceType === 'raw' ? 'raw' : 'image'

    const fileType = SUPPORTED_FORMATS[mimeType as keyof typeof SUPPORTED_FORMATS]
    if (!fileType) {
      await destroyAsset(publicId, cleanupResourceType)
      return NextResponse.json(
        { error: 'Unsupported file type', code: 'UNSUPPORTED_FILE_TYPE' },
        { status: 400 }
      )
    }

    // ── Step 3: Download the real bytes and re-check limits for real ──────
    // /api/upload/signature only checked the size the CLIENT CLAIMED.
    // Now that the file actually exists, verify against the real byte
    // count before doing any paid work (conversion, DB writes, storage).
    const buffer = await downloadOriginal(originalUrl)

    if (!isFileSizeAllowed(plan, buffer.length)) {
    await destroyAsset(publicId, cleanupResourceType)
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

    const storageUsedBytes: number = user.totalStorageUsedBytes ?? 0
    if (!isStorageAvailable(plan, storageUsedBytes, buffer.length)) {
      await destroyAsset(publicId, cleanupResourceType)
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

    if (limits.maxDocuments !== -1) {
      const existingCount = await db.collection('documents').countDocuments({
        userId: user._id.toString(),
        archived: { $ne: true },
      })
      if (existingCount >= limits.maxDocuments) {
        await destroyAsset(publicId, cleanupResourceType)
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

    // ── STEP 4: Convert to PDF + Extract Metadata in PARALLEL ─────────────
    const [pdfBuffer, metadata] = await Promise.all([
      fileType !== 'pdf' ? convertToPdf(buffer, fileType, filename) : Promise.resolve(buffer),
      extractMetadata(buffer, fileType),
    ])

    // ── STEP 4.5: Extract real per-page dimensions ─────────────────────────
    let pageDimensions: { pageNumber: number; widthPt: number; heightPt: number }[] = []
    try {
      const { PDFDocument } = await import('pdf-lib')
      const pdfDocForDims = await PDFDocument.load(pdfBuffer)
      pageDimensions = pdfDocForDims.getPages().map((p, idx) => {
        const { width, height } = p.getSize()
        return { pageNumber: idx + 1, widthPt: width, heightPt: height }
      })
    } catch (err) {
      console.error('⚠️ Failed to extract page dimensions:', err)
    }

    // ── STEP 5: Extract text + upload the CONVERTED PDF in parallel ───────
    // The original is already on Cloudinary (the browser put it there
    // directly) — no need to re-upload it. We only push the converted
    // PDF version up from here.
    const folder = `users/${user._id.toString()}/documents`
    const pdfFilename =
  filename.replace(/\.[^/.]+$/, '') + `_${crypto.randomUUID()}_converted.pdf`

    const [extractedText, pdfUrl] = await Promise.all([
      extractTextFromPdf(pdfBuffer),
      fileType === 'pdf'
  ? Promise.resolve(originalUrl)
  : uploadToCloudinary(pdfBuffer, pdfFilename, folder),
    ])

    const scannedPdf = !extractedText || extractedText.trim().length < 30
    const summary = generateSummary(extractedText)

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
    }

    // ── STEP 6: Check existing doc + DB write ──────────────────────────────
    const existingDoc = await db.collection('documents').findOne({
      originalFilename: filename,
      userId: user._id.toString(),
      organizationId,
      archived: { $ne: true },
    })

    if (existingDoc) {
      console.log('📦 Existing document found - creating new version')

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
              mimeType,
              size: buffer.length,
              pdfSize: pdfBuffer.length,
              cloudinaryOriginalUrl: originalUrl,
              cloudinaryPdfUrl: pdfUrl,
              extractedText: extractedText.substring(0, 10000),
              numPages: metadata.pageCount,
              wordCount: metadata.wordCount,
              charCount: metadata.charCount,
              pageDimensions,
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
      ])

      // NOTE: fixed vs. the original route — this now increments storage by
      // the DELTA (new size minus old size) instead of always adding the
      // full new size, so re-uploading a new version of an existing file no
      // longer inflates totalStorageUsedBytes by more than it should.
      await db.collection('users').updateOne(
        { _id: user._id },
        { $inc: { totalStorageUsedBytes: buffer.length - (existingDoc.size || 0) } }
      )

      runBackgroundAnalysis(existingDoc._id.toString(), extractedText, plan, db).catch(console.error)
      preExtractAllPages(pdfUrl, existingDoc._id.toString()).catch(err =>
        console.error('Pre-extraction error:', err)
      )

      return NextResponse.json({
        success: true,
        message: 'New version created',
        documentId: existingDoc._id.toString(),
        version: (existingDoc.version || 1) + 1,
        previousVersion: existingDoc.version || 1,
        filename,
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
      }, { status: 200 })
    }

    // ── New document insert ────────────────────────────────────────────────
    const doc = {
      userId: user._id.toString(),
      plan,
      organizationId,
      version: 1,
      originalFilename: filename,
      originalFormat: fileType,
      visibility: 'personal',
      mimeType,
      size: buffer.length,
      pdfSize: pdfBuffer.length,
      cloudinaryOriginalUrl: originalUrl,
      cloudinaryPdfUrl: pdfUrl,
      extractedText: extractedText.substring(0, 10000),
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      charCount: metadata.charCount,
      summary,
      pageDimensions,
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
      dealOutcome: null,
      dealOutcomeSetAt: null,
      dealOutcomeSetBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: null,
    }

    const result = await db.collection('documents').insertOne(doc)

    await db.collection('users').updateOne(
      { _id: user._id },
      { $inc: { totalStorageUsedBytes: buffer.length } }
    )

    runBackgroundAnalysis(result.insertedId.toString(), extractedText, plan, db).catch(console.error)
    preExtractAllPages(pdfUrl, result.insertedId.toString()).catch(err =>
      console.error('Pre-extraction error:', err)
    )

    return NextResponse.json({
      success: true,
      documentId: result.insertedId.toString(),
      filename,
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
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Document upload completion error:', error)
    // Best-effort cleanup so a failed conversion doesn't leave an orphaned
    // file sitting in Cloudinary that nothing ever references.
    if (cleanupPublicId) {
      await destroyAsset(cleanupPublicId, cleanupResourceType)
    }
    return NextResponse.json({
      error: 'Failed to process document. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}