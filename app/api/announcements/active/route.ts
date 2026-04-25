// app/api/announcements/active/route.ts
//
// WHAT THIS FILE DOES:
//   Public route your USER dashboard calls to check for active banners.
//   Returns only active announcements that haven't expired.
//   No admin auth needed — any logged-in user can call this.
//
// HOW TO USE IN USER DASHBOARD:
//   fetch('/api/announcements/active')
//   → returns { banners: [{ id, title, message, type }] }
//   → if banners.length > 0, show the banner at top of dashboard

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const db = await dbPromise
    const now = new Date()

    // Only return banners — not email-only announcements
    const banners = await db.collection('announcements').find({
      active: true,
      target: { $in: ['banner', 'both'] },
      $or: [
        { expiresAt: null },
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } },
      ],
    }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      banners: banners.map(b => ({
        id: b._id.toString(),
        title: b.title,
        message: b.message,
        type: b.type || 'info',
        createdAt: b.createdAt,
      })),
    })

  } catch (error: any) {
    console.error('Active announcements error:', error?.message)
    // Return empty on error — never break the user dashboard
    return NextResponse.json({ banners: [] })
  }
}