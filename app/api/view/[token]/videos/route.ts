import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const db = await dbPromise

    // Find the share to get documentId
    const share = await db.collection('shares').findOne({ shareToken: token })
    if (!share) {
      return NextResponse.json({ success: false }, { status: 404 })
    }

    const documentId = share.documentId.toString()

    const videos = await db.collection('document_videos')
      .find({ documentId })
      .sort({ pageNumber: 1 })
      .project({ cloudinaryUrl: 1, pageNumber: 1, duration: 1, _id: 0 })
      .toArray()

    return NextResponse.json({ success: true, videos })
  } catch (error) {
    return NextResponse.json({ success: false, videos: [] })
  }
}