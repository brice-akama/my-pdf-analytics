import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyUserFromRequest } from "@/lib/auth"
import { readFile } from "fs/promises"
import path from "path"

export const dynamic = 'force-dynamic'

// GET - Download individual file
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Next.js 15: await params
    const { id, fileId } = await context.params

    console.log('📥 [DOWNLOAD] Request ID:', id)
    console.log('📥 [DOWNLOAD] File ID:', fileId)
    console.log('📥 [DOWNLOAD] User:', user.id)

    const db = await dbPromise
    
    // Find the file request and verify ownership
    const request = await db.collection("fileRequests").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user.id)
    })

    if (!request) {
      console.log('❌ [DOWNLOAD] Request not found or unauthorized')
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    console.log('✅ [DOWNLOAD] Found request:', request.title)

    // Find the specific file in uploadedFiles array
    const file = request.uploadedFiles?.find(
      (f: any) => f._id.toString() === fileId
    )

    if (!file) {
      console.log('❌ [DOWNLOAD] File not found in request')
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    console.log('✅ [DOWNLOAD] Found file:', file.originalName)

    // Read file from disk
    const filePath = path.join(
      process.cwd(),
      'uploads',
      'file-requests',
      request.shareToken,
      file.filename
    )

    console.log('📂 [DOWNLOAD] Reading from:', filePath)

    try {
      const fileBuffer = await readFile(filePath)
const uint8Array = new Uint8Array(fileBuffer)

return new NextResponse(uint8Array, {
  headers: {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="${file.originalName}"`,
    "Content-Length": uint8Array.byteLength.toString(),
  },
})

    } catch (fileError) {
      console.error('❌ [DOWNLOAD] File read error:', fileError)
      return NextResponse.json({ 
        error: "File not found on disk. It may have been deleted." 
      }, { status: 404 })
    }
  } catch (error) {
    console.error("❌ [DOWNLOAD] Error:", error)
    return NextResponse.json({ 
      error: "Failed to download file" 
    }, { status: 500 })
  }
} 