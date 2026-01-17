import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { ObjectId } from "mongodb"

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    // ✅ Next.js 15: await params
    const { token } = await context.params
    
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const uploaderName = formData.get('uploaderName') as string
    const uploaderEmail = formData.get('uploaderEmail') as string

    console.log('📤 [UPLOAD] Token:', token.substring(0, 20) + '...')
    console.log('📤 [UPLOAD] Files:', files.length)
    console.log('📤 [UPLOAD] From:', uploaderName, uploaderEmail)

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    if (!uploaderName || !uploaderEmail) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 })
    }

    const db = await dbPromise
    const request = await db.collection("fileRequests").findOne({
      shareToken: token,
      status: 'active'
    })

    if (!request) {
      console.log('❌ [UPLOAD] Request not found or inactive')
      return NextResponse.json({ error: "Request not found or inactive" }, { status: 404 })
    }

    console.log('✅ [UPLOAD] Found request:', request.title)

    // Save files
    const uploadDir = path.join(process.cwd(), 'uploads', 'file-requests', token)
    await mkdir(uploadDir, { recursive: true })

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `${Date.now()}-${file.name}`
        const filepath = path.join(uploadDir, filename)
        
        await writeFile(filepath, buffer)

        console.log('💾 [UPLOAD] Saved:', filename)

        return {
          _id: new ObjectId(),
          filename,
          originalName: file.name,
          size: file.size,
          uploadedAt: new Date(),
          uploadedBy: {
            name: uploaderName.trim(),
            email: uploaderEmail.trim()
          }
        }
      })
    )

    // Update database
    await db.collection("fileRequests").updateOne(
      { _id: request._id },
      {
        $push: { uploadedFiles: { $each: uploadedFiles } } as any,
        $set: { updatedAt: new Date() }
      }
    )

    console.log('✅ [UPLOAD] Database updated with', uploadedFiles.length, 'files')

    // TODO: Send notification email to requester

    return NextResponse.json({
      success: true,
      message: "Files uploaded successfully",
      filesUploaded: uploadedFiles.length
    })
  } catch (error) {
    console.error("❌ [UPLOAD] Error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}