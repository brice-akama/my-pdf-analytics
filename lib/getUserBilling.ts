// lib/getUserBilling.ts
//
// WHAT THIS FILE DOES:
//   A shared helper that fetches the current user's billing state from
//   /api/auth/me and returns it in a clean, typed shape that any component
//   can use — the plan page, the billing drawer, the trial banner, etc.
//
// WHY THIS EXISTS AS A SEPARATE FILE:
//   Before Phase 4, the plan page, billing drawer, and dashboard each had
//   their own fetch logic for the current plan. They used different field
//   paths (data.user.plan vs data.user.profile.plan vs data.user.billing.plan)
//   and inconsistently fell back to "free". This caused the plan page to show
//   the wrong plan after a webhook update.
//
//   Now every component imports this one function. When /api/auth/me changes,
//   there is one place to update, not four.
//
// FIELD PATH PRIORITY:
//   Phase 2 added a dedicated billing object to the /api/auth/me response:
//     data.user.billing.plan
//   We read this first. If it is missing (older cached response, or a user
//   created before Phase 2 deployed), we fall back to the older paths.
//   This makes the helper safe to use before and after Phase 2 deployment.

export interface UserBilling {
  // The plan tier: "free" | "starter" | "pro" | "business"
  plan: string

  // Lifecycle state: "trialing" | "active" | "canceled" | "past_due" | "inactive"
  subscriptionStatus: string

  // True if the user is in an active 14-day trial
  isTrialActive: boolean

  // How many days of trial remain (0 if expired or not on trial)
  trialDaysRemaining: number

  // ISO date string when the trial ends, or null
  trialEndsAt: string | null

  // ISO date string when the current billing period ends, or null
  currentPeriodEnd: string | null

  // "monthly" | "yearly" | null (null until they pay)
  billingCycle: string | null

  // The Paddle customer ID — used for the billing portal link
  paddleCustomerId: string | null
}

export async function getUserBilling(): Promise<UserBilling> {
  // Default — used if the fetch fails or the user is not logged in
  const defaults: UserBilling = {
    plan: 'free',
    subscriptionStatus: 'inactive',
    isTrialActive: false,
    trialDaysRemaining: 0,
    trialEndsAt: null,
    currentPeriodEnd: null,
    billingCycle: null,
    paddleCustomerId: null,
  }

  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
      // No-store so we always get fresh billing data — never a stale cache.
      // Billing state changes the moment the webhook fires. If the browser
      // served a cached /api/auth/me response, the plan page would show the
      // old plan even after a successful payment.
      cache: 'no-store',
    })

    if (!res.ok) return defaults

    const data = await res.json()
    if (!data.success || !data.user) return defaults

    const user = data.user

    // Read billing fields using the Phase 2 billing object first,
    // then fall back to older field paths for backwards compatibility
    return {
      plan:
        user.billing?.plan ||
        user.profile?.plan ||
        user.plan ||
        'free',

      subscriptionStatus:
        user.billing?.subscriptionStatus ||
        user.subscriptionStatus ||
        'inactive',

      isTrialActive:
        user.billing?.isTrialActive ?? false,

      trialDaysRemaining:
        user.billing?.trialDaysRemaining ?? 0,

      trialEndsAt:
        user.billing?.trialEndsAt || null,

      currentPeriodEnd:
        user.billing?.currentPeriodEnd || null,

      billingCycle:
        user.billing?.billingCycle || null,

      paddleCustomerId:
        user.billing?.paddleCustomerId || null,
    }
  } catch {
    return defaults
  }
}