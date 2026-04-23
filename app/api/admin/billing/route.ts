// app/api/admin/billing/route.ts
//
// WHAT THIS FILE DOES:
//   Returns platform-wide billing and revenue data for the owner dashboard.
//   Queries the users collection directly — no Paddle API call needed since
//   your webhook handler already keeps billing fields in sync on every event.
//
// PROTECTION:
//   Same auth_token + JWT_SECRET_KEY pattern as all other admin routes.

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

// Your Paddle plan prices — update if they change
const PLAN_PRICES: Record<string, number> = {
  starter:  9,
  pro:      29,
  business: 79,
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfLastMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1)
}

function endOfLastMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999)
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(request: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const db = await dbPromise
    const now = new Date()
    const thisMonthStart  = startOfMonth(now)
    const lastMonthStart  = startOfLastMonth(now)
    const lastMonthEnd    = endOfLastMonth(now)
    const thirtyDaysAgo   = daysAgo(30)

    const [
      // Subscription status counts
      activeCount,
      trialingCount,
      canceledCount,
      pastDueCount,
      inactiveCount,

      // Plan counts (active only — for MRR)
      starterActive,
      proActive,
      businessActive,

      // Monthly movements
      newThisMonth,
      canceledThisMonth,
      newLastMonth,
      canceledLastMonth,

      // Past due users (need attention)
      pastDueUsers,

      // Trialing — expiring soon (next 7 days)
      expiringSoon,

      // Recent subscribers (last 30 days, paid only)
      recentSubscribers,

      // Canceled this month — with details
      recentCancellations,

      // MRR over last 30 days — approximate from created_at
      // (Real MRR history needs a separate events table; this is a good enough estimate)
      dailyNewSubs,

      // Billing cycle breakdown
      monthlyCount,
      yearlyCount,

    ] = await Promise.all([

      db.collection('users').countDocuments({ subscriptionStatus: 'active' }),
      db.collection('users').countDocuments({ subscriptionStatus: 'trialing' }),
      db.collection('users').countDocuments({ subscriptionStatus: 'canceled' }),
      db.collection('users').countDocuments({ subscriptionStatus: 'past_due' }),
      db.collection('users').countDocuments({ subscriptionStatus: 'inactive' }),

      db.collection('users').countDocuments({ plan: 'starter',  subscriptionStatus: 'active' }),
      db.collection('users').countDocuments({ plan: 'pro',      subscriptionStatus: 'active' }),
      db.collection('users').countDocuments({ plan: 'business', subscriptionStatus: 'active' }),

      // New paid subscriptions this month (active, started this month)
      db.collection('users').countDocuments({
        subscriptionStatus: 'active',
        updated_at: { $gte: thisMonthStart },
      }),
      // Canceled this month
      db.collection('users').countDocuments({
        subscriptionStatus: 'canceled',
        updated_at: { $gte: thisMonthStart },
      }),
      // Last month — for growth comparison
      db.collection('users').countDocuments({
        subscriptionStatus: 'active',
        updated_at: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }),
      db.collection('users').countDocuments({
        subscriptionStatus: 'canceled',
        updated_at: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }),

      // Past due — list them so you can act
      db.collection('users').find(
        { subscriptionStatus: 'past_due' },
        { projection: {
            email: 1,
            'profile.fullName': 1,
            'profile.avatarUrl': 1,
            plan: 1,
            billingCycle: 1,
            currentPeriodEnd: 1,
            paddleCustomerId: 1,
            updated_at: 1,
        }},
      ).sort({ updated_at: -1 }).limit(20).toArray(),

      // Trialing users expiring in next 7 days
      db.collection('users').find(
        {
          subscriptionStatus: 'trialing',
          trialEndsAt: { $gte: now, $lte: new Date(now.getTime() + 7 * 86400000) },
        },
        { projection: {
            email: 1,
            'profile.fullName': 1,
            plan: 1,
            trialEndsAt: 1,
            created_at: 1,
        }},
      ).sort({ trialEndsAt: 1 }).limit(20).toArray(),

      // Recent paid subscribers
      db.collection('users').find(
        {
          subscriptionStatus: 'active',
          updated_at: { $gte: thirtyDaysAgo },
        },
        { projection: {
            email: 1,
            'profile.fullName': 1,
            'profile.avatarUrl': 1,
            plan: 1,
            billingCycle: 1,
            currentPeriodEnd: 1,
            updated_at: 1,
        }},
      ).sort({ updated_at: -1 }).limit(15).toArray(),

      // Recent cancellations
      db.collection('users').find(
        {
          subscriptionStatus: 'canceled',
          updated_at: { $gte: thirtyDaysAgo },
        },
        { projection: {
            email: 1,
            'profile.fullName': 1,
            plan: 1,
            billingCycle: 1,
            currentPeriodEnd: 1,
            updated_at: 1,
        }},
      ).sort({ updated_at: -1 }).limit(15).toArray(),

      // Daily new active subs for sparkline (last 30 days)
      db.collection('users').aggregate([
        {
          $match: {
            subscriptionStatus: 'active',
            updated_at: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$updated_at' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray(),

      db.collection('users').countDocuments({ subscriptionStatus: 'active', billingCycle: 'monthly' }),
      db.collection('users').countDocuments({ subscriptionStatus: 'active', billingCycle: 'yearly' }),

    ])

    // ── Compute MRR ────────────────────────────────────────────
    const estimatedMRR =
      starterActive  * PLAN_PRICES.starter +
      proActive      * PLAN_PRICES.pro +
      businessActive * PLAN_PRICES.business

    const lastMonthMRR = newLastMonth * PLAN_PRICES.pro // rough estimate
    const mrrGrowth = lastMonthMRR > 0
      ? Math.round(((estimatedMRR - lastMonthMRR) / lastMonthMRR) * 100)
      : 0

    // ── Churn rate = canceled / (active + canceled) ────────────
    const churnRate = (activeCount + canceledCount) > 0
      ? parseFloat(((canceledCount / (activeCount + canceledCount)) * 100).toFixed(1))
      : 0

    // ── Zero-fill daily sparkline ──────────────────────────────
    const sparkMap: Record<string, number> = {}
    for (const d of dailyNewSubs) sparkMap[d._id as string] = d.count as number
    const revenueSparkline = []
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i)
      const key = d.toISOString().slice(0, 10)
      revenueSparkline.push({ date: key, count: sparkMap[key] || 0 })
    }

    // ── Normalize user lists ───────────────────────────────────
    function normalizeUser(u: any) {
      return {
        id: u._id?.toString(),
        email: u.email,
        name: u.profile?.fullName || u.email?.split('@')[0] || 'Unknown',
        avatarUrl: u.profile?.avatarUrl || null,
        plan: u.plan || 'free',
        billingCycle: u.billingCycle || null,
        currentPeriodEnd: u.currentPeriodEnd || null,
        trialEndsAt: u.trialEndsAt || null,
        paddleCustomerId: u.paddleCustomerId || null,
        updatedAt: u.updated_at,
        createdAt: u.created_at,
      }
    }

    return NextResponse.json({
      // ── Top-level KPIs ────────────────────────────────────────
      mrr: {
        estimated: estimatedMRR,
        growthPercent: mrrGrowth,
        byPlan: {
          starter:  { count: starterActive,  revenue: starterActive  * PLAN_PRICES.starter },
          pro:      { count: proActive,       revenue: proActive      * PLAN_PRICES.pro },
          business: { count: businessActive,  revenue: businessActive * PLAN_PRICES.business },
        },
      },

      subscriptions: {
        active:   activeCount,
        trialing: trialingCount,
        canceled: canceledCount,
        pastDue:  pastDueCount,
        inactive: inactiveCount,
        newThisMonth,
        canceledThisMonth,
        newLastMonth,
        canceledLastMonth,
        churnRate,
        monthlyBilling: monthlyCount,
        yearlyBilling:  yearlyCount,
      },

      // ── Lists ─────────────────────────────────────────────────
      pastDueUsers:       pastDueUsers.map(normalizeUser),
      expiringSoon:       expiringSoon.map(normalizeUser),
      recentSubscribers:  recentSubscribers.map(normalizeUser),
      recentCancellations: recentCancellations.map(normalizeUser),

      // ── Sparkline ─────────────────────────────────────────────
      revenueSparkline,

      generatedAt: now.toISOString(),
    })

  } catch (error: any) {
    console.error('Admin billing error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}