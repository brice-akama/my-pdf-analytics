"use client"

// app/plan/page.tsx
//
// WHAT THIS FILE DOES:
//   The upgrade / plan selection page. Shows all four plans, the billing
//   toggle, and the correct current plan highlighted. When a user clicks
//   Upgrade it calls the Paddle checkout route from Phase 3.
//
// PHASE 4 CHANGES — what was updated and why:
//
//   1. Replaced the inline /api/auth/me fetch with getUserBilling() helper.
//      Before this, the page read plan from data.user.profile.plan which was
//      a stale path. After Phase 4 the webhook writes to user.plan and the
//      /api/auth/me response returns it in data.user.billing.plan. The old
//      path still worked as a fallback but was unreliable. getUserBilling()
//      reads the correct path with full fallback coverage.
//
//   2. Added cache: 'no-store' (inside getUserBilling) so the plan page
//      always fetches fresh data. Without this, the browser cached the old
//      plan and showed the wrong plan even after the webhook updated it.
//
//   3. Added status banners:
//      - Trial banner: "Your Pro trial ends in X days — upgrade to keep access"
//      - Canceled banner: "Your plan cancels on [date] — resubscribe to keep access"
//      - Past due banner: "Your last payment failed — please update your card"
//      These banners are driven entirely by the billing state the webhook writes.
//
//   4. Added a loading skeleton so the page does not flash "Free" for a
//      fraction of a second while the billing fetch resolves.
//
//   5. The current plan badge now shows context-aware labels:
//      "Trial Active", "Cancels Soon", "Payment Failed" instead of always
//      showing "Current Plan" regardless of state.

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ArrowLeft, Loader2, AlertCircle, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { getUserBilling, type UserBilling } from "@/lib/getUserBilling"

type PlanType = "monthly" | "yearly"

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DATA — unchanged from original
// ─────────────────────────────────────────────────────────────────────────────
const plans = [
  {
    id: "free",
    name: "Free",
    description: "Get started with secure document sharing",
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: "forever",
    features: [
      "1 user",
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
      "1 user",
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
      "3 users included",
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

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT DATE HELPER
// Converts an ISO date string to a readable format: "May 15, 2025"
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [billing, setBilling] = useState<PlanType>("monthly")

  // billingData holds the full billing state from /api/auth/me.
  // Null means it has not loaded yet — we show a skeleton in that state
  // so the page never flashes the wrong plan while fetching.
  const [billingData, setBillingData] = useState<UserBilling | null>(null)
  const [billingLoading, setBillingLoading] = useState(true)

  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // currentPlan defaults to "free" while loading — safe because free
  // never grants more than was paid for
  const currentPlan = billingData?.plan || 'free'

  // ── Fetch billing state on mount ─────────────────────────────────────────
  // getUserBilling() calls /api/auth/me with cache: 'no-store' so we always
  // get the plan the webhook most recently wrote, never a stale cached version.
  useEffect(() => {
    getUserBilling()
      .then((data) => {
        setBillingData(data)
        // Pre-select the billing cycle toggle to match their current subscription
        if (data.billingCycle === 'yearly') setBilling('yearly')
      })
      .finally(() => setBillingLoading(false))
  }, [])

  // ── Handle ?cancelled=true param from Paddle ─────────────────────────────
  // Paddle appends this when the user closes the checkout without paying
  useEffect(() => {
    if (searchParams?.get("cancelled") === "true") {
      setCheckoutError(
        "You cancelled the checkout. No payment was taken. You can try again anytime."
      )
      window.history.replaceState({}, "", "/plan")
    }
  }, [searchParams])

  // ── handleSelectPlan ─────────────────────────────────────────────────────
  const handleSelectPlan = async (planId: string) => {
    if (planId === "free") {
      router.push("/dashboard")
      return
    }
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

      // Full browser redirect to Paddle's hosted checkout page.
      // router.push does not work for external URLs.
      window.location.href = data.checkoutUrl

    } catch {
      setCheckoutError("Network error. Please check your connection and try again.")
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
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

      {/* ── Hero ── */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-4">
          Upgrade your plan
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

      {/* ── PHASE 4: Status banners ──────────────────────────────────────────
          Driven entirely by what the webhook wrote to MongoDB.
          A fully active paid user sees none of these. ── */}
      {!billingLoading && billingData && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4 space-y-3">

          {/* Trial banner */}
          {billingData.isTrialActive && (
            <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Your free trial ends on{" "}
                <span className="font-semibold">{formatDate(billingData.trialEndsAt)}</span>
                {" "}— that is{" "}
                <span className="font-semibold">{billingData.trialDaysRemaining} days</span>
                {" "}from now. Choose a plan below to keep your access.
              </p>
            </div>
          )}

          {/* Canceled banner */}
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

          {/* Past due banner */}
          {billingData.subscriptionStatus === 'past_due' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Your last payment failed. Paddle will retry automatically. If this keeps
                happening, please update your payment method to avoid losing access.
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

      {/* ── Plans ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">

        {/* Loading skeleton — prevents flashing wrong plan while fetch resolves */}
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

              // A canceled user CAN click their current plan to resubscribe
              const isClickable = !isCurrent ||
                billingData?.subscriptionStatus === 'canceled'

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

                  {/* PHASE 4: Badge label is context-aware based on subscription status */}
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
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {plan.name}
                      </h3>
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

                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={!isClickable || isLoading || loadingPlanId !== null}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all mb-8 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                        isCurrent && billingData?.subscriptionStatus !== 'canceled'
                          ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                          : plan.popular
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : plan.monthlyPrice === 0
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Redirecting to checkout...
                        </>
                      ) : isCurrent && billingData?.subscriptionStatus === 'canceled' ? (
                        'Resubscribe'
                      ) : isCurrent ? (
                        'Current plan'
                      ) : plan.monthlyPrice === 0 ? (
                        'Downgrade to free'
                      ) : (
                        'Upgrade'
                      )}
                    </button>

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