"use client"

// app/plan/page.tsx   
//
// WHAT THIS FILE DOES:
//   Shows the plan selection UI. When a logged-in user picks a plan and
//   clicks "Upgrade", it calls our backend checkout route which returns
//   a Paddle checkout URL, then redirects the user to Paddle's hosted
//   payment page. Paddle handles everything from there.
//
// CHANGES MADE IN PHASE 3:
//   Replaced the placeholder handleSelectPlan function that just redirected
//   to /dashboard with a real implementation that:
//     1. Calls POST /api/paddle/checkout with planId + billingCycle
//     2. Shows a loading spinner on the button while waiting
//     3. Redirects to the Paddle checkout URL on success
//     4. Shows a clear error message if something goes wrong
//     5. Handles the ?cancelled=true param Paddle adds when a user
//        closes the checkout without paying
//
// WHAT WAS NOT CHANGED:
//   All plan data, pricing, UI layout, billing toggle, and plan comparison
//   are identical to the original. Only the handleSelectPlan function
//   and the loading/error state were added.

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

type PlanType = "monthly" | "yearly"

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DATA
// Unchanged from original — these are the plans shown in the UI.
// The id field must exactly match what PRICE_ID_MAP expects in the checkout
// route: "starter" | "pro" | "business"
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

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [billing, setBilling] = useState<PlanType>("monthly")
  const [currentPlan, setCurrentPlan] = useState("free")

  // ── PHASE 3: New state ───────────────────────────────────────────────────
  // loadingPlanId tracks which plan button is currently in the loading state.
  // This lets us show a spinner only on the button the user clicked, not all
  // of them, so the UI stays informative while the API call is in flight.
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  // checkoutError is shown below the plan cards if the checkout API call fails.
  // We show it inline rather than redirecting so the user can try again without
  // losing their plan selection.
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // ── Fetch current plan on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        const data = await res.json()
        if (data.success) {
          // Phase 2 stores plan under data.user.billing.plan
          // Fall back to data.user.plan for backwards compatibility
          const plan =
            data.user?.billing?.plan ||
            data.user?.profile?.plan ||
            data.user?.plan ||
            "free"
          setCurrentPlan(plan.toLowerCase())
        }
      } catch {
        // Fail silently — currentPlan stays "free" which is a safe default
      }
    }
    fetchCurrentPlan()
  }, [])

  // ── PHASE 3: Handle the ?cancelled=true param ────────────────────────────
  // Paddle appends ?cancelled=true to the cancel_url when a user closes the
  // checkout without paying. We detect this and show a friendly message rather
  // than leaving the user on a blank page wondering what happened.
  useEffect(() => {
    if (searchParams?.get("cancelled") === "true") {
      setCheckoutError(
        "You cancelled the checkout. No payment was taken. You can try again anytime."
      )
      // Clean the URL so the message disappears if they refresh
      window.history.replaceState({}, "", "/plan")
    }
  }, [searchParams])

  // ── PHASE 3: handleSelectPlan — the core of Phase 3 ─────────────────────
  //
  // This replaces the old placeholder that just called router.push('/dashboard').
  //
  // Why window.location.href instead of router.push for the checkout redirect:
  //   router.push is a client-side Next.js navigation. Paddle's checkout URL
  //   is an external URL on paddle.com. next/navigation's router.push does not
  //   support external URLs reliably — it will either throw or do nothing.
  //   window.location.href is a full browser redirect that works for any URL.
  //
  // Why we do NOT update the database here:
  //   After the user pays, Paddle sends a webhook to our server (Phase 4).
  //   The webhook is signed and verified — it is the only trustworthy signal
  //   that a payment succeeded. The checkout redirect can be faked, intercepted,
  //   or arrive before Paddle has finished processing. We never grant access
  //   based on a redirect URL. The webhook is the source of truth.
  const handleSelectPlan = async (planId: string) => {
    // Free plan — no payment needed, just go back to dashboard
    if (planId === "free") {
      router.push("/dashboard")
      return
    }

    // Already on this plan — nothing to do
    if (planId === currentPlan) return

    // Clear any previous error and start loading state on this button
    setCheckoutError(null)
    setLoadingPlanId(planId)

    try {
      const res = await fetch("/api/paddle/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // sends the JWT cookie so the backend knows who this is
        body: JSON.stringify({
          planId,
          billingCycle: billing, // "monthly" or "yearly" from the toggle
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.checkoutUrl) {
        // The backend returned an error — show it inline
        setCheckoutError(
          data.error ||
            "Something went wrong creating your checkout. Please try again."
        )
        return
      }

      // Redirect the browser to Paddle's hosted checkout page.
      // From this point Paddle handles everything:
      //   — Card input and validation
      //   — 3D Secure authentication
      //   — Tax calculation (Paddle is the Merchant of Record)
      //   — Payment processing
      //   — Receipt email to the user
      //   — Redirect back to our success page
      //   — Webhook to our server (Phase 4)
      window.location.href = data.checkoutUrl

    } catch {
      // Network error — the fetch itself failed (user offline, DNS failure, etc.)
      setCheckoutError(
        "Network error. Please check your connection and try again."
      )
    } finally {
      // Always clear the loading state, whether we succeeded or failed.
      // If we redirected, the page is unloading anyway so this is a no-op.
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

        {/* Billing toggle — unchanged */}
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

      {/* ── PHASE 3: Checkout error banner ──────────────────────────────────
          Shown when the API call fails or when the user cancels checkout.
          Placed above the plan cards so it is immediately visible. ── */}
      {checkoutError && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4">
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <svg
              className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-700">{checkoutError}</p>
          </div>
        </div>
      )}

      {/* ── Plans ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const isLoading = loadingPlanId === plan.id
            const price =
              billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice

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
                {/* Popular badge */}
                {plan.popular && (
                  <div className="bg-indigo-600 text-white text-xs font-semibold text-center py-2 tracking-wide">
                    Most Popular
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && !plan.popular && (
                  <div className="bg-slate-900 text-white text-xs font-semibold text-center py-2 tracking-wide">
                    Current Plan
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
                      <span className="text-4xl font-bold text-slate-900">
                        ${price}
                      </span>
                      <span className="text-slate-500 text-sm">
                        /{plan.period}
                      </span>
                    </div>
                    {billing === "yearly" && plan.monthlyPrice > 0 && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        Save $
                        {(plan.monthlyPrice - plan.yearlyPrice) * 12}/year
                      </p>
                    )}
                    {plan.monthlyPrice === 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        No credit card required
                      </p>
                    )}
                  </div>

                  {/* ── PHASE 3: Upgrade button with loading state ── */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrent || isLoading || loadingPlanId !== null}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all mb-8 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                      isCurrent
                        ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                        : plan.popular
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : plan.monthlyPrice === 0
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                    }`}
                  >
                    {/* Show spinner only on the button being clicked.
                        Other buttons stay enabled visually but are disabled
                        via the loadingPlanId !== null check above so the
                        user cannot start two checkouts simultaneously. */}
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting to checkout...
                      </>
                    ) : isCurrent ? (
                      "Current plan"
                    ) : plan.monthlyPrice === 0 ? (
                      "Downgrade to free"
                    ) : (
                      "Upgrade"
                    )}
                  </button>

                  {/* Features list — unchanged */}
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

        {/* Footer note — unchanged */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-400">
            All plans include a 14-day money-back guarantee.{" "}
            <Link
              href="/contact"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Contact us
            </Link>{" "}
            if you have questions about which plan is right for you.
          </p>
        </div>
      </div>
    </div>
  )
}