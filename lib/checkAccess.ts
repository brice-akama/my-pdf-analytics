// lib/checkAccess.ts
//
// WHAT THIS FILE DOES:
//   A reusable helper that every API route calls at the top to:
//     1. Verify the user is authenticated (reads JWT from cookie)
//     2. Fetch the user document from MongoDB
//     3. Compute the user's EFFECTIVE plan right now
//     4. Auto-downgrade expired users in the DB (lazy, no cron job needed)
//     5. Return everything the route needs to enforce limits
//
// HOW TO USE IT IN ANY API ROUTE:
//
//   import { checkAccess } from '@/lib/checkAccess'
//   import { hasFeature, isStorageAvailable } from '@/lib/planLimits'
//
//   export async function POST(request: NextRequest) {
//     const access = await checkAccess(request)
//     if (!access.ok) return access.response  // returns 401/403 automatically
//
//     // access.userId    — the authenticated user's ID string
//     // access.user      — the full user document from MongoDB
//     // access.plan      — "free" | "starter" | "pro" | "business"
//     //                    THIS IS THE EFFECTIVE PLAN — already accounts for
//     //                    expired trials and ended cancellations
//     // access.limits    — the PlanLimit object for their effective plan
//     // access.hasActiveSubscription — true if they can use paid features
//
//     if (!hasFeature(access.plan, 'bulkSend')) {
//       return NextResponse.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
//     }
//   }
//
// AUTO-DOWNGRADE (no cron job):
//   When getEffectivePlan() determines a user should be on "free" because their
//   trial expired or their canceled period ended, but their MongoDB document
//   still says "pro" — syncPlanIfExpired() writes the downgrade to the database
//   immediately, in the background, without blocking the response.
//
//   This means users are downgraded at the exact moment they next use the app
//   after their expiry date. No scheduled job needed. No 2am batch. The
//   downgrade happens lazily, precisely when it matters.
//
//   The write only happens ONCE per user — after the first write, the stored
//   plan already equals "free" and there is nothing to update on future requests.

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { dbPromise } from '@/app/api/lib/mongodb'
import { getPlanLimits, type PlanLimit } from '@/lib/planLimits'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// ─────────────────────────────────────────────────────────────────────────────
// RETURN TYPE
// ─────────────────────────────────────────────────────────────────────────────
export type AccessResult =
  | {
      ok: true
      userId: string
      user: any
      plan: string
      limits: PlanLimit
      hasActiveSubscription: boolean
    }
  | {
      ok: false
      response: NextResponse
    }

