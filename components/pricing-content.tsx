// components/pricing-content.tsx
"use client"
import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    description: "Get started with secure document sharing",
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: "forever",
    cta: "Get started free",
    href: "/signup",
    popular: false,
    features: [
      { text: "1 user" },
      { text: "5 documents" },
      { text: "3 share links" },
      { text: "Basic analytics" },
      { text: "1 Space" },
      { text: "2 eSignatures per month" },
    ],
  },
  {
    name: "Starter",
    description: "For individuals and freelancers",
    monthlyPrice: 19,
    yearlyPrice: 15,
    period: "per month",
    cta: "Start free trial",
    href: "/signup",
    popular: false,
    features: [
      { text: "1 user" },
      { text: "Unlimited documents" },
      { text: "Unlimited share links" },
      { text: "Full document analytics" },
      { text: "3 Spaces" },
      { text: "10 eSignatures per month" },
      { text: "Video walkthroughs" },
      { text: "Custom branding" },
    ],
  },
  {
    name: "Pro",
    description: "For growing teams and sales",
    monthlyPrice: 49,
    yearlyPrice: 39,
    period: "per month",
    cta: "Start free trial",
    href: "/signup",
    popular: true,
    features: [
      { text: "3 users included" },
      { text: "Everything in Starter" },
      { text: "Unlimited Spaces" },
      { text: "Unlimited eSignatures" },
      { text: "Bulk send" },
      { text: "NDA and agreements" },
      { text: "Dynamic watermarking" },
      { text: "Email OTP verification" },
      { text: "Compliance reports" },
      { text: "Version history" },
      { text: "Google Drive + OneDrive" },
    ],
  },
  {
    name: "Business",
    description: "For teams that need full control",
    monthlyPrice: 99,
    yearlyPrice: 79,
    period: "per month",
    cta: "Start free trial",
    href: "/signup",
    popular: false,
    features: [
      { text: "10 users included" },
      { text: "Everything in Pro" },
      { text: "Advanced data rooms" },
      { text: "Full audit logs" },
      { text: "Folder level permissions" },
      { text: "Advanced team management" },
      { text: "Custom docs domain" },
      { text: "Priority support" },
    ],
  },
]

const FAQS = [
  {
    q: "Can I try DocMetrics for free?",
    a: "Yes. The Free plan is free forever with no credit card required. You can upgrade anytime when you need more features.",
  },
  {
    q: "What happens when my free trial ends?",
    a: "You will be moved to the Free plan automatically. Your documents and data are kept safe. You can upgrade at any time.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no long-term contracts. You can cancel your subscription at any time and you will not be charged again.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 14-day money-back guarantee on all paid plans. If you are not satisfied contact our support team.",
  },
  {
    q: "Can I change my plan later?",
    a: "Yes. You can upgrade or downgrade your plan at any time from your account settings.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Your documents are encrypted in transit and at rest. You retain full ownership of everything you upload and can revoke access at any time.",
  },
]

const FeatureRow = ({
  name,
  availability,
  isLast = false,
}: {
  name: string
  availability: boolean[]
  isLast?: boolean
}) => (
  <div className={`grid grid-cols-5 gap-4 items-center py-3 ${!isLast ? "border-b border-slate-100" : ""}`}>
    <div className="col-span-1">
      <span className="text-sm text-slate-700">{name}</span>
    </div>
    {availability.map((available, idx) => (
      <div key={idx} className="flex justify-center">
        {available ? (
          <Check className="w-5 h-5 text-indigo-600" />
        ) : (
          <span className="text-slate-300 text-lg">—</span>
        )}
      </div>
    ))}
  </div>
)

const StorageRow = ({
  name,
  values,
  isLast = false,
}: {
  name: string
  values: string[]
  isLast?: boolean
}) => (
  <div className={`grid grid-cols-5 gap-4 items-center py-3 ${!isLast ? "border-b border-slate-100" : ""}`}>
    <div className="col-span-1">
      <span className="text-sm text-slate-700">{name}</span>
    </div>
    {values.map((value, idx) => (
      <div key={idx} className="flex justify-center">
        {value === "-" ? (
          <span className="text-slate-300 text-lg">—</span>
        ) : (
          <span className="text-sm text-slate-700 text-center">{value}</span>
        )}
      </div>
    ))}
  </div>
)

