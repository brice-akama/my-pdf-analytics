"use client"

// components/drawers/BillingDrawer.tsx
//
// CHANGES IN THIS VERSION:
//   - Added "Manage payment method" button that opens Paddle Customer Portal
//   - Portal works in both sandbox and production
//   - Cancel button now shows "Plan already canceled" message if already canceled
//   - All other logic unchanged

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  X, CreditCard, AlertCircle, Clock,
  TrendingUp, ChevronRight, CheckCircle, ExternalLink, Loader2,
} from "lucide-react"
import { getUserBilling, type UserBilling } from "@/lib/getUserBilling"
import { getPlanLimits } from "@/lib/planLimits"

interface BillingDrawerProps {
  open: boolean
  onClose: () => void
  user: any
  documents: any[]
  onUpgrade: () => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB"
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / (1024 * 1024)
  return `${Math.round(mb)} MB`
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })
}

const PLAN_INFO: Record<string, { label: string; color: string; bg: string }> = {
  free:     { label: "Free",     color: "text-slate-700",  bg: "bg-slate-50"   },
  starter:  { label: "Starter",  color: "text-blue-700",   bg: "bg-blue-50"    },
  pro:      { label: "Pro",      color: "text-indigo-700", bg: "bg-indigo-50"  },
  business: { label: "Business", color: "text-purple-700", bg: "bg-purple-50"  },
}

type DrawerView = "main" | "cancel_confirm" | "cancel_success"

