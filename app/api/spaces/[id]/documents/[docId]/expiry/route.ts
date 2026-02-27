import { NextRequest, NextResponse } from 'next/server'
import { verifyUserFromRequest } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { dbPromise } from '@/app/api/lib/mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: spaceId, docId } = await params
    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { expiresAt } = await request.json()

    const db = await dbPromise

    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) })
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 })

    const isOwnerOrAdmin =
      space.userId === user.id ||
      space.members?.some((m: any) => m.email === user.email && ['owner', 'admin', 'editor'].includes(m.role))

    if (!isOwnerOrAdmin) return NextResponse.json({ error: 'Permission denied' }, { status: 403 })

    await db.collection('documents').updateOne(
      { _id: new ObjectId(docId), spaceId: spaceId },
      {
        $set: {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: expiresAt ? `Document expires on ${new Date(expiresAt).toLocaleDateString()}` : 'Expiry removed'
    })
  } catch (error) {
    console.error('Set expiry error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}