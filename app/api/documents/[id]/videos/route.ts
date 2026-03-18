import { NextRequest, NextResponse } from 'next/server'
import { verifyUserFromRequest } from '@/lib/auth'
import { dbPromise } from '@/app/api/lib/mongodb'
import { ObjectId } from 'mongodb'
import cloudinary from 'cloudinary'

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

// GET — fetch all videos for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const db = await dbPromise

    const videos = await db.collection('document_videos')
      .find({ documentId: id, userId: user.id })
      .sort({ pageNumber: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      videos: videos.map(v => ({ ...v, _id: v._id.toString() }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}

// POST — upload and save a new video
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const db = await dbPromise

    // Verify document ownership
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      userId: user.id,
    })
    if (!document) {
      return NextResponse.json({ 
        error: 'Only the document owner can perform this action' 
      }, { status: 403 })
    }

    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const pageNumber = parseInt(formData.get('pageNumber') as string)
    const duration = parseInt(formData.get('duration') as string)
    const title = formData.get('title') as string

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    // Delete existing video for this page if any
    const existing = await db.collection('document_videos').findOne({
      documentId: id,
      userId: user.id,
      pageNumber,
    })
    if (existing?.cloudinaryPublicId) {
      await cloudinary.v2.uploader.destroy(existing.cloudinaryPublicId, {
        resource_type: 'video'
      }).catch(() => {})
      await db.collection('document_videos').deleteOne({ _id: existing._id })
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await videoFile.arrayBuffer())
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: `users/${user.id}/videos/${id}`,
          resource_type: 'video',
          public_id: `page-${pageNumber}-${Date.now()}`,
          eager: [{ width: 400, height: 300, crop: 'fill', format: 'jpg' }],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      stream.end(buffer)
    })

    // Save to database
    const videoDoc = {
      documentId: id,
      userId: user.id,
      pageNumber,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      thumbnail: uploadResult.eager?.[0]?.secure_url || '',
      duration,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('document_videos').insertOne(videoDoc)

    return NextResponse.json({
      success: true,
      video: { ...videoDoc, _id: result.insertedId.toString() }
    }, { status: 201 })

  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json({ error: 'Failed to save video' }, { status: 500 })
  }
}