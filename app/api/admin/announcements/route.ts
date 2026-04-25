// app/api/admin/announcements/route.ts
//
// WHAT THIS FILE DOES:
//   GET  — returns all announcements (for the admin page)
//   POST — creates a new announcement (banner or email blast)
//
// COLLECTION: announcements
//   Each document has:
//     title         — short headline shown in banner or email subject
//     message       — body text
//     type          — "info" | "warning" | "success" | "maintenance"
//     target        — "banner" | "email" | "both"
//     active        — boolean, controls whether banner shows in user dashboard
//     sentAt        — Date | null, set when email is sent
//     recipientCount— number, how many users received the email
//     expiresAt     — Date | null, banner auto-hides after this date
//     createdAt     — Date
//     createdBy     — string (admin identifier)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { dbPromise } from '@/app/api/lib/mongodb'

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

// ── GET — list all announcements ───────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const db = await dbPromise
    const announcements = await db
      .collection('announcements')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      data: announcements.map(a => ({
        id: a._id.toString(),
        title: a.title,
        message: a.message,
        type: a.type || 'info',
        target: a.target || 'banner',
        active: a.active || false,
        sentAt: a.sentAt || null,
        recipientCount: a.recipientCount || 0,
        expiresAt: a.expiresAt || null,
        createdAt: a.createdAt,
      })),
      total: announcements.length,
    })
  } catch (error: any) {
    console.error('Admin announcements GET error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST — create new announcement ────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const adminPayload = await verifyAdminToken(adminToken)
    if (!adminPayload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    const { title, message, type, target, expiresAt } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    const validTypes   = ['info', 'warning', 'success', 'maintenance']
    const validTargets = ['banner', 'email', 'both']

    if (type && !validTypes.includes(type))     return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    if (target && !validTargets.includes(target)) return NextResponse.json({ error: 'Invalid target' }, { status: 400 })

    const db = await dbPromise
    const now = new Date()

    const doc = {
      title:          title.trim(),
      message:        message.trim(),
      type:           type || 'info',
      target:         target || 'banner',
      active:         false,       // admin must explicitly activate
      sentAt:         null,
      recipientCount: 0,
      expiresAt:      expiresAt ? new Date(expiresAt) : null,
      createdAt:      now,
      updatedAt:      now,
      createdBy:      String(adminPayload.email || adminPayload.userId || 'admin'),
    }

    const result = await db.collection('announcements').insertOne(doc)

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      announcement: { ...doc, id: result.insertedId.toString() },
    })

  } catch (error: any) {
    console.error('Admin announcements POST error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}