"use client"

// app/plan/page.tsx
//
// FIXES IN THIS VERSION:
//
//   1. "Downgrade to free" now triggers the proper cancellation flow.
//      Before this, clicking "Downgrade to free" just called router.push('/dashboard')
//      which did nothing to the subscription — the user stayed on their paid plan.
//
//      The correct behaviour: downgrading to free = canceling the Paddle subscription.
//      We call POST /api/paddle/cancel, Paddle marks it as canceling at period end,
//      the webhook fires subscription.canceled, the user keeps access until
//      currentPeriodEnd, and checkAccess lazy-downgrades them to free when that
//      date passes. This is identical to clicking "Cancel plan" in the BillingDrawer.
//
//      Why not immediately set them to free?
//      Same reason as cancellation — they paid for the period. Industry standard
//      is access until period end. Cutting off immediately generates chargebacks.
//
//   2. Added a downgrade confirmation step before calling the cancel API.
//      A user clicking "Downgrade to free" accidentally should not immediately
//      lose their plan. A brief confirmation modal prevents that.
//
//   3. Free plan button is now hidden entirely for users who are already on free
//      or inactive — there is nothing to downgrade to.
//
// EVERYTHING ELSE IS UNCHANGED from the Phase 4 version.

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ArrowLeft, Loader2, AlertCircle, Clock, XCircle, ChevronDown } from "lucide-react"
import Link from "next/link"
import { getUserBilling, type UserBilling } from "@/lib/getUserBilling"

