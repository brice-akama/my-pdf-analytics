// app/api/zapier/generate-key/route.ts
// No changes needed to your existing logic — but adding GET support
// so the dashboard can fetch the existing key without regenerating it.
import { NextRequest, NextResponse } from 'next/server'
import { verifyUserFromRequest } from '@/lib/auth'
import { clientPromise } from '@/app/api/lib/mongodb'
import crypto from 'crypto'

// GET: fetch existing key (so dashboard can show it again after page reload)
export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = await clientPromise
    const db = client.db()

    const existing = await db.collection('zapier_api_keys').findOne({
      userId: user.id,
      isActive: true,
    })

    if (existing) {
      return NextResponse.json({ apiKey: existing.apiKey, exists: true })
    }

    return NextResponse.json({ apiKey: null, exists: false })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: generate new key (or return existing one)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = await clientPromise
    const db = client.db()

    // Check if key already exists
    const existing = await db.collection('zapier_api_keys').findOne({
      userId: user.id,
      isActive: true,
    })

    if (existing) {
      return NextResponse.json({ apiKey: existing.apiKey })
    }

    // Generate new key
    const apiKey = `zap_${crypto.randomBytes(24).toString('hex')}`

    await db.collection('zapier_api_keys').insertOne({
      userId: user.id,
      userEmail: user.email,
      apiKey,
      isActive: true,
      createdAt: new Date(),
    })

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error('Generate key error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE: revoke key and generate a fresh one
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = await clientPromise
    const db = client.db()

    // Deactivate old key
    await db.collection('zapier_api_keys').updateMany(
      { userId: user.id },
      { $set: { isActive: false, revokedAt: new Date() } }
    )

    // Generate fresh key
    const apiKey = `zap_${crypto.randomBytes(24).toString('hex')}`

    await db.collection('zapier_api_keys').insertOne({
      userId: user.id,
      userEmail: user.email,
      apiKey,
      isActive: true,
      createdAt: new Date(),
    })

    return NextResponse.json({ apiKey, regenerated: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}