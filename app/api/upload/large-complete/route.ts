// FILE: app/api/upload/large-complete/route.ts
//
// Step 2 of the LARGE FILE path (files over 10MB). The browser already put
// the original PDF into the R2 scratch bucket (via large-signature).
// This route:
//   1. downloads it from R2
//   2. tries to compress it in-process (lib/pdfCompress.ts) - no external
//      service, no Docker, no Render/Cloud Run
//   3. if it now fits under Cloudinary's 10MB cap, uploads it and runs the
//      SAME document pipeline as /api/upload/complete
//   4. if it's still too big, returns a friendly error asking the user to
//      compress it themselves - same as before this feature existed
//   5. always deletes the R2 scratch file when done, success or failure

import { NextRequest, NextResponse , after } from 'next/server'
import crypto from 'crypto'
import streamifier from 'streamifier'
import cloudinary from 'cloudinary'
import { dbPromise } from '../../lib/mongodb'
import { extractTextFromPdf, extractMetadata } from '@/lib/document-processor'
import { preExtractAllPages , preExtractAllPagesFromBuffer } from '@/lib/preExtractPages'
import { checkAccess } from '@/lib/checkAccess'
import { isStorageAvailable } from '@/lib/planLimits'
import { r2, deleteR2Object } from '@/lib/r2Client'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { compressPdfImages } from '@/lib/pdfCompress'

export const maxDuration = 300 // compression + processing can take a while on a large PDF

const CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

async function downloadFromR2(key: string): Promise<Buffer> {
  const result = await r2.send(
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
  )
  const chunks: Uint8Array[] = []
  // @ts-ignore - Body is a readable stream at runtime
  for await (const chunk of result.Body) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function uploadToCloudinary(buffer: Buffer, publicId: string, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'auto', type: 'upload', access_mode: 'public' },
      (err, result) => (err ? reject(err) : resolve(result?.secure_url || ''))
    )
    streamifier.createReadStream(buffer).pipe(stream)
  })
}

function generateSummary(text: string) {
  const sentences = text.split(/[.!?]/).filter(Boolean)
  if (sentences.length <= 3) return text
  return sentences.slice(0, 3).join('. ') + '.'
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
  } catch (err) {
    console.error('Background analysis failed:', err)
  }
}

