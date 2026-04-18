// app/api/auth/me/route.ts
//
// WHAT THIS FILE DOES:
//   Returns the currently authenticated user's full profile, plan, usage stats,
//   and feature flags. Called on every dashboard load and by the upgrade page
//   to show the current plan. Also handles profile updates via PATCH.
//
// CHANGES MADE IN PHASE 2 (Paddle payment integration prep):
//
//   1. Replaced the inline planLimits object with an import from lib/planLimits.ts.
//      Before this, limits were hardcoded here using old plan names ("premium")
//      and wrong values. Now this route reads from the single source of truth
//      and will always stay in sync when limits change.
//
//   2. Fixed the storage calculation. Previously this fetched ALL of the user's
//      documents and summed their size field on every single request:
//        const docs = await db.collection("documents").find(...).toArray()
//        const storageUsed = docs.reduce((sum, doc) => sum + doc.size, 0)
//      That is an O(n) DB scan on every page load. With 500 documents that is
//      500 reads per request. Now we read the single totalStorageUsedBytes field
//      that is maintained as a running total on the user document.
//
//   3. Added all billing fields to the response: plan, subscriptionStatus,
//      trialEndsAt, paddleCustomerId, paddleSubscriptionId, currentPeriodEnd,
//      billingCycle. The upgrade page and the trial banner in the dashboard
//      need these to show the correct UI state.
//
//   4. Fixed the features object. It was checking userPlan === "premium" for
//      everything, which broke the moment we introduced 4 real plan names.
//      Now it reads from the planLimits config's boolean feature flags.
//
//   5. Fixed plan limits to cover all 4 plans: free, starter, pro, business.
//      The old code only had "free" and "premium" which meant Pro and Business
//      users all fell back to "free" limits.
//
// WHAT WAS NOT CHANGED:
//   JWT verification, ObjectId handling, organization logic, profile fetching,
//   document/signature/share count queries, the PATCH handler, formatBytes.

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { dbPromise } from '@/app/api/lib/mongodb'
import {
  getPlanLimits,
  getStoragePercentage,
  type PlanName,
} from '@/lib/planLimits'

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(req: NextRequest) {
  try {
    console.log('📍 /api/auth/me called')

    // Check both cookie names — legacy code used "auth-token", current code uses "token"
    const token =
      req.cookies.get('auth-token')?.value || req.cookies.get('token')?.value

    if (!token) {
      console.error('❌ No token in cookies')
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No token provided', authenticated: false },
        { status: 401 }
      )
    }

    console.log('🔑 Token found in cookie')

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('✅ Token verified for user:', decoded.email)
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError)
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token', authenticated: false },
        { status: 401 }
      )
    }

    const userId = decoded.userId || decoded.id

    if (!userId) {
      console.error('❌ Token payload missing userId')
      return NextResponse.json(
        { success: false, error: 'Invalid token payload', authenticated: false },
        { status: 401 }
      )
    }

    const db = await dbPromise
    console.log('📦 DB connected')

    // Try ObjectId first, fall back to string — handles both ID formats in the DB
    let user: any
    try {
      const { ObjectId } = await import('mongodb')
      user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { passwordHash: 0, password: 0 } }
      )
    } catch {
      console.log('Trying string ID lookup...')
      user = await db.collection('users').findOne(
        { id: userId },
        { projection: { passwordHash: 0, password: 0 } }
      )
    }

    if (!user) {
      console.error('❌ User not found in DB:', userId)
      return NextResponse.json(
        { success: false, error: 'User not found', authenticated: false },
        { status: 404 }
      )
    }

    console.log('✅ User found:', user.email)

    const userIdForQuery = user.id || user._id?.toString()

    // ─────────────────────────────────────────────────────────────────────────
    // USAGE COUNTS — document, signature, share counts unchanged from before.
    // These are still counted live because they are cheap single-collection
    // countDocuments queries, not full table scans.
    // ─────────────────────────────────────────────────────────────────────────
    const [documentCount, signatureCount, shareCount] = await Promise.all([
      db.collection('documents').countDocuments({ userId: userIdForQuery }),
      db.collection('signature_requests').countDocuments({ userId: userIdForQuery }),
      db.collection('shares').countDocuments({ userId: userIdForQuery, active: true }),
    ]).catch((err) => {
      console.error('Error fetching stats:', err)
      return [0, 0, 0]
    })

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2: Storage calculation — read one field, not all documents.
    //
    // The old approach fetched every document and summed sizes in JS memory.
    // That is fine at 10 documents. At 500 documents it is 500 unnecessary
    // DB reads on every single page load.
    //
    // totalStorageUsedBytes is kept accurate by the upload and delete routes
    // using MongoDB's $inc operator. We just read it here.
    //
    // We fall back to 0 if the field does not exist yet — this handles accounts
    // that were created before Phase 2 was deployed without crashing.
    // ─────────────────────────────────────────────────────────────────────────
    const storageUsedBytes: number = user.totalStorageUsedBytes ?? 0

    // Fetch profile for name, avatar, organization info
    const profile = await db
      .collection('profiles')
      .findOne({ user_id: userIdForQuery })
      .catch(() => null)

    console.log('📝 Profile found:', profile ? 'Yes' : 'No')

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2: Plan resolution.
    //
    // Priority order:
    //   1. user.plan (set by signup and by webhook handler — most authoritative)
    //   2. profile.plan (mirrored at signup, may lag behind user.plan slightly)
    //   3. "free" (safe default — never give more than was paid for)
    //
    // We cast to PlanName so TypeScript knows it is one of our 4 valid values.
    // getPlanLimits() handles unknown strings by falling back to free.
    // ─────────────────────────────────────────────────────────────────────────
     // ── Inherit owner's plan if this user is an invited team member ─────────
    // Invited members never subscribe themselves. Their plan is always
    // whatever the owner currently has — including trial state.
    const organizationId = profile?.organization_id || userIdForQuery
    const isTeamMember = organizationId !== userIdForQuery

    let planSourceUser = user   // the user whose plan fields we read

    if (isTeamMember) {
      try {
        const { ObjectId } = await import('mongodb')
        const ownerUser = await db.collection('users').findOne(
          { _id: new ObjectId(organizationId) },
          { projection: { passwordHash: 0, password: 0 } }
        )
        if (ownerUser) planSourceUser = ownerUser
      } catch {
        const ownerUser = await db.collection('users').findOne(
          { id: organizationId },
          { projection: { passwordHash: 0, password: 0 } }
        )
        if (ownerUser) planSourceUser = ownerUser
      }
    }

    const userPlan = (
      planSourceUser.plan || profile?.plan || 'free'
    ) as PlanName
    const limits = getPlanLimits(userPlan)

    // ─────────────────────────────────────────────────────────────────────────
    // ORGANIZATION INFO — unchanged from before
    // ─────────────────────────────────────────────────────────────────────────
    const isOwner = !isTeamMember
     

    let organizationName = profile?.company_name || 'My Company'
    let organizationRole = profile?.role || 'owner'
    let organizationLogoUrl: string | null = null

    if (!isOwner) {
      const ownerProfile = await db
        .collection('profiles')
        .findOne({ user_id: organizationId })

      if (ownerProfile) {
        organizationName = ownerProfile.company_name || 'Team'
        organizationLogoUrl =
          ownerProfile.logo_url || ownerProfile.avatarUrl || null
      }
    } else {
      organizationLogoUrl =
        profile?.avatar_url || profile?.avatarUrl || profile?.logo_url || null
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2: Trial state helpers.
    //
    // trialDaysRemaining: how many full days are left in the trial. Shown in
    //   the dashboard banner "Your trial ends in X days". Returns 0 once expired
    //   rather than a negative number — the frontend just checks > 0.
    //
    // isTrialActive: true if the user is in "trialing" status AND the trial has
    //   not yet expired. Both conditions must be true. A user who is "trialing"
    //   but whose trialEndsAt is in the past is effectively expired.
    // ─────────────────────────────────────────────────────────────────────────
     const now = new Date()
    // For members, read trial dates from the owner's document
    const trialEndsAt: Date | null = planSourceUser.trialEndsAt
      ? new Date(planSourceUser.trialEndsAt)
      : null
    const trialDaysRemaining = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0
     const isTrialActive =
      planSourceUser.subscriptionStatus === 'trialing' && trialDaysRemaining > 0

    // ─────────────────────────────────────────────────────────────────────────
    // ASSEMBLE THE FULL RESPONSE OBJECT
    // ─────────────────────────────────────────────────────────────────────────
    const userData = {
      id: userIdForQuery,
      email: user.email,
      name:
        user.name ||
        profile?.full_name ||
        profile?.first_name ||
        user.email.split('@')[0],

      // ── Profile ────────────────────────────────────────────────────────────
      profile: {
        firstName: profile?.first_name || user.profile?.firstName || '',
        lastName: profile?.last_name || user.profile?.lastName || '',
        fullName:
          profile?.full_name ||
          user.profile?.fullName ||
          `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
          user.name ||
          user.email.split('@')[0],
        companyName: organizationName,
        avatarUrl: isOwner
          ? profile?.avatarUrl || profile?.avatar_url || user.profile?.avatarUrl || ''
          : organizationLogoUrl || '',
        logoUrl: organizationLogoUrl,
      },

      // ── Organization ───────────────────────────────────────────────────────
      organization: {
        id: organizationId,
        name: organizationName,
        role: organizationRole,
        isOwner,
      },

      // ── PHASE 2: Billing state ─────────────────────────────────────────────
      // Everything the frontend needs to render the correct plan UI, trial
      // banner, upgrade prompt, and billing settings page.
      //
      // plan: the plan tier name — "free" | "starter" | "pro" | "business"
      // subscriptionStatus: lifecycle state — "trialing" | "active" | "canceled" | "past_due" | "inactive"
      // trialEndsAt: ISO date string when the trial expires, or null
      // trialDaysRemaining: integer days left, 0 if expired or not on trial
      // isTrialActive: convenience boolean for the dashboard banner
      // currentPeriodEnd: when the current billing period ends (mirrors trialEndsAt for trialing users)
      // billingCycle: "monthly" | "yearly" | null (null until they pay)
      // paddleCustomerId: used by the billing portal and cancellation flow
      billing: {
        plan: userPlan,
        subscriptionStatus: planSourceUser.subscriptionStatus || 'inactive',
        trialEndsAt: trialEndsAt?.toISOString() || null,
        trialDaysRemaining,
        isTrialActive,
        currentPeriodEnd: planSourceUser.currentPeriodEnd
          ? new Date(planSourceUser.currentPeriodEnd).toISOString()
          : null,
        billingCycle: planSourceUser.billingCycle || null,
        paddleCustomerId: isOwner ? planSourceUser.paddleCustomerId || null : null,
        isTeamMember,   // ← frontend needs this to hide billing management UI
      },

      // ── Statistics ─────────────────────────────────────────────────────────
      stats: {
        documents: documentCount,
        signatures: signatureCount,
        shares: shareCount,
        // storageUsed in human-readable format for display (e.g. "4.2 MB")
        storageUsed: formatBytes(storageUsedBytes),
        // storageUsedBytes as raw number for math elsewhere
        storageUsedBytes,
      },

      // ── Usage vs limits ────────────────────────────────────────────────────
      // Each section has: used, limit (-1 = unlimited), percentage, unlimited flag.
      // The frontend can render progress bars and gate UI elements from this.
      usage: {
        documents: {
          used: documentCount,
          limit: limits.maxDocuments,
          percentage:
            limits.maxDocuments === -1
              ? 0
              : Math.min(100, Math.round((documentCount / limits.maxDocuments) * 100)),
          unlimited: limits.maxDocuments === -1,
        },
        signatures: {
          used: signatureCount,
          limit: limits.maxESignaturesPerMonth,
          percentage:
            limits.maxESignaturesPerMonth === -1
              ? 0
              : Math.min(
                  100,
                  Math.round((signatureCount / limits.maxESignaturesPerMonth) * 100)
                ),
          unlimited: limits.maxESignaturesPerMonth === -1,
        },
        shares: {
          used: shareCount,
          limit: limits.maxShareLinks,
          percentage:
            limits.maxShareLinks === -1
              ? 0
              : Math.min(100, Math.round((shareCount / limits.maxShareLinks) * 100)),
          unlimited: limits.maxShareLinks === -1,
        },
        storage: {
          usedBytes: storageUsedBytes,
          limitBytes: limits.storageLimitBytes,
          percentage: getStoragePercentage(userPlan, storageUsedBytes),
          usedFormatted: formatBytes(storageUsedBytes),
          limitFormatted: formatBytes(limits.storageLimitBytes),
          // Convenience thresholds for the frontend storage bar colour logic:
          //   < 80%  → green (normal)
          //   80–94% → yellow (warning, show nudge)
          //   95%+   → red (critical, block uploads)
          isWarning: getStoragePercentage(userPlan, storageUsedBytes) >= 80,
          isCritical: getStoragePercentage(userPlan, storageUsedBytes) >= 95,
        },
        teamMembers: {
          // We do not count live here — the organization_members query
          // is done in the team settings page. We just expose the limit.
          limit: limits.maxTeamMembers,
        },
        spaces: {
          limit: limits.maxSpaces,
          unlimited: limits.maxSpaces === -1,
        },
      },

      // ── PHASE 2: Feature flags ─────────────────────────────────────────────
      // Derived from planLimits config. The frontend gates UI elements behind
      // these booleans — if the flag is false, show a locked/upgrade state.
      // Previously these were all hardcoded as userPlan === "premium" which
      // broke when we introduced 4 real plan names.
      features: limits.features,

      // ── Account metadata ────────────────────────────────────────────────────
      provider: user.provider || 'local',
      emailVerified: user.email_verified || user.emailVerified || false,
      createdAt: user.created_at || user.createdAt || profile?.created_at,
      lastLogin: user.lastLogin || new Date(),
    }

    console.log('✅ Returning user data')
    return NextResponse.json(
      { success: true, authenticated: true, user: userData },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Error in /api/auth/me:', error)
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update user profile
// Completely unchanged from before — only name and profile fields are updated.
// Billing fields are never updated here — they are only updated by the
// Paddle webhook handler to prevent any client-side tampering.
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const token =
      req.cookies.get('auth-token')?.value || req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded: any = jwt.verify(token, JWT_SECRET)
    const userId = decoded.userId || decoded.id

    const body = await req.json()
    const { name, profile } = body

    const db = await dbPromise

    const updateFields: any = { updatedAt: new Date() }

    if (name !== undefined) updateFields.name = name
    if (profile !== undefined) updateFields.profile = profile

    let result
    try {
      const { ObjectId } = await import('mongodb')
      result = await db
        .collection('users')
        .updateOne({ _id: new ObjectId(userId) }, { $set: updateFields })
    } catch {
      result = await db
        .collection('users')
        .updateOne({ id: userId }, { $set: updateFields })
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (error: any) {
    console.error('❌ Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: formatBytes
// Converts raw bytes to a human-readable string. Used for display only —
// all internal storage math always uses raw bytes.
// ─────────────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}