export function PricingContent() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">

      {/* Billing toggle */}
      <div className="flex justify-center mb-12">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-white rounded-2xl overflow-hidden flex flex-col ${
              plan.popular
                ? "ring-2 ring-indigo-600 shadow-xl"
                : "border border-slate-200 shadow-sm"
            }`}
          >
            {plan.popular && (
              <div className="bg-indigo-600 text-white text-xs font-semibold text-center py-2 tracking-wide">
                Most Popular
              </div>
            )}
            <div className="p-7 flex flex-col flex-1">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">
                    ${billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
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
              <Link
                href={plan.href}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all mb-8 ${
                  plan.popular
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : plan.monthlyPrice === 0
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                }`}
              >
                {plan.cta}
              </Link>
              <div className="space-y-3 flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
                  What is included
                </p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-sm text-slate-600 leading-relaxed">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Compare plans ── */}
      <div className="mt-24">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 text-center mb-3">
          Compare all plans
        </h2>
        <p className="text-center text-slate-500 mb-12 text-sm">
          See exactly what is included in each plan
        </p>

        {/* Header */}
        <div className="bg-slate-50 rounded-xl overflow-hidden mb-2">
          <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-slate-200">
            <div className="col-span-1" />
            {plans.map((plan) => (
              <div key={plan.name} className="text-center">
                <p className="font-semibold text-slate-900 text-sm">{plan.name}</p>
                <p className="text-xs text-slate-500">
                  ${billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                  {plan.monthlyPrice > 0 ? "/mo" : " free"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Core Features */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100 uppercase tracking-wide">
              Core Features
            </h3>
            <div className="space-y-1">
              <FeatureRow name="Unlimited documents" availability={[false, true, true, true]} />
              <FeatureRow name="Share links" availability={[true, true, true, true]} />
              <FeatureRow name="Document analytics" availability={[true, true, true, true]} />
              <FeatureRow name="Video walkthroughs" availability={[false, true, true, true]} />
              <FeatureRow name="Custom branding" availability={[false, true, true, true]} />
              <FeatureRow name="eSignatures" availability={[true, true, true, true]} />
              <FeatureRow name="Unlimited eSignatures" availability={[false, false, true, true]} />
              <FeatureRow name="Bulk send" availability={[false, false, true, true]} />
              <FeatureRow name="Version history" availability={[false, false, true, true]} isLast />
            </div>
          </div>
        </div>

        {/* Spaces */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100 uppercase tracking-wide">
              Spaces and Data Rooms
            </h3>
            <div className="space-y-1">
              <FeatureRow name="Spaces" availability={[true, true, true, true]} />
              <FeatureRow name="Unlimited Spaces" availability={[false, false, true, true]} />
              <FeatureRow name="Advanced data rooms" availability={[false, false, false, true]} />
              <FeatureRow name="Folder level permissions" availability={[false, false, false, true]} />
              <FeatureRow name="Full audit logs" availability={[false, false, false, true]} isLast />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100 uppercase tracking-wide">
              Security
            </h3>
            <div className="space-y-1">
              <FeatureRow name="Password protected links" availability={[false, true, true, true]} />
              <FeatureRow name="NDA and agreements" availability={[false, false, true, true]} />
              <FeatureRow name="Dynamic watermarking" availability={[false, false, true, true]} />
              <FeatureRow name="Email OTP verification" availability={[false, false, true, true]} />
              <FeatureRow name="Compliance reports" availability={[false, false, true, true]} isLast />
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100 uppercase tracking-wide">
              Storage
            </h3>
            <div className="space-y-1">
              <StorageRow name="Storage included" values={["1 GB", "10 GB", "50 GB", "100 GB"]} />
              <StorageRow name="Max file size" values={["10 MB", "100 MB", "500 MB", "2 GB"]} />
              <StorageRow name="Cloud integrations" values={["—", "—", "Drive + OneDrive", "Drive + OneDrive"]} isLast />
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100 uppercase tracking-wide">
              Team and Support
            </h3>
            <div className="space-y-1">
              <StorageRow name="Users included" values={["1", "1", "3", "10"]} />
              <FeatureRow name="Team management" availability={[false, false, true, true]} />
              <FeatureRow name="Priority support" availability={[false, false, false, true]} />
              <FeatureRow name="Custom docs domain" availability={[false, false, false, true]} isLast />
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="mt-24">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 text-center mb-12">
          Frequently asked questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {FAQS.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
              <h4 className="font-semibold text-slate-900 mb-2 text-sm">{item.q}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mt-16">
        <div className="rounded-2xl bg-indigo-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Start for free today.
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            No credit card required. Upload your first document and see real analytics in under two minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm text-sm"
            >
              Get started free
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Contact us
            </Link>
          </div>
          <p className="text-xs text-white/60 mt-5">No credit card required · Cancel anytime</p>
        </div>
      </div>

    </div>
  )
}