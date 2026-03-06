import { NextRequest, NextResponse } from 'next/server'
import { verifyUserFromRequest } from '@/lib/auth'
import { clientPromise } from '@/app/api/lib/mongodb'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = await clientPromise
    const db = client.db()

    // Check if key already exists for this user
    const existing = await db.collection('zapier_api_keys').findOne({
      userId: user.id,
      isActive: true
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
      createdAt: new Date()
    })

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error('Generate key error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}