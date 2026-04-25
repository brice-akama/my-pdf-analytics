// app/api/file-requests/[id]/files/[fileId]/route.ts
// FIXED: Files are now stored on Cloudinary (not disk).
// FIXED: PDFs uploaded under image/upload → retried as raw/upload to avoid 401.

import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyUserFromRequest } from "@/lib/auth"

export const dynamic = 'force-dynamic'

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    bmp: 'image/bmp', ico: 'image/x-icon',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain', md: 'text/markdown', csv: 'text/csv',
    json: 'application/json', xml: 'application/xml',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    mp3: 'audio/mpeg', wav: 'audio/wav',
    zip: 'application/zip', rar: 'application/x-rar-compressed',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// Helper: try fetching a Cloudinary URL, automatically retrying with
// raw/upload if the file was mistakenly stored under image/upload (401).
async function fetchFromCloudinary(fileUrl: string): Promise<Response | null> {
  // First attempt — use the stored URL as-is
  const firstRes = await fetch(fileUrl)
  if (firstRes.ok) return firstRes

  console.log(`⚠️ [DOWNLOAD] First attempt failed (${firstRes.status}), trying raw/upload URL...`)

  // Second attempt — swap image/upload → raw/upload
  // Fixes PDFs/docs stored under wrong resource type by Cloudinary auto-detect
  const rawUrl = fileUrl.replace('/image/upload/', '/raw/upload/')
  if (rawUrl === fileUrl) {
    // URL didn't contain /image/upload/ — no point retrying
    return null
  }

  const secondRes = await fetch(rawUrl)
  if (secondRes.ok) {
    console.log('✅ [DOWNLOAD] raw/upload URL worked')
    return secondRes
  }

  console.error(`❌ [DOWNLOAD] Both URLs failed. image: ${firstRes.status}, raw: ${secondRes.status}`)
  return null
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, fileId } = await context.params

    console.log('📥 [DOWNLOAD] Request ID:', id, '| File ID:', fileId)

    const db = await dbPromise

    // ── Find request — strict ownership ───────────────────────────────────
    const request = await db.collection("fileRequests").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user.id),
    })

    if (!request) {
      console.log('❌ [DOWNLOAD] Request not found or unauthorized')
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // ── Find the specific file ────────────────────────────────────────────
    const file = request.uploadedFiles?.find(
      (f: any) => f._id.toString() === fileId
    )

    if (!file) {
      console.log('❌ [DOWNLOAD] File not found in request')
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    console.log('✅ [DOWNLOAD] Found file:', file.originalName)

    if (!file.fileUrl) {
      console.error('❌ [DOWNLOAD] No fileUrl — uploaded before Cloudinary migration')
      return NextResponse.json({
        error: "File is not available. It was uploaded before the storage migration. Please re-upload."
      }, { status: 404 })
    }

    console.log('☁️ [DOWNLOAD] Fetching from Cloudinary:', file.fileUrl)

    // ── Fetch with automatic raw/upload fallback ──────────────────────────
    const cloudinaryRes = await fetchFromCloudinary(file.fileUrl)

    if (!cloudinaryRes) {
      return NextResponse.json({ error: "Could not retrieve file from storage." }, { status: 502 })
    }

    const fileBuffer = Buffer.from(await cloudinaryRes.arrayBuffer())
    const contentType = getContentType(file.originalName)

    console.log('✅ [DOWNLOAD] Serving file, size:', fileBuffer.length, 'type:', contentType)

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error("❌ [DOWNLOAD] Error:", error)
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }
}