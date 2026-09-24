// FILE: app/api/spaces/[id]/upload/complete/route.ts
//
// Spaces version of the direct-upload "complete" step.
//
// The browser has already uploaded the file straight to Cloudinary (signed by
// /api/upload/signature). This route receives only a small JSON payload, then:
//   1. checks the user can upload to THIS space (same rules as the old route)
//   2. downloads the file back from Cloudinary (server-side, no body limit)
//   3. runs the SAME processing + records as /api/spaces/[id]/upload:
//      documents, space_files, spaces counter, activityLogs (audit)
//
// The old /api/spaces/[id]/upload route is untouched and still handles small
// files and the Google Drive / OneDrive import path.

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { ObjectId } from 'mongodb'
import cloudinary from 'cloudinary'
import streamifier from 'streamifier'
import { dbPromise } from '@/app/api/lib/mongodb'
import { checkAccess } from '@/lib/checkAccess'
import { isFileSizeAllowed } from '@/lib/planLimits'
import { SUPPORTED_FORMATS } from '@/lib/uploadConstants'
import {
  convertToPdf,
  extractTextFromPdf,
  analyzeDocument,
  extractMetadata,
} from '@/lib/document-processor'

export const maxDuration = 300

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

// Only used for NON-PDF files, to store the converted PDF.
async function uploadToCloudinary(buffer: Buffer, publicId: string, folder: string) {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto',
        type: 'upload',
        access_mode: 'public',
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result?.secure_url || '')
      }
    )
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

const destroyAsset = (id: string, type: string) =>
  cloudinary.v2.uploader
    .destroy(id, { resource_type: type === 'raw' ? 'raw' : 'image' })
    .catch(() => {})