export async function POST(request: NextRequest) {
  let r2Key: string | undefined

  try {
    const access = await checkAccess(request)
    if (!access.ok) return access.response
    const { user, plan, limits } = access
    const db = await dbPromise

    const profile = await db.collection('profiles').findOne({ user_id: user._id.toString() })
    const organizationId = profile?.organization_id || null

        const body = await request.json().catch(() => ({}))
    r2Key = body.r2Key
    const filename: string = body.filename
    const targetDocumentId: string | undefined = body.documentId
    const spaceId: string | undefined = body.spaceId
    const folderId: string | undefined = body.folderId
    if (!r2Key || !filename) {
      return NextResponse.json({ error: 'r2Key and filename are required' }, { status: 400 })
    }
    if (!r2Key.startsWith(`scratch/${user._id.toString()}/`)) {
      return NextResponse.json({ error: 'Invalid file reference' }, { status: 400 })
    }

    // Download the original from R2 and try to compress it
    const original = await downloadFromR2(r2Key)

    let finalBuffer = original
    let imagesProcessed = 0
    if (original.length > CLOUDINARY_MAX_BYTES) {
      const result = await compressPdfImages(original, 50)
      finalBuffer = result.buffer
      imagesProcessed = result.imagesProcessed
      console.log(
        `Compressed ${filename}: ${original.length} -> ${finalBuffer.length} bytes (${imagesProcessed} images re-encoded)`
      )
    }

        let storedUrl: string
    let storedInR2 = false
        let permanentKey: string | null = null

    if (finalBuffer.length > CLOUDINARY_MAX_BYTES) {
      // Too big for Cloudinary even after compression — keep it in R2
      // permanently instead of rejecting it. This is the same file that
      // was already sitting in R2's scratch folder; we just stop deleting
      // it and give it a permanent public URL.
      const { PutObjectCommand } = await import('@aws-sdk/client-s3')
        permanentKey = `documents/${user._id.toString()}/${crypto.randomUUID()}.pdf`
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: permanentKey,
          Body: finalBuffer,
          ContentType: 'application/pdf',
        })
      )
      storedUrl = `${process.env.R2_PUBLIC_URL}/${permanentKey}`
      storedInR2 = true
      // Don't delete this one at the end — it's the permanent copy now
      r2Key = undefined
    } else {
      const cloudinaryFolder = `users/${user._id.toString()}/documents`
      const cloudinaryPublicId =
        filename.replace(/\.[^/.]+$/, '') + '_' + crypto.randomBytes(8).toString('hex')
      storedUrl = await uploadToCloudinary(finalBuffer, cloudinaryPublicId, cloudinaryFolder)
    }

    // Re-check plan storage with the REAL (final) size
    const storageUsedBytes: number = user.totalStorageUsedBytes ?? 0
    if (!isStorageAvailable(plan, storageUsedBytes, finalBuffer.length)) {
              if (storedInR2 && permanentKey) await deleteR2Object(permanentKey)
      const usedMB = Math.round(storageUsedBytes / (1024 * 1024))
      const limitMB = Math.round(limits.storageLimitBytes / (1024 * 1024))
      return NextResponse.json(
        {
          error: `Storage full. You are using ${usedMB}MB of your ${limitMB}MB limit. Delete some files or upgrade your plan.`,
          code: 'STORAGE_LIMIT_REACHED',
        },
        { status: 403 }
      )
    }

    

    // Same document pipeline as the rest of your app
    let pageDimensions: { pageNumber: number; widthPt: number; heightPt: number }[] = []
    try {
      const { PDFDocument } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.load(finalBuffer)
      pageDimensions = pdfDoc.getPages().map((p, idx) => {
        const { width, height } = p.getSize()
        return { pageNumber: idx + 1, widthPt: width, heightPt: height }
      })
    } catch (err) {
      console.error('Failed to extract page dimensions:', err)
    }

    const extractedText = await extractTextFromPdf(finalBuffer)
    const metadata = await extractMetadata(finalBuffer, 'pdf')
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

        let existingDoc: any
    if (targetDocumentId) {
      const { ObjectId } = await import('mongodb')
      let docObjectId: any = null
      try { docObjectId = new ObjectId(targetDocumentId) } catch {}
      existingDoc = docObjectId
        ? await db.collection('documents').findOne({
            _id: docObjectId,
            userId: user._id.toString(),
            archived: { $ne: true },
          })
        : null
      if (!existingDoc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
    } else {
      existingDoc = await db.collection('documents').findOne({
        originalFilename: filename,
        userId: user._id.toString(),
        organizationId,
        archived: { $ne: true },
      })
    }

    const commonFields = {
      originalFormat: 'pdf',
      mimeType: 'application/pdf',
      size: finalBuffer.length,
            pdfSize: finalBuffer.length,
      cloudinaryOriginalUrl: storedUrl,
      cloudinaryPdfUrl: storedUrl,
      extractedText: extractedText.substring(0, 10000),
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      charCount: metadata.charCount,
      pageDimensions,
      summary,
      scannedPdf,
      wasCompressed: original.length > CLOUDINARY_MAX_BYTES,
            storage: storedInR2 ? 'r2' : 'cloudinary',
      r2Key: storedInR2 ? permanentKey : null,
    }

    if (existingDoc) {
      await Promise.all([
        db.collection('documentVersions').insertOne({
          documentId: existingDoc._id,
          version: existingDoc.version || 1,
          filename: existingDoc.originalFilename,
          originalFormat: existingDoc.originalFormat,
          mimeType: existingDoc.mimeType,
          size: existingDoc.size,
          pdfSize: existingDoc.pdfSize,
          cloudinaryPdfUrl: existingDoc.cloudinaryPdfUrl,
          cloudinaryOriginalUrl: existingDoc.cloudinaryOriginalUrl,
          extractedText: existingDoc.extractedText,
          analytics: existingDoc.analytics,
          tracking: existingDoc.tracking,
          uploadedBy: existingDoc.userId,
          createdAt: existingDoc.updatedAt || existingDoc.createdAt,
          changeLog: `Version ${existingDoc.version || 1} - Replaced by large-file upload`,
        }),
        db.collection('documents').updateOne(
          { _id: existingDoc._id },
          {
            $set: {
              ...commonFields,
              version: (existingDoc.version || 1) + 1,
              analytics: pendingAnalytics,
              updatedAt: new Date(),
              lastAnalyzedAt: null,
            },
          }
        ),
      ])

      await db.collection('users').updateOne(
        { _id: user._id },
        { $inc: { totalStorageUsedBytes: finalBuffer.length - (existingDoc.size || 0) } }
      )

           runBackgroundAnalysis(existingDoc._id.toString(), extractedText, plan, db).catch(console.error)
                  if (storedInR2) {
        const pagesDocId = existingDoc._id.toString()
        after(async () => {
          await preExtractAllPagesFromBuffer(finalBuffer, pagesDocId)
        })
      } else {
        preExtractAllPages(storedUrl, existingDoc._id.toString()).catch(err =>
          console.error('Pre-extraction error:', err)
        )
      }

      if (spaceId) {
        const { ObjectId } = await import('mongodb')
        const docId = existingDoc._id
        await db.collection('space_files').insertOne({
          spaceId,
          folderId: folderId || null,
          documentId: docId.toString(),
          filename,
          size: finalBuffer.length,
          mimeType: 'application/pdf',
          numPages: metadata.pageCount,
          viewsInSpace: 0,
          downloadsInSpace: 0,
          lastViewedInSpace: null,
          addedBy: user._id.toString(),
          addedAt: new Date(),
          order: 0,
        })
        await db.collection('spaces').updateOne(
          { _id: new ObjectId(spaceId) },
          { $inc: { documentsCount: 1 }, $set: { lastActivity: new Date(), updatedAt: new Date() } }
        )
        await db.collection('activityLogs').insertOne({
          spaceId: new ObjectId(spaceId),
          performedBy: user.email || user._id.toString(),
          event: 'document_uploaded',
          documentId: docId,
          documentName: filename,
          timestamp: new Date(),
          meta: { folderId: folderId || null, source: 'large_upload_compressed' },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'New version created',
        documentId: existingDoc._id.toString(),
        version: (existingDoc.version || 1) + 1,
        filename,
        ...commonFields,
      })
    }

    const doc = {
      userId: user._id.toString(),
      plan,
      organizationId,
      version: 1,
      originalFilename: filename,
      visibility: 'personal',
      ...commonFields,
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
      { $inc: { totalStorageUsedBytes: finalBuffer.length } }
    )

           runBackgroundAnalysis(result.insertedId.toString(), extractedText, plan, db).catch(console.error)
        if (storedInR2) {
      const pagesDocId = result.insertedId.toString()
      after(async () => {
        await preExtractAllPagesFromBuffer(finalBuffer, pagesDocId)
      })
    } else {
      preExtractAllPages(storedUrl, result.insertedId.toString()).catch(err =>
        console.error('Pre-extraction error:', err)
      )
    }

    if (spaceId) {
      const { ObjectId } = await import('mongodb')
      const docId = result.insertedId
      await db.collection('space_files').insertOne({
        spaceId,
        folderId: folderId || null,
        documentId: docId.toString(),
        filename,
        size: finalBuffer.length,
        mimeType: 'application/pdf',
        numPages: metadata.pageCount,
        viewsInSpace: 0,
        downloadsInSpace: 0,
        lastViewedInSpace: null,
        addedBy: user._id.toString(),
        addedAt: new Date(),
        order: 0,
      })
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { $inc: { documentsCount: 1 }, $set: { lastActivity: new Date(), updatedAt: new Date() } }
      )
      await db.collection('activityLogs').insertOne({
        spaceId: new ObjectId(spaceId),
        performedBy: user.email || user._id.toString(),
        event: 'document_uploaded',
        documentId: docId,
        documentName: filename,
        timestamp: new Date(),
        meta: { folderId: folderId || null, source: 'large_upload_compressed' },
      })
    }

    return NextResponse.json(
      { success: true, documentId: result.insertedId.toString(), filename, ...commonFields },
      { status: 201 }
    )
  } catch (error) {
    console.error('Large-file upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process document. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  } finally {
    if (r2Key) await deleteR2Object(r2Key) // scratch file is never kept, success or failure
  }
}