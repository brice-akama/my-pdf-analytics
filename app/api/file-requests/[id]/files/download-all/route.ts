// app/api/file-requests/[id]/files/download-all/route.ts
// FIXED: Files are now stored on Cloudinary (not disk).
// We fetch each file from file.fileUrl and zip them in memory.

import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyUserFromRequest } from "@/lib/auth"
import archiver from "archiver"

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    console.log('📦 [DOWNLOAD-ALL] Request ID:', id)

    const db = await dbPromise

    // ── Find request — strict ownership ───────────────────────────────────
    const request = await db.collection("fileRequests").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user.id),
    })

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (!request.uploadedFiles || request.uploadedFiles.length === 0) {
      return NextResponse.json({ error: "No files to download" }, { status: 400 })
    }

    console.log('✅ [DOWNLOAD-ALL] Found', request.uploadedFiles.length, 'files')

    // ── FIXED: Fetch each file from Cloudinary and zip in memory ─────────
    const archive = archiver('zip', { zlib: { level: 9 } })

    for (const file of request.uploadedFiles) {
      if (!file.fileUrl) {
        console.warn('⚠️ [DOWNLOAD-ALL] Skipping file with no fileUrl:', file.originalName)
        continue
      }
      try {
        console.log('☁️ [DOWNLOAD-ALL] Fetching:', file.originalName)
        const res = await fetch(file.fileUrl)
        if (!res.ok) {
          console.warn('⚠️ [DOWNLOAD-ALL] Failed to fetch:', file.originalName, res.status)
          continue
        }
        const buffer = Buffer.from(await res.arrayBuffer())
        archive.append(buffer, { name: file.originalName })
        console.log('📎 [DOWNLOAD-ALL] Added:', file.originalName)
      } catch (fileError) {
        console.error('⚠️ [DOWNLOAD-ALL] Skipped file error:', file.originalName, fileError)
      }
    }

    await archive.finalize()

    // Collect zip chunks
    const chunks: Buffer[] = []
    for await (const chunk of archive) {
      chunks.push(Buffer.from(chunk))
    }
    const zipBuffer = Buffer.concat(chunks)

    const zipFilename = `${request.title.replace(/[^a-z0-9]/gi, '_')}.zip`

    console.log('✅ [DOWNLOAD-ALL] ZIP ready, size:', zipBuffer.length)

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error("❌ [DOWNLOAD-ALL] Error:", error)
    return NextResponse.json({ error: "Failed to create ZIP archive" }, { status: 500 })
  }
}