// Works whether or not Cloudinary's "PDF and ZIP files delivery" setting is on:
// first try an authenticated (signed) download, then fall back to the plain URL.
async function downloadOriginal(
  url: string,
  publicId: string,
  resourceType: string,
  fileType: string
): Promise<Buffer> {
  if (fileType === 'pdf') {
    try {
      const signedUrl = cloudinary.v2.utils.private_download_url(publicId, 'pdf', {
        resource_type: resourceType === 'raw' ? 'raw' : 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 300,
      })
      const signedRes = await fetch(signedUrl)
      if (signedRes.ok) return Buffer.from(await signedRes.arrayBuffer())
    } catch {
      // fall through to the plain URL
    }
  }
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to download original file from storage (${res.status})`)
  }
  return Buffer.from(await res.arrayBuffer())
}

function generateSummary(text: string) {
  const sentences = text.split(/[.!?]/).filter(Boolean)
  if (sentences.length <= 3) return text
  return sentences.slice(0, 3).join('. ') + '.'
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  // Tracks the Cloudinary asset the browser already uploaded so we can clean
  // it up if we reject the file or fail BEFORE the document record exists.
  let cleanupPublicId: string | null = null
  let cleanupResourceType = 'image'
  let recordCreated = false

  try {
    const params = context.params instanceof Promise ? await context.params : context.params
    const spaceId = params.id

    // ── Auth + effective plan ──────────────────────────────────────────────
    const access = await checkAccess(request)
    if (!access.ok) return access.response
    const { plan, limits } = access
    const userId = access.userId
    const userEmail: string | undefined = access.user?.email

    // ── Read the (tiny) JSON body ──────────────────────────────────────────
    const body = await request.json().catch(() => null)
    if (!body || !body.originalUrl || !body.publicId || !body.filename || !body.mimeType) {
      return NextResponse.json(
        { error: 'originalUrl, publicId, filename and mimeType are required' },
        { status: 400 }
      )
    }
    const { originalUrl, publicId, filename, mimeType, resourceType, folderId } = body as {
      originalUrl: string
      publicId: string
      filename: string
      mimeType: string
      resourceType?: string
      folderId?: string | null
    }

    // Security: only accept files inside THIS user's folder on OUR Cloudinary account
    const expectedPrefix = `users/${userId}/documents/`
    if (
      !publicId.startsWith(expectedPrefix) ||
      !originalUrl.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/`)
    ) {
      return NextResponse.json({ error: 'Invalid upload reference' }, { status: 400 })
    }
    cleanupPublicId = publicId
    cleanupResourceType = resourceType === 'raw' ? 'raw' : 'image'

    // From here on, any rejection also deletes the uploaded file
    const reject = async (payload: Record<string, any>, status: number) => {
      await destroyAsset(publicId, cleanupResourceType)
      return NextResponse.json(payload, { status })
    }

    const db = await dbPromise

    // ── Space access: same rules as the original upload route ──────────────
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) })
    if (!space) return reject({ error: 'Space not found' }, 404)

    let hasAccess = false
    let userRole = 'viewer'

    if (space.userId === userId) {
      hasAccess = true
      userRole = 'owner'
    } else if (space.members && Array.isArray(space.members)) {
      const member = space.members.find(
        (m: any) => m.email === userEmail || m.userId === userId
      )
      if (member) {
        userRole = member.role || 'viewer'
        if (['editor', 'admin', 'owner'].includes(userRole)) {
          hasAccess = true
        } else {
          return reject(
            { error: 'You do not have permission to upload files. Editor role required.' },
            403
          )
        }
      }
    }
    if (!hasAccess) return reject({ error: 'Access denied to this space' }, 403)

    if (folderId) {
      const folder = await db.collection('space_folders').findOne({
        _id: new ObjectId(folderId),
        spaceId: spaceId,
      })
      if (!folder) return reject({ error: 'Folder not found in this space' }, 404)
    }

    const fileType = SUPPORTED_FORMATS[mimeType as keyof typeof SUPPORTED_FORMATS]
    if (!fileType) {
      return reject(
        { error: 'Unsupported file type', supported: Object.values(SUPPORTED_FORMATS) },
        400
      )
    }

    // ── Download the real bytes and check the size for real ────────────────
    const buffer = await downloadOriginal(originalUrl, publicId, cleanupResourceType, fileType)

    // Uses the plan table (the old route checked a retired "premium" plan name)
    if (!isFileSizeAllowed(plan, buffer.length)) {
      const limitMB = Math.round(limits.maxFileSizeBytes / (1024 * 1024))
      return reject(
        {
          error: `File too large for your ${plan} plan. Maximum file size is ${limitMB}MB.`,
          code: 'FILE_TOO_LARGE',
          limitBytes: limits.maxFileSizeBytes,
          plan,
        },
        413
      )
    }

    // ── Same processing as the original route ──────────────────────────────
    const pdfBuffer = fileType !== 'pdf' ? await convertToPdf(buffer, fileType, filename) : buffer

    let pageDimensions: { pageNumber: number; widthPt: number; heightPt: number }[] = []
    try {
      const { PDFDocument } = await import('pdf-lib')
      const pdfDocForDims = await PDFDocument.load(pdfBuffer)
      pageDimensions = pdfDocForDims.getPages().map((p, idx) => {
        const { width, height } = p.getSize()
        return { pageNumber: idx + 1, widthPt: width, heightPt: height }
      })
    } catch (err) {
      console.error('⚠️ [SPACE UPLOAD COMPLETE] Failed to extract page dimensions:', err)
    }

    const extractedText = await extractTextFromPdf(pdfBuffer)
    const analysis = await analyzeDocument(extractedText, plan)
    const metadata = await extractMetadata(pdfBuffer, fileType)
    const scannedPdf = !extractedText || extractedText.trim().length < 30
    const summary = generateSummary(extractedText)

    // The original is already on Cloudinary. A PDF IS its own PDF copy.
    // Only converted (non-PDF) files need a second upload.
    const cloudinaryFolder = `spaces/${spaceId}/documents`
    const baseName = filename.replace(/\.[^/.]+$/, '')
    const pdfUrl =
      fileType === 'pdf'
        ? originalUrl
        : await uploadToCloudinary(
            pdfBuffer,
            `${baseName}_converted_${crypto.randomUUID()}`,
            cloudinaryFolder
          )

    const documentRecord = {
      userId: userId,
      plan: plan,
      originalFilename: filename,
      originalFormat: fileType,
      mimeType: mimeType,
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
      belongsToSpace: true,
      spaceId: spaceId,
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
      },
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
      folder: folderId || null,
      starred: false,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: new Date(),
    }

    const docResult = await db.collection('documents').insertOne(documentRecord)
    recordCreated = true // from here on we must NOT delete the Cloudinary file
    const documentId = docResult.insertedId.toString()

    await db.collection('space_files').insertOne({
      spaceId: spaceId,
      folderId: folderId || null,
      documentId: documentId,
      filename: filename,
      size: buffer.length,
      mimeType: mimeType,
      numPages: metadata.pageCount,
      viewsInSpace: 0,
      downloadsInSpace: 0,
      lastViewedInSpace: null,
      addedBy: userId,
      addedAt: new Date(),
      order: 0,
    })

    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      {
        $inc: { documentsCount: 1 },
        $set: { lastActivity: new Date(), updatedAt: new Date() },
      }
    )

    // AUDIT LOG — same event as the original route
    await db.collection('activityLogs').insertOne({
      spaceId: new ObjectId(spaceId),
      shareLink: null,
      visitorEmail: null,
      performedBy: userEmail || userId,
      performedByRole: userRole,
      event: 'document_uploaded',
      documentId: docResult.insertedId,
      documentName: filename,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      meta: {
        folderId: folderId || null,
        fileSize: buffer.length,
        fileType,
        numPages: metadata.pageCount,
        source: 'direct_upload',
      },
    })

    console.log(`✅ File uploaded to space ${spaceId} (direct): ${filename}`)

    return NextResponse.json(
      {
        success: true,
        documentId,
        filename,
        spaceId,
        folderId,
        numPages: metadata.pageCount,
        size: buffer.length,
        cloudinaryOriginalUrl: originalUrl,
        cloudinaryPdfUrl: pdfUrl,
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
        hasIssues: analysis.grammar.length > 0 || analysis.spelling.length > 0,
        message: `${filename} added to space successfully`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Space upload complete error:', error)
    // Only clean up if no document record points at the file yet
    if (cleanupPublicId && !recordCreated) {
      await destroyAsset(cleanupPublicId, cleanupResourceType)
    }
    return NextResponse.json(
      {
        error: 'Failed to upload file to space',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}