export default function BillingDrawer({ open, onClose, user, documents, onUpgrade }: BillingDrawerProps) {
  const router = useRouter()
  const [billing, setBilling] = useState<UserBilling | null>(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<DrawerView>("main")
  const [canceling, setCanceling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [canceledUntil, setCanceledUntil] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setView("main")
    setCancelError(null)
    setPortalError(null)
    setLoading(true)
    getUserBilling().then(setBilling).finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  const plan = billing?.plan || "free"
  const planInfo = PLAN_INFO[plan] || PLAN_INFO.free
  const limits = getPlanLimits(plan)
  const status = billing?.subscriptionStatus || "inactive"
  const storageUsed = user?.stats?.storageUsedBytes || 0
  const storageLimit = limits.storageLimitBytes
  const storagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100))

  // Can cancel if active or past_due and not already canceled and not free
  const canCancel = (status === "active" || status === "past_due") && plan !== "free"

  // Can open portal if user has a paddleCustomerId
  const canOpenPortal = !!billing?.paddleCustomerId && plan !== "free"

  const handleOpenPortal = async () => {
  // Customer Portal is not available in Paddle sandbox
  // It works automatically in production
  if (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT !== 'production') {
    setPortalError("Payment portal is only available in production. In sandbox, card updates are handled directly through Paddle.")
    return
  }

  setPortalLoading(true)
  setPortalError(null)
  try {
    const res = await fetch("/api/paddle/portal", {
      method: "POST",
      credentials: "include",
    })
    const data = await res.json()
    if (!res.ok) {
      setPortalError(data.error || "Could not open billing portal.")
      return
    }
    window.open(data.portalUrl, "_blank")
  } catch {
    setPortalError("Network error. Please try again.")
  } finally {
    setPortalLoading(false)
  }
}

  const handleCancelConfirm = async () => {
    setCanceling(true)
    setCancelError(null)
    try {
      const res = await fetch("/api/paddle/cancel", {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) {
        // Show the error message — includes "already canceled" message
        setCancelError(data.error || "Something went wrong.")
        return
      }
      setCanceledUntil(data.cancelAt)
      setView("cancel_success")
      getUserBilling().then(setBilling)
    } catch {
      setCancelError("Network error. Please try again.")
    } finally {
      setCanceling(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {view === "cancel_confirm" ? "Cancel subscription" :
                 view === "cancel_success" ? "Subscription canceled" : "Billing"}
              </h2>
              <p className="text-xs text-slate-500">
                {view === "cancel_confirm" ? "Please review before confirming" :
                 view === "cancel_success" ? "You still have access" :
                 "Manage your subscription"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl" />
              ))}
            </div>
          )}

          {/* Cancel success view */}
          {!loading && view === "cancel_success" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Done — subscription canceled
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                  You keep full access until{" "}
                  <span className="font-semibold text-slate-700">
                    {canceledUntil ? formatDate(canceledUntil) : "the end of your billing period"}
                  </span>.
                  After that your account moves to Free.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  Your documents and settings are kept permanently. You can resubscribe
                  anytime and everything picks up where you left off.
                </p>
              </div>
              <button
                onClick={() => { onClose(); router.push("/plan") }}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
              >
                Changed your mind? Resubscribe
              </button>
            </div>
          )}

          {/* Cancel confirmation view */}
          {!loading && view === "cancel_confirm" && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  What happens when you cancel
                </h3>
                <ul className="space-y-2.5">
                  {[
                    `You keep ${planInfo.label} access until ${formatDate(billing?.currentPeriodEnd || null)}`,
                    "After that date your account moves to the Free plan",
                    "Your documents, spaces, and contacts are never deleted",
                    "You can resubscribe at any time and everything is restored",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-[7px] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {cancelError && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{cancelError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setView("main")}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Keep my plan
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={canceling}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
                >
                  {canceling ? "Canceling..." : "Yes, cancel"}
                </button>
              </div>
            </div>
          )}

          {/* Main view */}
          {!loading && view === "main" && billing && (
            <div className="space-y-5">

              {/* Status banners */}
              {billing.isTrialActive && (
                <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      Free trial — {billing.trialDaysRemaining} days remaining
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Ends {formatDate(billing.trialEndsAt)}. Choose a plan to keep access.
                    </p>
                  </div>
                </div>
              )}

              {status === "canceled" && billing.currentPeriodEnd && (
                <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Subscription canceled</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Access until {formatDate(billing.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
              )}

              {status === "past_due" && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Payment failed</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Paddle is retrying automatically. Update your card below.
                    </p>
                  </div>
                </div>
              )}

              {/* Plan card */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className={`px-5 py-4 ${planInfo.bg} border-b border-slate-100`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Current plan
                      </p>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xl font-bold ${planInfo.color}`}>
                          {planInfo.label}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          status === "active" && !billing.isTrialActive
                            ? "bg-emerald-100 text-emerald-700"
                            : billing.isTrialActive
                            ? "bg-blue-100 text-blue-700"
                            : status === "canceled"
                            ? "bg-amber-100 text-amber-700"
                            : status === "past_due"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {status === "active" && !billing.isTrialActive ? "Active" :
                           billing.isTrialActive ? "Trial" :
                           status === "canceled" ? "Canceling" :
                           status === "past_due" ? "Past due" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    {plan !== "free" && (
                      <button
                        onClick={() => { onClose(); onUpgrade() }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        Change plan <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-5 py-3 space-y-2">
                  {billing.billingCycle && plan !== "free" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Billing</span>
                      <span className="font-medium text-slate-900 capitalize">
                        {billing.billingCycle}
                      </span>
                    </div>
                  )}
                  {billing.currentPeriodEnd && status === "active" && !billing.isTrialActive && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Next payment</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(billing.currentPeriodEnd)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Manage payment method — Paddle Customer Portal */}
              {canOpenPortal && (
                <div className="border border-slate-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    Payment method
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    Update your card, view invoices, and manage your billing details.
                  </p>
                  {portalError && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg mb-3">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{portalError}</p>
                    </div>
                  )}
                  <button
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                    className="w-full py-2.5 px-4 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {portalLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Opening portal...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        Manage payment method
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Storage */}
              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Storage</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(storageUsed)} of {formatBytes(storageLimit)}
                  </p>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      storagePercent >= 95
                        ? "bg-red-500"
                        : storagePercent >= 80
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                    }`}
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
                {storagePercent >= 80 && (
                  <p className={`text-xs mt-1.5 ${
                    storagePercent >= 95 ? "text-red-600" : "text-amber-600"
                  }`}>
                    {storagePercent >= 95
                      ? "Storage almost full — upgrade or delete files"
                      : "Storage running low"}
                  </p>
                )}
              </div>

              {/* Usage */}
              <div className="border border-slate-200 rounded-xl p-5">
                <p className="text-sm font-semibold text-slate-700 mb-4">Usage</p>
                <div className="space-y-3">
                  {[
                    {
                      label: "Documents",
                      value: limits.maxDocuments === -1
                        ? `${documents?.length ?? 0} (unlimited)`
                        : `${documents?.length ?? 0} / ${limits.maxDocuments}`,
                    },
                    {
                      label: "Team seats",
                      value: limits.maxTeamMembers === 1 ? "Solo" : `Up to ${limits.maxTeamMembers}`,
                    },
                    {
                      label: "eSignatures / month",
                      value: limits.maxESignaturesPerMonth === -1
                        ? "Unlimited"
                        : String(limits.maxESignaturesPerMonth),
                    },
                    {
                      label: "Spaces",
                      value: limits.maxSpaces === -1 ? "Unlimited" : String(limits.maxSpaces),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-sm font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel subscription button */}
              {/* Cancel subscription button */}
{canCancel && (
  <button
    onClick={() => setView("cancel_confirm")}
    className="w-full py-2.5 px-4 border border-slate-200 hover:border-red-200 hover:text-red-600 text-slate-400 text-sm font-medium rounded-xl transition-colors"
  >
    Cancel subscription
  </button>
)}

              {/* Already canceled message — shown instead of cancel button */}
              {status === "canceled" && (
                <div className="flex items-center justify-center py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-sm text-slate-500">
                    Plan already canceled — access ends {formatDate(billing.currentPeriodEnd)}
                  </p>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        {view === "main" && !loading && (
          <div className="px-6 py-4 border-t bg-white">
            {plan === "free" || billing?.isTrialActive || status === "canceled" ? (
              <button
                onClick={() => { onClose(); onUpgrade() }}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {status === "canceled"
                  ? "Resubscribe"
                  : billing?.isTrialActive
                  ? "Choose a plan"
                  : "Upgrade plan"}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}