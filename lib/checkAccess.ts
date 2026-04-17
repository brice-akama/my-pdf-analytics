// lib/checkAccess.ts
//
// WHAT THIS FILE DOES:
//   A reusable helper that every API route calls at the top to enforce
//   two things:
//     1. Is the user authenticated? (reads JWT from cookie)
//     2. Does the user's subscription allow this action?
//
// WHY THIS EXISTS AS A SEPARATE FILE:
//   Before Phase 5, every API route did its own JWT verification using
//   slightly different code. Some read 'token', some read 'auth-token',
//   some forgot to check both. Some did not check subscription status at all.
//   This file centralises both checks so every route gets them correctly
//   with one line of code.
//
// HOW TO USE IT IN ANY API ROUTE:
//
//   import { checkAccess } from '@/lib/checkAccess'
//   import { getPlanLimits, hasFeature } from '@/lib/planLimits'
//
//   export async function POST(request: NextRequest) {
//     const access = await checkAccess(request)
//     if (!access.ok) return access.response  // returns 401 or 403 automatically
//
//     // access.userId    — the authenticated user's ID string
//     // access.user      — the full user document from MongoDB
//     // access.plan      — "free" | "starter" | "pro" | "business"
//     // access.limits    — the PlanLimit object for their plan
//
//     // Example: check a feature flag
//     if (!hasFeature(access.plan, 'bulkSend')) {
//       return NextResponse.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
//     }
//
//     // Example: check storage before upload
//     if (!isStorageAvailable(access.plan, access.user.totalStorageUsedBytes, fileSize)) {
//       return NextResponse.json({ error: 'STORAGE_LIMIT_REACHED' }, { status: 403 })
//     }
//   }

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { dbPromise } from '@/app/api/lib/mongodb'
import { getPlanLimits, type PlanLimit } from '@/lib/planLimits'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// ─────────────────────────────────────────────────────────────────────────────
// RETURN TYPE
//
// When ok is true, all other fields are populated and safe to use.
// When ok is false, response is a ready-to-return NextResponse (401 or 403).
// ─────────────────────────────────────────────────────────────────────────────
export type AccessResult =
  | {
      ok: true
      userId: string
      user: any              // full MongoDB user document
      plan: string           // "free" | "starter" | "pro" | "business"
      limits: PlanLimit      // the PlanLimit object for their plan
      hasActiveSubscription: boolean  // true if they can use paid features
    }
  | {
      ok: false
      response: NextResponse // return this directly from your route handler
    }

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION VALIDITY CHECK
//
// Returns true if the user currently has valid access to their plan features.
// This is called inside checkAccess and exposed separately so you can use
// it in places where you already have the user object.
//
// Valid access means ANY of:
//   - status "active" (paying customer, all good)
//   - status "trialing" AND trial has not expired yet
//   - status "canceled" AND currentPeriodEnd is still in the future
//     (paid for the period, keeping access until it ends)
//   - status "past_due" AND currentPeriodEnd is in the future
//     (payment failed but Paddle retrying, keep access for now)
// ─────────────────────────────────────────────────────────────────────────────
export function hasValidSubscription(user: any): boolean {
  const status = user?.subscriptionStatus || 'inactive'
  const now = new Date()

  switch (status) {
    case 'active':
      // Paying customer — always valid
      return true

    case 'trialing': {
      // Valid only if the trial has not expired
      const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null
      return trialEnd !== null && trialEnd > now
    }

    case 'canceled': {
      // Valid until the paid period they already paid for ends
      const periodEnd = user.currentPeriodEnd
        ? new Date(user.currentPeriodEnd)
        : null
      return periodEnd !== null && periodEnd > now
    }

    case 'past_due': {
      // Paddle is retrying the payment — keep access until period ends
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
// EFFECTIVE PLAN
//
// Returns the plan the user should be treated as having RIGHT NOW.
//
// Why this is separate from user.plan:
//   user.plan might say "pro" but if their trial expired and they never paid,
//   they should be treated as "free". We do not update user.plan in real-time
//   on every request (too expensive). Instead we compute the effective plan
//   here based on both the stored plan and the subscription status.
//
//   When Phase 5 is fully deployed, a nightly job can update user.plan
//   for expired users. Until then, this function handles it correctly.
// ─────────────────────────────────────────────────────────────────────────────
export function getEffectivePlan(user: any): string {
  if (hasValidSubscription(user)) {
    // Their subscription is valid — use their stored plan
    return user.plan || 'free'
  }
  // Subscription expired or inactive — they are on free regardless of user.plan
  return 'free'
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN checkAccess FUNCTION
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

  // ── Step 4: Compute effective plan and limits ─────────────────────────────
  const plan = getEffectivePlan(user)
  const limits = getPlanLimits(plan)
  const hasActiveSubscription = hasValidSubscription(user)

  return {
    ok: true,
    userId: user._id.toString(),
    user,
    plan,
    limits,
    hasActiveSubscription,
  }
}