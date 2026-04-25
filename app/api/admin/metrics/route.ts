// app/api/admin/metrics/route.ts
//
// WHAT THIS FILE DOES:
//   Single endpoint that powers the owner overview dashboard.
//   Queries your real MongoDB collections in parallel and returns
//   everything the dashboard needs in one HTTP call.
//
// PROTECTION:
//   Uses the same auth_token + JWT_SECRET_KEY pattern your middleware uses
//   for /admin routes. If the cookie is missing or invalid → 401.
//
// COLLECTIONS QUERIED:
//   users, documents, signature_requests, file_requests,
//   viewer_identities, feedback, spaces, audit_log, support

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { dbPromise } from '@/app/api/lib/mongodb'

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'default_secret'
)

// ── Auth helper — mirrors your middleware exactly ──────────────
async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET)
    return payload
  } catch {
    return null
  }
}

// ── Date helpers ───────────────────────────────────────────────
function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfLastMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1)
}

function endOfLastMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999)
}

// ── Main handler ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    // ── 1. Auth check ──────────────────────────────────────────
    const adminToken =
      request.cookies.get('auth_token')?.value

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyAdminToken(adminToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired admin token' }, { status: 401 })
    }

    // ── 2. DB connection ───────────────────────────────────────
    const db = await dbPromise

    const now = new Date()
    const todayStart = startOfDay(now)
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfLastMonth(now)
    const lastMonthEnd = endOfLastMonth(now)
    const thirtyDaysAgo = daysAgo(30)
    const sevenDaysAgo = daysAgo(7)

    // ── 3. Run all queries in parallel ─────────────────────────
    const [
      // Users
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
      newUsersLastMonth,
      planBreakdown,
      recentUsers,
      trialUsers,

      // Documents
      totalDocuments,
      documentsThisMonth,

      // Storage — sum totalStorageUsedBytes across all users
      storageAgg,

      // Views
      totalViews,
      viewsThisMonth,

      // Signatures
      totalSignatures,
      signaturesThisMonth,

      // File requests
      totalFileRequests,

      // Spaces
      totalSpaces,

      // Feedback — from your /api/feedback route's collection
      recentFeedback,
      totalFeedback,

      // Support
      recentSupport,
      totalSupport,

      // Integrations — count users who have connected each integration
      slackConnected,
      hubspotConnected,
      googleDriveConnected,
      zapierConnected,
      gmailConnected,
      onedriveConnected,

      // Revenue (Paddle) — plan breakdown for MRR estimate
      activeSubscriptions,
      cancelledThisMonth,

      // Daily signups for sparkline (last 30 days)
      dailySignups,

    ] = await Promise.all([

      // ── Users ─────────────────────────────────────────────────
      db.collection('users').countDocuments(),
      db.collection('users').countDocuments({ created_at: { $gte: todayStart } }),
      db.collection('users').countDocuments({ created_at: { $gte: thisMonthStart } }),
      db.collection('users').countDocuments({ created_at: { $gte: lastMonthStart, $lte: lastMonthEnd } }),

      // Plan breakdown — group by plan field
      db.collection('users').aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),

      // 10 most recent signups with fields we need for the dashboard
      db.collection('users').find(
        {},
        {
          projection: {
            email: 1,
            'profile.fullName': 1,
            'profile.avatarUrl': 1,
            plan: 1,
            subscriptionStatus: 1,
            created_at: 1,
            lastLoginAt: 1,
          },
        }
      ).sort({ created_at: -1 }).limit(10).toArray(),

      // Trial users expiring in the next 3 days
      db.collection('users').countDocuments({
        subscriptionStatus: 'trialing',
        trialEndsAt: { $gte: now, $lte: new Date(now.getTime() + 3 * 86400000) },
      }),

      // ── Documents ─────────────────────────────────────────────
      db.collection('documents').countDocuments(),
      db.collection('documents').countDocuments({ createdAt: { $gte: thisMonthStart } }),

      // ── Storage ───────────────────────────────────────────────
      db.collection('users').aggregate([
        { $group: { _id: null, total: { $sum: '$totalStorageUsedBytes' } } },
      ]).toArray(),

      // ── Views (viewer_identities has one doc per unique viewer per doc) ──
      db.collection('viewer_identities').countDocuments(),
      db.collection('viewer_identities').countDocuments({
        createdAt: { $gte: thisMonthStart },
      }),

      // ── Signatures ────────────────────────────────────────────
      db.collection('signature_requests').countDocuments({ status: 'signed' }),
db.collection('signature_requests').countDocuments({
  status: 'signed',
  signedAt: { $gte: thisMonthStart },
}),

      // ── File requests ─────────────────────────────────────────
      db.collection('fileRequests').countDocuments(),

      // ── Spaces ────────────────────────────────────────────────
      db.collection('spaces').countDocuments(),

      // ── Feedback ──────────────────────────────────────────────
      db.collection('feedback').find(
  {},
  { projection: { feedback: 1, email: 1, createdAt: 1, type: 1 } }
).sort({ createdAt: -1 }).limit(8).toArray(),

db.collection('feedback').countDocuments(),

      // ── Support ───────────────────────────────────────────────
      db.collection('support_tickets').find(
  {},
  { projection: { subject: 1, email: 1, createdAt: 1, status: 1, message: 1 } }
).sort({ createdAt: -1 }).limit(8).toArray(),

db.collection('support_tickets').countDocuments(),

      // ── Integrations — count users with each connected ────────
      // Your signup route stores integration tokens on the user doc.
      // We look for a non-null field that indicates connection.
     // ── Integrations — query the integrations collection directly ──
db.collection('integrations').countDocuments({ provider: 'slack',        isActive: true }),
db.collection('integrations').countDocuments({ provider: 'hubspot',      isActive: true }),
db.collection('integrations').countDocuments({ provider: 'google-drive', isActive: true }),
db.collection('integrations').countDocuments({ provider: 'zapier',       isActive: true }),
db.collection('integrations').countDocuments({ provider: 'gmail',        isActive: true }),
db.collection('integrations').countDocuments({ provider: 'onedrive',     isActive: true }),

      // ── Revenue — active Paddle subscriptions ─────────────────
      db.collection('users').countDocuments({ subscriptionStatus: 'active' }),
      db.collection('users').countDocuments({
        subscriptionStatus: 'canceled',
        updated_at: { $gte: thisMonthStart },
      }),

      // ── Daily signups sparkline — last 30 days ────────────────
      db.collection('users').aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray(),

    ])

    // ── 4. Shape the plan breakdown ────────────────────────────
    const planMap: Record<string, number> = {}
    for (const p of planBreakdown) {
      planMap[p._id || 'unknown'] = p.count
    }

    // ── 5. Estimate MRR from active subscriptions + plan prices ─
    // These are your Paddle plan prices — update if they change
    const PLAN_PRICES: Record<string, number> = {
      starter: 9,
      pro: 29,
      business: 79,
    }

    // Count active users per plan for MRR estimate
    const [starterActive, proActive, businessActive] = await Promise.all([
      db.collection('users').countDocuments({ plan: 'starter', subscriptionStatus: 'active' }),
      db.collection('users').countDocuments({ plan: 'pro', subscriptionStatus: 'active' }),
      db.collection('users').countDocuments({ plan: 'business', subscriptionStatus: 'active' }),
    ])

    const estimatedMRR =
      starterActive * PLAN_PRICES.starter +
      proActive * PLAN_PRICES.pro +
      businessActive * PLAN_PRICES.business

    // ── 6. Storage formatting helper (bytes → human readable) ───
    const totalStorageBytes = storageAgg[0]?.total || 0

    // ── 7. Normalize recent users for the frontend ─────────────
    const normalizedUsers = recentUsers.map((u) => ({
      id: u._id?.toString(),
      email: u.email,
      name: u.profile?.fullName || u.email?.split('@')[0] || 'Unknown',
      avatarUrl: u.profile?.avatarUrl || null,
      plan: u.plan || 'free',
      subscriptionStatus: u.subscriptionStatus || 'inactive',
      createdAt: u.created_at,
      lastLoginAt: u.lastLoginAt || null,
    }))

    // ── 8. Fill sparkline gaps (days with 0 signups) ───────────
    const signupMap: Record<string, number> = {}
    for (const d of dailySignups) {
      signupMap[d._id] = d.count
    }
    const sparkline: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i)
      const key = d.toISOString().slice(0, 10)
      sparkline.push({ date: key, count: signupMap[key] || 0 })
    }

    // ── 9. Build and return the response ──────────────────────
    return NextResponse.json({
      // KPI cards
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
        newLastMonth: newUsersLastMonth,
        trialExpiringSoon: trialUsers,
        byPlan: planMap,
        recent: normalizedUsers,
      },
      documents: {
        total: totalDocuments,
        thisMonth: documentsThisMonth,
      },
      views: {
        total: totalViews,
        thisMonth: viewsThisMonth,
      },
      signatures: {
        completed: totalSignatures,
        thisMonth: signaturesThisMonth,
      },
      fileRequests: {
        total: totalFileRequests,
      },
      spaces: {
        total: totalSpaces,
      },
      storage: {
        totalBytes: totalStorageBytes,
        // Formatted versions for display
        totalGB: parseFloat((totalStorageBytes / 1073741824).toFixed(2)),
      },
      revenue: {
        estimatedMRR,
        activeSubscriptions,
        cancelledThisMonth,
        byPlan: {
          starter: starterActive,
          pro: proActive,
          business: businessActive,
        },
      },
      integrations: {
        slack: slackConnected,
        hubspot: hubspotConnected,
        googleDrive: googleDriveConnected,
        zapier: zapierConnected,
        gmail: gmailConnected,
        onedrive: onedriveConnected,
      },
      feedback: {
        total: totalFeedback,
        recent: recentFeedback.map((f) => ({
          id: f._id?.toString(),
          message: f.message,
          email: f.email,
          type: f.type || 'general',
          createdAt: f.createdAt,
        })),
      },
      support: {
        total: totalSupport,
        recent: recentSupport.map((s) => ({
          id: s._id?.toString(),
          subject: s.subject,
          email: s.email,
          status: s.status || 'open',
          createdAt: s.createdAt,
        })),
      },
      sparkline,
      generatedAt: now.toISOString(),
    })

  } catch (error: any) {
    console.error('Admin metrics error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}