// app/api/admin/announcements/[id]/route.ts
//
// PATCH — toggle active, update fields
// DELETE — remove announcement

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { dbPromise } from '@/app/api/lib/mongodb'
import { ObjectId } from 'mongodb'

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'default_secret'
)

async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    const db = await dbPromise
    const allowed = ['title', 'message', 'type', 'target', 'active', 'expiresAt', 'sentAt', 'recipientCount']
    const update: any = { updatedAt: new Date() }

    for (const field of allowed) {
      if (body[field] !== undefined) {
        update[field] = field === 'expiresAt' && body[field]
          ? new Date(body[field])
          : body[field]
      }
    }

    const result = await db.collection('announcements').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, updated: update })

  } catch (error: any) {
    console.error('Announcements PATCH error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const db = await dbPromise

    const result = await db.collection('announcements').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Announcements DELETE error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}