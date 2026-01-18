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
      
      console.log('✅ [DOWNLOAD] File read successfully, size:', fileBuffer.length)

      // 🟢 Detect proper MIME type
      const getContentType = (filename: string): string => {
        const ext = filename.toLowerCase().split('.').pop()
        
        const mimeTypes: Record<string, string> = {
          // Images
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
          'bmp': 'image/bmp',
          'ico': 'image/x-icon',
          
          // Documents
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          
          // Text
          'txt': 'text/plain',
          'md': 'text/markdown',
          'csv': 'text/csv',
          'json': 'application/json',
          'xml': 'application/xml',
          'html': 'text/html',
          'css': 'text/css',
          'js': 'application/javascript',
          'ts': 'application/typescript',
          
          // Video
          'mp4': 'video/mp4',
          'webm': 'video/webm',
          'ogg': 'video/ogg',
          'mov': 'video/quicktime',
          
          // Audio
          'mp3': 'audio/mpeg',
          'wav': 'audio/wav',
          'm4a': 'audio/mp4',
          
          // Archives
          'zip': 'application/zip',
          'rar': 'application/x-rar-compressed',
          '7z': 'application/x-7z-compressed',
          'tar': 'application/x-tar',
          'gz': 'application/gzip',
        }
        
        return mimeTypes[ext || ''] || 'application/octet-stream'
      }

      const contentType = getContentType(file.originalName)
      console.log('📄 [DOWNLOAD] Content-Type:', contentType)

      // ✅ Convert Buffer to Uint8Array for Next.js
      const uint8Array = new Uint8Array(fileBuffer)

      // Return file with proper content type
      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-cache',
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