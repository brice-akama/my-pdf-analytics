import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'

// Public route — no auth required
// Used by signing page and viewer page to fetch videos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await dbPromise

    const videos = await db.collection('document_videos')
      .find({ documentId: id })
      .sort({ pageNumber: 1 })
      .project({ cloudinaryUrl: 1, pageNumber: 1, duration: 1, _id: 0 })
      .toArray()

    return NextResponse.json({ success: true, videos })
  } catch (error) {
    return NextResponse.json({ success: false, videos: [] })
  }
}