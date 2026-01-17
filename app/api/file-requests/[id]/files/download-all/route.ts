import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyUserFromRequest } from "@/lib/auth"
import { readFile } from "fs/promises"
import path from "path"
import archiver from "archiver"
import { Readable } from "stream"

export const dynamic = 'force-dynamic'

// GET - Download all files as ZIP
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
    const request = await db.collection("fileRequests").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user.id)
    })

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (!request.uploadedFiles || request.uploadedFiles.length === 0) {
      return NextResponse.json({ error: "No files to download" }, { status: 400 })
    }

    console.log('✅ [DOWNLOAD-ALL] Found', request.uploadedFiles.length, 'files')

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    // Add files to archive
    const uploadDir = path.join(
      process.cwd(),
      'uploads',
      'file-requests',
      request.shareToken
    )

    for (const file of request.uploadedFiles) {
      try {
        const filePath = path.join(uploadDir, file.filename)
        const fileBuffer = await readFile(filePath)
        archive.append(fileBuffer, { name: file.originalName })
        console.log('📎 [DOWNLOAD-ALL] Added:', file.originalName)
      } catch (fileError) {
        console.error('⚠️ [DOWNLOAD-ALL] Skipped missing file:', file.originalName)
      }
    }

    await archive.finalize()

    console.log('✅ [DOWNLOAD-ALL] ZIP created')

    // Convert archive stream to Response
    const chunks: Buffer[] = []
    for await (const chunk of archive) {
      chunks.push(Buffer.from(chunk))
    }
    const zipBuffer = Buffer.concat(chunks)

    const zipFilename = `${request.title.replace(/[^a-z0-9]/gi, '_')}.zip`

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("❌ [DOWNLOAD-ALL] Error:", error)
    return NextResponse.json({ 
      error: "Failed to create ZIP archive" 
    }, { status: 500 })
  }
}