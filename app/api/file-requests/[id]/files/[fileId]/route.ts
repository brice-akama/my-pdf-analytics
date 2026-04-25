// app/api/file-requests/[id]/files/[fileId]/route.ts
// FIXED: Files are now stored on Cloudinary (not disk).
// We fetch from file.fileUrl (Cloudinary) instead of reading from /uploads.

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

    // ── Find request — strict ownership, no org logic ─────────────────────
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

    // ── FIXED: Fetch from Cloudinary URL instead of disk ─────────────────
    if (!file.fileUrl) {
      console.error('❌ [DOWNLOAD] No fileUrl on file record — old upload before Cloudinary fix')
      return NextResponse.json({
        error: "File is not available. It may have been uploaded before the storage migration."
      }, { status: 404 })
    }

    console.log('☁️ [DOWNLOAD] Fetching from Cloudinary:', file.fileUrl)

    const cloudinaryRes = await fetch(file.fileUrl)
    if (!cloudinaryRes.ok) {
      console.error('❌ [DOWNLOAD] Cloudinary fetch failed:', cloudinaryRes.status)
      return NextResponse.json({ error: "Could not retrieve file." }, { status: 502 })
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