type PlanType = "monthly" | "yearly"

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Get started with secure document sharing",
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: "forever",
    features: [
      "2 user",
      "5 documents",
      "3 share links",
      "Basic analytics",
      "1 Space",
      "2 eSignatures per month",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "For individuals and freelancers",
    monthlyPrice: 19,
    yearlyPrice: 15,
    period: "per month",
    features: [
      "3 user",
      "Unlimited documents",
      "Unlimited share links",
      "Full document analytics",
      "3 Spaces",
      "10 eSignatures per month",
      "Video walkthroughs",
      "Custom branding",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams and sales",
    monthlyPrice: 49,
    yearlyPrice: 39,
    period: "per month",
    popular: true,
    features: [
      "4 users included",
      "Everything in Starter",
      "Unlimited Spaces",
      "Unlimited eSignatures",
      "Bulk send",
      "NDA and agreements",
      "Dynamic watermarking",
      "Email OTP verification",
      "Compliance reports",
      "Version history",
      "Google Drive + OneDrive",
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For teams that need full control",
    monthlyPrice: 99,
    yearlyPrice: 79,
    period: "per month",
    features: [
      "10 users included",
      "Everything in Pro",
      "Advanced data rooms",
      "Full audit logs",
      "Folder level permissions",
      "Advanced team management",
      "Custom docs domain",
      "Priority support",
    ],
  },
]

// Plan hierarchy for determining upgrade vs downgrade direction
const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNGRADE CONFIRMATION MODAL
//
// Shown when a paid user clicks "Downgrade to free". Explains what happens
// before any API call is made so the user cannot do it accidentally.
// ─────────────────────────────────────────────────────────────────────────────
function DowngradeConfirmModal({
  currentPlanName,
  accessUntil,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  currentPlanName: string
  accessUntil: string | null
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
  error: string | null
}) {
  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Downgrade to Free?
        </h2>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          This will cancel your {currentPlanName} subscription. Here is what happens:
        </p>

        <ul className="space-y-2.5 mb-6">
          {[
            accessUntil
              ? `You keep ${currentPlanName} access until ${accessUntil}`
              : `You keep ${currentPlanName} access until your billing period ends`,
            "After that your account moves to the Free plan",
            "Documents, spaces, and contacts are never deleted",
            "You can resubscribe anytime and everything is restored",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-[7px] flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            Keep my plan
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Canceling...
              </>
            ) : (
              "Yes, downgrade"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [billing, setBilling] = useState<PlanType>("monthly")
  const [billingData, setBillingData] = useState<UserBilling | null>(null)
  const [billingLoading, setBillingLoading] = useState(true)

  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // ── Downgrade to free state ───────────────────────────────────────────────
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [downgradeLoading, setDowngradeLoading] = useState(false)
  const [downgradeError, setDowngradeError] = useState<string | null>(null)

  const currentPlan = billingData?.plan || 'free'
  const currentPlanName = plans.find(p => p.id === currentPlan)?.name || 'Current'

  useEffect(() => {
    getUserBilling()
      .then((data) => {
        setBillingData(data)
        if (data.billingCycle === 'yearly') setBilling('yearly')
      })
      .finally(() => setBillingLoading(false))
  }, [])

  useEffect(() => {
    if (searchParams?.get("cancelled") === "true") {
      setCheckoutError(
        "You cancelled the checkout. No payment was taken. You can try again anytime."
      )
      window.history.replaceState({}, "", "/plan")
    }
  }, [searchParams])

  // ── handleSelectPlan ──────────────────────────────────────────────────────
  const handleSelectPlan = async (planId: string) => {

    // ── FIXED: Downgrade to free = cancel the Paddle subscription ────────
    // Before this fix, clicking "Downgrade to free" just called
    // router.push('/dashboard') — the subscription was never canceled.
    // Now we show a confirmation modal. If the user confirms, we call
    // POST /api/paddle/cancel exactly like the BillingDrawer cancel flow.
    // The user keeps access until currentPeriodEnd, then drops to free.
    if (planId === "free") {
      // Only show the cancel flow if they actually have a paid subscription.
      // If they are already on free or inactive, just go to dashboard.
      const hasPaidSub =
        billingData?.subscriptionStatus === 'active' ||
        billingData?.subscriptionStatus === 'past_due' ||
        (billingData?.subscriptionStatus === 'trialing' && !billingData?.isTrialActive)

      if (!hasPaidSub || currentPlan === 'free') {
        router.push("/dashboard")
        return
      }

      // Show confirmation modal — do not call the API until user confirms
      setDowngradeError(null)
      setShowDowngradeModal(true)
      return
    }

    // Already on this plan and not canceled — nothing to do
    if (planId === currentPlan && billingData?.subscriptionStatus !== 'canceled') return

    setCheckoutError(null)
    setLoadingPlanId(planId)

    try {
      const res = await fetch("/api/paddle/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId, billingCycle: billing }),
      })

      const data = await res.json()

      if (!res.ok || !data.checkoutUrl) {
        setCheckoutError(
          data.error || "Something went wrong creating your checkout. Please try again."
        )
        return
      }

      window.location.href = data.checkoutUrl

    } catch {
      setCheckoutError("Network error. Please check your connection and try again.")
    } finally {
      setLoadingPlanId(null)
    }
  }

  // ── handleConfirmDowngrade ────────────────────────────────────────────────
  // Called when the user confirms the downgrade modal.
  // Calls the same cancel API as the BillingDrawer — no duplication.
  const handleConfirmDowngrade = async () => {
    setDowngradeLoading(true)
    setDowngradeError(null)

    try {
      const res = await fetch("/api/paddle/cancel", {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()

      if (!res.ok) {
        setDowngradeError(data.error || "Something went wrong. Please try again.")
        return
      }

      // Success — close modal and show a success banner then go to dashboard
      setShowDowngradeModal(false)

      // Refresh billing data so the page reflects the new "canceled" state
      const refreshed = await getUserBilling()
      setBillingData(refreshed)

      // Show the canceled banner (billing state is now "canceled")
      // The user sees: "Your plan is canceled. You have access until [date]."

    } catch {
      setDowngradeError("Network error. Please check your connection and try again.")
    } finally {
      setDowngradeLoading(false)
    }
  }

  // ── Determine button label and visibility for each plan ──────────────────
  function getButtonConfig(plan: typeof plans[0]) {
    const isCurrent = currentPlan === plan.id
    const isCanceled = billingData?.subscriptionStatus === 'canceled'
    const isInactive = billingData?.subscriptionStatus === 'inactive'
    const currentRank = PLAN_RANK[currentPlan] ?? 0
    const targetRank = PLAN_RANK[plan.id] ?? 0

    // Free plan button — only show for paid users who can downgrade
    if (plan.id === 'free') {
      const canDowngrade =
        currentPlan !== 'free' &&
        !isInactive &&
        billingData?.subscriptionStatus !== 'canceled'

      if (!canDowngrade) return null // hide the button entirely

      return {
        label: 'Downgrade to free',
        style: 'downgrade' as const,
        disabled: false,
      }
    }

    if (isCurrent && isCanceled) {
      return { label: 'Resubscribe', style: 'primary' as const, disabled: false }
    }

    if (isCurrent) {
      return { label: 'Current plan', style: 'current' as const, disabled: true }
    }

    if (targetRank > currentRank) {
      return { label: 'Upgrade', style: plan.popular ? 'popular' as const : 'secondary' as const, disabled: false }
    }

    // Downgrade to a lower paid plan (e.g. Business → Pro)
    return { label: 'Downgrade', style: 'secondary' as const, disabled: false }
  }

  const buttonStyleClasses = {
    primary:   'bg-indigo-600 text-white hover:bg-indigo-700',
    popular:   'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200',
    current:   'bg-slate-100 text-slate-500 cursor-not-allowed',
    downgrade: 'bg-white text-slate-500 border border-slate-200 hover:border-red-200 hover:text-red-600',
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Downgrade confirmation modal */}
      {showDowngradeModal && (
        <DowngradeConfirmModal
          currentPlanName={currentPlanName}
          accessUntil={billingData?.currentPeriodEnd ? formatDate(billingData.currentPeriodEnd) : null}
          onConfirm={handleConfirmDowngrade}
          onCancel={() => setShowDowngradeModal(false)}
          loading={downgradeLoading}
          error={downgradeError}
        />
      )}

      {/* Header */}
      <div className="border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </button>
            <span className="text-sm font-semibold text-slate-900">DocMetrics</span>
            <div className="w-32" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-4">
          Plans
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight mb-4">
          Choose the plan that fits{" "}
          <span className="text-indigo-600">where you are now.</span>
        </h1>
        <p className="text-base text-slate-500 leading-relaxed mb-8">
          Every plan includes core tracking, analytics, and e-signatures.
          Upgrade or downgrade at any time.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              billing === "monthly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              billing === "yearly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Yearly
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Status banners */}
      {!billingLoading && billingData && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4 space-y-3">
          {billingData.isTrialActive && (
            <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Your free trial ends on{" "}
                <span className="font-semibold">{formatDate(billingData.trialEndsAt)}</span>
                {" "}— {" "}
                <span className="font-semibold">{billingData.trialDaysRemaining} days</span>
                {" "}from now. Choose a plan below to keep your access.
              </p>
            </div>
          )}
          {billingData.subscriptionStatus === 'canceled' && billingData.currentPeriodEnd && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <XCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Your plan is canceled. You have access until{" "}
                <span className="font-semibold">{formatDate(billingData.currentPeriodEnd)}</span>.
                {" "}Subscribe again below to keep your data and settings.
              </p>
            </div>
          )}
          {billingData.subscriptionStatus === 'past_due' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Your last payment failed. Paddle will retry automatically.
                If this keeps happening, please update your payment method.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Checkout error banner */}
      {checkoutError && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4">
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{checkoutError}</p>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        {billingLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-slate-200 rounded-2xl p-7 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-8" />
                <div className="h-10 bg-slate-200 rounded mb-6" />
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-3 bg-slate-200 rounded mb-3" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id
              const isLoading = loadingPlanId === plan.id
              const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
              const btnConfig = getButtonConfig(plan)

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl overflow-hidden flex flex-col ${
                    plan.popular
                      ? "ring-2 ring-indigo-600 shadow-xl"
                      : isCurrent
                      ? "ring-2 ring-slate-300 shadow-sm"
                      : "border border-slate-200 shadow-sm"
                  }`}
                >
                  {plan.popular && (
                    <div className="bg-indigo-600 text-white text-xs font-semibold text-center py-2 tracking-wide">
                      Most Popular
                    </div>
                  )}

                  {isCurrent && !plan.popular && (
                    <div className={`text-white text-xs font-semibold text-center py-2 tracking-wide ${
                      billingData?.subscriptionStatus === 'canceled' ? 'bg-amber-600' :
                      billingData?.subscriptionStatus === 'past_due' ? 'bg-red-600' :
                      billingData?.isTrialActive ? 'bg-blue-600' :
                      'bg-slate-900'
                    }`}>
                      {billingData?.subscriptionStatus === 'canceled' ? 'Cancels Soon' :
                       billingData?.subscriptionStatus === 'past_due' ? 'Payment Failed' :
                       billingData?.isTrialActive ? 'Trial Active' :
                       'Current Plan'}
                    </div>
                  )}

                  <div className="p-7 flex flex-col flex-1">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{plan.name}</h3>
                      <p className="text-sm text-slate-500">{plan.description}</p>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-slate-900">${price}</span>
                        <span className="text-slate-500 text-sm">/{plan.period}</span>
                      </div>
                      {billing === "yearly" && plan.monthlyPrice > 0 && (
                        <p className="text-xs text-emerald-600 mt-1 font-medium">
                          Save ${(plan.monthlyPrice - plan.yearlyPrice) * 12}/year
                        </p>
                      )}
                      {plan.monthlyPrice === 0 && (
                        <p className="text-xs text-slate-400 mt-1">No credit card required</p>
                      )}
                    </div>

                    {/* Button — hidden if btnConfig is null (e.g. free plan for free users) */}
                    {btnConfig !== null && (
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={btnConfig.disabled || isLoading || loadingPlanId !== null}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all mb-8 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                          buttonStyleClasses[btnConfig.style]
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Redirecting to checkout...
                          </>
                        ) : (
                          btnConfig.label
                        )}
                      </button>
                    )}

                    <div className="space-y-3 flex-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
                        What is included
                      </p>
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-indigo-600" />
                          </div>
                          <span className="text-sm text-slate-600 leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-xs text-slate-400">
            All plans include a 14-day money-back guarantee.{" "}
            <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Contact us
            </Link>{" "}
            if you have questions about which plan is right for you.
          </p>
        </div>
      </div>
    </div>
  )
}