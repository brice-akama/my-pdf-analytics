// app/api/public/file-request/[token]/upload/route.ts
// REPLACE your entire existing file with this
// Key change: if the file request has spaceId, uploaded files also
// land in the space folder (documents + space_files collections)

import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { ObjectId } from "mongodb"
import cloudinary from 'cloudinary'
import streamifier from 'streamifier'

export const dynamic = 'force-dynamic'

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

async function uploadToCloudinary(buffer: Buffer, filename: string, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ""),
        resource_type: "auto",
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

// Detect MIME type from filename extension
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    csv: 'text/csv',
    zip: 'application/zip',
  }
  return map[ext || ''] || 'application/octet-stream'
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
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
      return NextResponse.json({ error: "Request not found or inactive" }, { status: 404 })
    }

    console.log('✅ [UPLOAD] Found request:', request.title, '| Space-linked:', !!request.spaceId)

    // Validate recipient
    const isAuthorizedRecipient = request.recipients.some(
      (r: any) => r.email.toLowerCase() === uploaderEmail.toLowerCase().trim()
    )
    if (!isAuthorizedRecipient) {
      return NextResponse.json({
        error: "This email address is not authorized to upload files to this request."
      }, { status: 403 })
    }

    // Validate file count
    const currentFileCount = request.uploadedFiles?.length || 0
    const totalAfterUpload = currentFileCount + files.length
    if (totalAfterUpload > request.expectedFiles) {
      return NextResponse.json({
        error: `This request expects ${request.expectedFiles} file(s). Only ${request.expectedFiles - currentFileCount} more can be uploaded.`
      }, { status: 400 })
    }

    // Check if already uploaded
    const hasAlreadyUploaded = request.uploadedFiles?.some(
      (f: any) => f.uploadedBy?.email.toLowerCase() === uploaderEmail.toLowerCase()
    )
    if (hasAlreadyUploaded) {
      return NextResponse.json({
        error: "You have already uploaded files to this request."
      }, { status: 400 })
    }

    // ── Save files to disk (same as before) ─────────────────────────────────
    const uploadDir = path.join(process.cwd(), 'uploads', 'file-requests', token)
    await mkdir(uploadDir, { recursive: true })

    const isSpaceLinked = !!(request.spaceId && request.spaceId !== null)

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `${Date.now()}-${file.name}`
        const filepath = path.join(uploadDir, filename)

        // Always save to disk
        await writeFile(filepath, buffer)
        console.log('💾 [UPLOAD] Saved to disk:', filename)

        let spaceDocumentId: string | null = null

        // ── If space-linked: also save to Cloudinary + insert into space ────
        if (isSpaceLinked) {
          try {
            console.log('🔗 [UPLOAD] Space-linked — uploading to Cloudinary...')

            const cloudinaryFolder = `spaces/${request.spaceId}/documents`
            const cloudinaryUrl = await uploadToCloudinary(buffer, file.name, cloudinaryFolder)

            console.log('☁️ [UPLOAD] Cloudinary URL:', cloudinaryUrl)

            const mimeType = getMimeType(file.name)
            const ext = file.name.toLowerCase().split('.').pop() || 'file'

            // Insert into documents collection (same structure as space upload route)
            const documentRecord = {
              userId: request.userId.toString(),
              originalFilename: file.name,
              originalFormat: ext,
              mimeType,
              size: buffer.length,
              cloudinaryOriginalUrl: cloudinaryUrl,
              cloudinaryPdfUrl: cloudinaryUrl, // same URL — no PDF conversion for file requests
              extractedText: '',
              numPages: 1,
              wordCount: 0,
              charCount: 0,
              summary: `Uploaded by ${uploaderName} (${uploaderEmail}) via file request: "${request.title}"`,
              scannedPdf: false,
              belongsToSpace: true,
              spaceId: request.spaceId,
              folder: request.folderId || null,
              // Source info — helps distinguish file-request uploads from owner uploads
              source: 'file_request',
              fileRequestId: request._id.toString(),
              uploadedByVisitor: {
                name: uploaderName.trim(),
                email: uploaderEmail.trim(),
              },
              analytics: {
                readabilityScore: 0,
                sentimentScore: 0,
                grammarIssues: [],
                spellingErrors: [],
                clarityScore: [],
                formalityLevel: 'unknown',
                keywords: [],
                entities: [],
                language: 'unknown',
                errorCounts: { grammar: 0, spelling: 0, clarity: 0 },
                healthScore: 0,
              },
              tracking: {
                views: 0,
                uniqueVisitors: [],
                downloads: 0,
                shares: 0,
                averageViewTime: 0,
                viewsByPage: [0],
                lastViewed: null,
              },
              isPublic: false,
              sharedWith: [],
              shareLinks: [],
              tags: [],
              starred: false,
              archived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastAnalyzedAt: new Date(),
            }

            const docResult = await db.collection('documents').insertOne(documentRecord)
            spaceDocumentId = docResult.insertedId.toString()

            // Insert into space_files collection
            await db.collection('space_files').insertOne({
              spaceId: request.spaceId,
              folderId: request.folderId || null,
              documentId: spaceDocumentId,
              filename: file.name,
              size: buffer.length,
              mimeType,
              numPages: 1,
              viewsInSpace: 0,
              downloadsInSpace: 0,
              lastViewedInSpace: null,
              addedBy: request.userId.toString(),
              addedByVisitor: {
                name: uploaderName.trim(),
                email: uploaderEmail.trim(),
              },
              source: 'file_request',
              fileRequestId: request._id.toString(),
              addedAt: new Date(),
              order: 0,
            })

            // Increment space document count
            await db.collection('spaces').updateOne(
              { _id: new ObjectId(request.spaceId) },
              {
                $inc: { documentsCount: 1 },
                $set: { lastActivity: new Date(), updatedAt: new Date() }
              }
            )

            // Activity log so space analytics picks it up
            await db.collection('activityLogs').insertOne({
              spaceId: new ObjectId(request.spaceId),
              shareLink: null,
              visitorEmail: uploaderEmail.trim(),
              performedBy: uploaderEmail.trim(),
              performedByRole: 'visitor',
              event: 'document_uploaded',
              documentId: docResult.insertedId,
              documentName: file.name,
              timestamp: new Date(),
              ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
              userAgent: req.headers.get('user-agent') || 'unknown',
              meta: {
                folderId: request.folderId || null,
                fileSize: buffer.length,
                fileType: ext,
                source: 'file_request',
                fileRequestId: request._id.toString(),
              }
            })

            console.log(`✅ [UPLOAD] File added to space ${request.spaceId}, folder ${request.folderId}, docId: ${spaceDocumentId}`)

          } catch (spaceError) {
            // Don't fail the whole upload if space sync fails — file is still on disk
            console.error('⚠️ [UPLOAD] Failed to sync to space (file saved to disk):', spaceError)
          }
        }

        return {
          _id: new ObjectId(),
          filename,
          originalName: file.name,
          size: file.size,
          uploadedAt: new Date(),
          uploadedBy: {
            name: uploaderName.trim(),
            email: uploaderEmail.trim()
          },
          // Space doc reference (null for general requests)
          spaceDocumentId,
        }
      })
    )

    // Update fileRequests collection
    await db.collection("fileRequests").updateOne(
      { _id: request._id },
      {
        $push: { uploadedFiles: { $each: uploadedFiles } } as any,
        $set: { updatedAt: new Date() }
      }
    )

    console.log('✅ [UPLOAD] Complete —', uploadedFiles.length, 'file(s) uploaded')
    if (isSpaceLinked) {
      console.log(`   📁 Also added to space "${request.spaceName}" / folder "${request.folderName || 'root'}"`)
    }

    return NextResponse.json({
      success: true,
      message: isSpaceLinked
        ? `Files uploaded and added to "${request.folderName || 'the space'}" in "${request.spaceName}"`
        : "Files uploaded successfully",
      filesUploaded: uploadedFiles.length,
      addedToSpace: isSpaceLinked,
      spaceName: request.spaceName || null,
      folderName: request.folderName || null,
    })

  } catch (error) {
    console.error("❌ [UPLOAD] Error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}