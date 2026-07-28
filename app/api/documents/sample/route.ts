// app/api/documents/sample/route.ts
//
// GET — returns the current user's sample document, creating it on the
// spot if it doesn't exist yet (covers both new signups where creation
// may still be in flight, and existing users who signed up before this
// feature shipped).

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { dbPromise } from '@/app/api/lib/mongodb'
import { createSampleDocumentForUser } from '@/lib/sampleDocument'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get('auth-token')?.value || req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const userId = decoded.userId || decoded.id
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    const db = await dbPromise
    const { ObjectId } = await import('mongodb')

    let user: any
    try {
      user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    } catch {
      user = await db.collection('users').findOne({ id: userId })
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userIdForQuery = user.id || user._id?.toString()
    const profile = await db
      .collection('profiles')
      .findOne({ user_id: userIdForQuery })
      .catch(() => null)
    const organizationId = profile?.organization_id || userIdForQuery

    const documentId = await createSampleDocumentForUser(db, {
      userId: userIdForQuery,
      plan: user.plan || 'free',
      organizationId,
    })

    if (!documentId) {
      return NextResponse.json(
        { error: 'Sample document is not available right now' },
        { status: 503 }
      )
    }

    return NextResponse.json({ success: true, documentId })
  } catch (error) {
    console.error('❌ Sample document route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}