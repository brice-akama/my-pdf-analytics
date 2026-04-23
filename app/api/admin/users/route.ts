// app/api/admin/users/route.ts
//
// WHAT THIS FILE DOES:
//   Paginated, searchable, filterable list of ALL users on the platform.
//   Powers the User Management page in the owner dashboard.
//
// PROTECTION:
//   Same auth_token + JWT_SECRET_KEY pattern as your middleware /admin routes.
//
// QUERY PARAMS:
//   page        — page number (default 1)
//   limit       — results per page (default 20)
//   search      — searches email and profile.fullName
//   plan        — filter by plan: free | pro | starter | business
//   status      — filter by subscriptionStatus: trialing | active | canceled | past_due | inactive
//   sort        — field to sort by (default: created_at)
//   order       — asc | desc (default: desc)

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

export async function GET(request: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifyAdminToken(adminToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired admin token' }, { status: 401 })
    }

    // ── Parse params ───────────────────────────────────────────
    const { searchParams } = new URL(request.url)
    const page    = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit   = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const search  = searchParams.get('search')  || ''
    const plan    = searchParams.get('plan')    || ''
    const status  = searchParams.get('status')  || ''
    const sort    = searchParams.get('sort')    || 'created_at'
    const order   = searchParams.get('order')   === 'asc' ? 1 : -1

    // ── Build query ────────────────────────────────────────────
    const query: any = {}

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.fullName': { $regex: search, $options: 'i' } },
        { 'profile.companyName': { $regex: search, $options: 'i' } },
      ]
    }

    if (plan)   query.plan = plan
    if (status) query.subscriptionStatus = status

    // ── DB ─────────────────────────────────────────────────────
    const db = await dbPromise
    const collection = db.collection('users')

    const [users, total] = await Promise.all([
      collection
        .find(query, {
          projection: {
            passwordHash: 0, // Never expose password hash
          },
        })
        .sort({ [sort]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ])

    // ── Get document count per user in one aggregation ─────────
    const userIds = users.map(u => u._id.toString())
    const docCounts = await db.collection('documents').aggregate([
      { $match: { userId: { $in: userIds }, archived: { $ne: true } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]).toArray()

    const docCountMap: Record<string, number> = {}
    for (const d of docCounts) {
      docCountMap[d._id] = d.count
    }

    // ── Normalize ──────────────────────────────────────────────
    const normalized = users.map(u => ({
      id: u._id.toString(),
      email: u.email,
      name: u.profile?.fullName || u.email?.split('@')[0] || 'Unknown',
      avatarUrl: u.profile?.avatarUrl || null,
      companyName: u.profile?.companyName || null,
      plan: u.plan || 'free',
      subscriptionStatus: u.subscriptionStatus || 'inactive',
      billingCycle: u.billingCycle || null,
      trialEndsAt: u.trialEndsAt || null,
      currentPeriodEnd: u.currentPeriodEnd || null,
      provider: u.provider || 'local',
      emailVerified: u.email_verified || false,
      industry: u.industry || null,
      companySize: u.companySize || null,
      useCases: u.useCases || [],
      totalStorageBytes: u.totalStorageUsedBytes || 0,
      totalStorageGB: parseFloat(((u.totalStorageUsedBytes || 0) / 1073741824).toFixed(3)),
      documentCount: docCountMap[u._id.toString()] || 0,
      paddleCustomerId: u.paddleCustomerId || null,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      lastLoginAt: u.lastLoginAt || null,
    }))

    return NextResponse.json({
      data: normalized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })

  } catch (error: any) {
    console.error('Admin users list error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}