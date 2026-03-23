"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, ArrowLeft } from "lucide-react"
import Link from "next/link"

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
  const [billing, setBilling] = useState<PlanType>("monthly")
  const [currentPlan, setCurrentPlan] = useState("free")

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      const token = localStorage.getItem("token")
      if (!token) return
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setCurrentPlan(data.user.profile.plan?.toLowerCase() || "free")
        }
      } catch (error) {
        // fail silently
      }
    }
    fetchCurrentPlan()
  }, [])

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan) return
    // Wire up Stripe or payment processor here
    router.push("/dashboard")
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
          Every plan includes core tracking, analytics, and e-signatures. Upgrade or downgrade at any time.
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

      {/* ── Plans ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice

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
                  <div className="bg-slate-900 text-white text-xs font-semibold text-center py-2 tracking-wide">
                    Current Plan
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

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrent}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all mb-8 disabled:opacity-60 disabled:cursor-not-allowed ${
                      isCurrent
                        ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                        : plan.popular
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : plan.monthlyPrice === 0
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                    }`}
                  >
                    {isCurrent ? "Current plan" : plan.monthlyPrice === 0 ? "Downgrade to free" : "Upgrade"}
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
                        <span className="text-sm text-slate-600 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Footer note ── */}
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