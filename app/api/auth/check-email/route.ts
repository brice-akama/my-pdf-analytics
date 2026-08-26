export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '../../lib/mongodb'
import { sanitizeInput, isValidEmail, getClientIP, checkRateLimit } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)

    // Separate, generous limit — this fires on every step-1 attempt,
    // not just successful signups, so it needs more headroom than
    // the signup rate limit itself.
    const rateLimitExceeded = checkRateLimit(`check-email:${clientIP}`, 20, 3600000)
    if (rateLimitExceeded) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    const email = sanitizeInput(body?.email || '').toLowerCase()

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const db = await dbPromise
    const existing = await db.collection('profiles').findOne(
      { email },
      { projection: { _id: 1 } } // never return anything but existence
    )

    return NextResponse.json({ available: !existing })
  } catch (error) {
    console.error('check-email error:', error)
    // Fail open on the "available" question — don't block signup
    // over a transient error here; real duplicate check still
    // happens again at actual signup submission regardless.
    return NextResponse.json({ available: true })
  }
}