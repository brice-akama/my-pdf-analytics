// app/api/admin/feedback/route.ts
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

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit  = Math.min(50,  parseInt(searchParams.get('limit') || '20'))
    const type   = searchParams.get('type')   || ''
    const status = searchParams.get('status') || ''

    const query: any = {}
    if (type)   query.type   = type
    if (status) query.status = status

    const db = await dbPromise

    const [items, total, newCount] = await Promise.all([
      db.collection('feedback')
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      db.collection('feedback').countDocuments(query),
      db.collection('feedback').countDocuments({ status: 'new' }),
    ])

    return NextResponse.json({
      data: items.map(f => ({
        id:        f._id.toString(),
        email:     f.email,
        feedback:  f.feedback,
        type:      f.type   || 'general',
        status:    f.status || 'new',
        createdAt: f.createdAt,
      })),
      total,
      newCount,
      page,
      totalPages: Math.ceil(total / limit),
    })

  } catch (error: any) {
    console.error('Admin feedback GET error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => null)
    if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const db = await dbPromise
    await db.collection('feedback').updateOne(
      { _id: new ObjectId(body.id) },
      { $set: { status: body.status || 'read', updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Admin feedback PATCH error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}