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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, videoId } = await params
    const db = await dbPromise

    const video = await db.collection('document_videos').findOne({
      _id: new ObjectId(videoId),
      userId: user.id,
      documentId: id,
    })

    if (!video) {
      return NextResponse.json({ 
        error: 'Only the document owner can perform this action' 
      }, { status: 403 })
    }

    // Delete from Cloudinary
    if (video.cloudinaryPublicId) {
      await cloudinary.v2.uploader.destroy(video.cloudinaryPublicId, {
        resource_type: 'video'
      }).catch(() => {})
    }

    await db.collection('document_videos').deleteOne({ _id: new ObjectId(videoId) })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}