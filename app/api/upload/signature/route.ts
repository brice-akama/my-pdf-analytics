// FILE: app/api/upload/signature/route.ts
//
// STEP 1 of the direct-upload flow.
//
// The browser calls this route FIRST, before touching Cloudinary, so we can:
//   1. Authenticate the user and resolve their effective plan
//   2. Reject early if the declared file type/size would violate plan limits
//   3. Hand back a short-lived signed payload that lets the browser upload
//      the ORIGINAL file straight to Cloudinary — bypassing this server
//      entirely, so Vercel's ~4.5MB serverless body limit never applies.
//
// This route's request/response bodies are tiny JSON — no file bytes ever
// touch this function, so it works the same for a 200KB file or a 500MB one.

import { NextRequest, NextResponse } from 'next/server'
import cloudinary from 'cloudinary'
import { dbPromise } from '../../lib/mongodb'
import { checkAccess } from '@/lib/checkAccess'
import { isFileSizeAllowed, isStorageAvailable } from '@/lib/planLimits'
import { SUPPORTED_FORMATS } from '@/lib/uploadConstants'
 

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // ── Step 1: Authenticate and get effective plan ──────────────────────
    const access = await checkAccess(request)
    if (!access.ok) return access.response
    const { user, plan, limits } = access

    // ── Step 2: Read the (tiny) JSON body — no file bytes here ───────────
    const body = await request.json().catch(() => null)
    if (!body || !body.filename || !body.mimeType || typeof body.fileSize !== 'number') {
      return NextResponse.json(
        { error: 'filename, mimeType and fileSize are required' },
        { status: 400 }
      )
    }
    const { filename, mimeType, fileSize } = body as {
      filename: string
      mimeType: string
      fileSize: number
    }

    // ── Step 3: Validate file type ────────────────────────────────────────
    const fileType = SUPPORTED_FORMATS[mimeType as keyof typeof SUPPORTED_FORMATS]
    if (!fileType) {
      return NextResponse.json(
        {
          error:
            "This file type isn't supported. You can upload PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), images (.jpg, .png, .gif, .webp), or text/HTML/Markdown files — we'll automatically convert non-PDF files for you.",
          code: 'UNSUPPORTED_FILE_TYPE',
          supportedFormats: [
            'PDF', 'Word (.doc, .docx)', 'Excel (.xls, .xlsx)', 'PowerPoint (.ppt, .pptx)',
            'Images (.jpg, .png, .gif, .webp)', 'Text (.txt, .html, .md)',
          ],
        },
        { status: 400 }
      )
    }

    // ── Step 4: Enforce per-file size limit (first pass) ──────────────────
    // This checks the size the BROWSER reports. It exists purely to fail
    // fast and save the user's upload bandwidth — /api/upload/complete
    // re-checks this against the real downloaded byte count, since a
    // client could in theory send a false fileSize here.
    if (!isFileSizeAllowed(plan, fileSize)) {
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

    // ── Step 5: Enforce total storage limit ────────────────────────────────
    const storageUsedBytes: number = user.totalStorageUsedBytes ?? 0
    if (!isStorageAvailable(plan, storageUsedBytes, fileSize)) {
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

    // ── Step 6: Enforce document count limit ───────────────────────────────
    if (limits.maxDocuments !== -1) {
      const db = await dbPromise
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

    // ── Step 7: Build the signed Cloudinary upload payload ─────────────────
    const folder = `users/${user._id.toString()}/documents`
    const safePublicId = encodeURIComponent(filename.replace(/\.[^/.]+$/, ''))
    const timestamp = Math.round(Date.now() / 1000)

    // Only these params go into the signature. The browser must send
    // Cloudinary the exact same values, or Cloudinary rejects the upload.
    const paramsToSign = { timestamp, folder, public_id: safePublicId }

    const signature = cloudinary.v2.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_SECRET_KEY as string
    )

    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      publicId: safePublicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_NAME}/auto/upload`,
      fileType,
    })
  } catch (error) {
    console.error('❌ Upload signature error:', error)
    return NextResponse.json(
      { error: 'Failed to prepare upload. Please try again.' },
      { status: 500 }
    )
  }
}