// ─────────────────────────────────────────────────────────────────────────────
// hasValidSubscription
//
// Returns true if the user currently has valid access to their plan features.
// This is the single function that determines whether a user is "in" or "out".
//
// Valid access = ANY of:
//   - status "active"                                   → paying, all good
//   - status "trialing" AND trialEndsAt > now           → still in trial
//   - status "canceled" AND currentPeriodEnd > now      → paid period not over
//   - status "past_due" AND currentPeriodEnd > now      → payment failing but
//                                                         Paddle retrying
//
// Everything else = no valid access → effective plan is "free"
// ─────────────────────────────────────────────────────────────────────────────
export function hasValidSubscription(user: any): boolean {
  const status = user?.subscriptionStatus || 'inactive'
  const now = new Date()

  switch (status) {
    case 'active':
      return true

    case 'trialing': {
      const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null
      return trialEnd !== null && trialEnd > now
    }

    case 'canceled': {
      const periodEnd = user.currentPeriodEnd
        ? new Date(user.currentPeriodEnd)
        : null
      return periodEnd !== null && periodEnd > now
    }

    case 'past_due': {
      const periodEnd = user.currentPeriodEnd
        ? new Date(user.currentPeriodEnd)
        : null
      return periodEnd !== null && periodEnd > now
    }

    case 'inactive':
    default:
      return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getEffectivePlan
//
// Returns the plan the user should be treated as having RIGHT NOW.
//
// If their subscription is valid → use the stored plan (pro, starter, etc)
// If their subscription expired  → return "free" regardless of stored plan
//
// This is purely a computation — it does not touch the database.
// The database write happens in syncPlanIfExpired below.
// ─────────────────────────────────────────────────────────────────────────────
export function getEffectivePlan(user: any): string {
  if (hasValidSubscription(user)) {
    return user.plan || 'free'
  }
  return 'free'
}

// ─────────────────────────────────────────────────────────────────────────────
// syncPlanIfExpired
//
// THE LAZY AUTO-DOWNGRADE — this replaces the need for a cron job.
//
// HOW IT WORKS:
//   After we compute the effective plan, we compare it to what is stored in
//   MongoDB. If they differ (e.g. stored says "pro" but effective is "free"),
//   we write the downgrade to MongoDB right now, in the background.
//
// WHY "IN THE BACKGROUND" (non-blocking):
//   We do NOT await this function in checkAccess. We fire it and forget.
//   This means the downgrade write does not add any latency to the API
//   response. The user gets their response in the same time as always.
//   The write completes a few milliseconds later.
//
//   Is there a risk the write fails? Yes, rarely (DB timeout, network blip).
//   If it fails, the next request will try again. The worst case is the
//   user stays on "pro" in the DB for one more request, but they are already
//   getting free plan limits in the API response because getEffectivePlan()
//   runs before this write. Data-wise they cannot abuse anything.
//
// WHY ONLY ONCE:
//   After the first successful write, the stored plan equals "free".
//   On the next request, effectivePlan ("free") === storedPlan ("free"),
//   so this function does nothing. Zero unnecessary writes.
//
// WHAT TRIGGERS A DOWNGRADE:
//   - Trial expired (subscriptionStatus: "trialing", trialEndsAt < now)
//   - Canceled period ended (subscriptionStatus: "canceled", currentPeriodEnd < now)
//   - Status is "inactive" but plan is not "free" (data inconsistency cleanup)
// ─────────────────────────────────────────────────────────────────────────────
async function syncPlanIfExpired(
  db: any,
  user: any,
  effectivePlan: string
): Promise<void> {
  // If the computed effective plan matches what is stored, nothing to do
  const storedPlan = user.plan || 'free'
  const storedStatus = user.subscriptionStatus || 'inactive'

  const needsDowngrade =
    effectivePlan === 'free' &&
    (storedPlan !== 'free' || storedStatus === 'trialing' || storedStatus === 'canceled')

  if (!needsDowngrade) return

  // Determine WHY we are downgrading — for the log message
  const reason =
    storedStatus === 'trialing'
      ? 'trial expired'
      : storedStatus === 'canceled'
      ? 'canceled period ended'
      : 'subscription inactive'

  console.log(
    `🔄 Auto-downgrade: user ${user.email} (${reason}) → plan: free, status: inactive`
  )

  const now = new Date()

  try {
    // Update the users collection
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          plan: 'free',
          subscriptionStatus: 'inactive',
          updated_at: now,
        },
      }
    )

    // Mirror to profiles collection so profile lookups are consistent
    await db.collection('profiles').updateOne(
      { user_id: user._id.toString() },
      {
        $set: {
          plan: 'free',
          subscriptionStatus: 'inactive',
        },
      }
    )

    console.log(`✅ Auto-downgrade complete for user ${user.email}`)

  } catch (error: any) {
    // Log but do not throw — a failed write here must never break the API
    // response. The next request will retry the downgrade automatically.
    console.error(
      `⚠️ Auto-downgrade write failed for user ${user.email}:`,
      error?.message || error
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// checkAccess — main exported function
//
// Call this at the top of any API route that needs to know who the user is
// and what they are allowed to do. Returns either a ready-to-use access
// object or a ready-to-return error response.
// ─────────────────────────────────────────────────────────────────────────────
export async function checkAccess(request: NextRequest): Promise<AccessResult> {

  // ── Step 1: Read JWT from cookie ─────────────────────────────────────────
  const token =
    request.cookies.get('token')?.value ||
    request.cookies.get('auth-token')?.value

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized — please log in', authenticated: false },
        { status: 401 }
      ),
    }
  }

  // ── Step 2: Verify JWT ────────────────────────────────────────────────────
  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid or expired session — please log in again', authenticated: false },
        { status: 401 }
      ),
    }
  }

  const userId = decoded.userId || decoded.id
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid token payload', authenticated: false },
        { status: 401 }
      ),
    }
  }

  // ── Step 3: Fetch user from MongoDB ──────────────────────────────────────
  const db = await dbPromise
  let user: any

  try {
    const { ObjectId } = await import('mongodb')
    user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { passwordHash: 0, password: 0 } }
    )
  } catch {
    user = await db.collection('users').findOne(
      { id: userId },
      { projection: { passwordHash: 0, password: 0 } }
    )
  }

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'User not found', authenticated: false },
        { status: 401 }
      ),
    }
  }

  // ── Step 4: Compute effective plan ───────────────────────────────────────
  const effectivePlan = getEffectivePlan(user)
  const limits = getPlanLimits(effectivePlan)
  const hasActiveSubscription = hasValidSubscription(user)

  // ── Step 5: Lazy auto-downgrade (fire and forget, non-blocking) ──────────
  // If the user's trial or canceled period has expired, update MongoDB now.
  // We do NOT await this — it runs in the background after we return.
  // The response uses effectivePlan which is already correct regardless
  // of whether the DB write succeeds or not.
  if (!hasActiveSubscription && (user.plan !== 'free' || user.subscriptionStatus !== 'inactive')) {
    syncPlanIfExpired(db, user, effectivePlan).catch(() => {
      // Already logged inside syncPlanIfExpired — swallow here so the
      // unhandled promise rejection does not crash the serverless function
    })
  }

  // ── Step 6: Return access result ─────────────────────────────────────────
  return {
    ok: true,
    userId: user._id.toString(),
    user,
    plan: effectivePlan,     // ← always the correct plan, even for expired users
    limits,
    hasActiveSubscription,
  }
}