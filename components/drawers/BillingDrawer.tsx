"use client"

// components/drawers/BillingDrawer.tsx
//
// WHAT THIS FILE DOES:
//   The billing drawer accessible from the dashboard top nav and mobile profile.
//   Shows the user their current plan, subscription status, storage usage,
//   trial countdown, and a link to manage their subscription via Paddle's
//   billing portal.
//
// PHASE 5 CHANGES — what was updated and why:
//
//   Before Phase 5, this drawer received a `user` prop and read plan from
//   user.profile.plan or user.plan — both stale paths that did not reflect
//   what the webhook wrote. It showed hardcoded plan features and no real
//   subscription lifecycle information.
//
//   Now it:
//     1. Calls getUserBilling() on open to get fresh billing data
//        (with cache: 'no-store' so it always reflects the latest webhook update)
//     2. Shows the real plan name, status, billing cycle, and period end date
//     3. Shows a trial countdown with days remaining
//     4. Shows a storage progress bar with real usage vs plan limit
//     5. Shows a "Manage billing" link to Paddle's hosted billing portal
//        where users can update their card, view invoices, or cancel
//     6. Shows contextual banners for canceled, past_due, and trial states
//
//   The `user` and `documents` props are kept for backwards compatibility
//   with the dashboard page that passes them, but billing data now comes
//   from its own fresh fetch rather than from those props.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, CreditCard, CheckCircle, AlertCircle, Clock, ExternalLink, TrendingUp } from 'lucide-react'
import { getUserBilling, type UserBilling } from '@/lib/getUserBilling'
import { getPlanLimits } from '@/lib/planLimits'

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────
interface BillingDrawerProps {
  open: boolean
  onClose: () => void
  user: any         // kept for backwards compatibility — name/email display
  documents: any[]  // kept for backwards compatibility — document count display
  onUpgrade: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 MB'
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / (1024 * 1024)
  return `${Math.round(mb)} MB`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

//   plan names and prices for display
const PLAN_INFO: Record<string, { label: string; monthlyPrice: string; yearlyPrice: string; color: string }> = {
  free:     { label: 'Free',     monthlyPrice: '$0',  yearlyPrice: '$0',  color: 'text-slate-600' },
  starter:  { label: 'Starter',  monthlyPrice: '$19', yearlyPrice: '$15', color: 'text-blue-600' },
  pro:      { label: 'Pro',      monthlyPrice: '$49', yearlyPrice: '$39', color: 'text-indigo-600' },
  business: { label: 'Business', monthlyPrice: '$99', yearlyPrice: '$79', color: 'text-purple-600' },
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function BillingDrawer({
  open,
  onClose,
  user,
  documents,
  onUpgrade,
}: BillingDrawerProps) {
  const router = useRouter()

  const [billing, setBilling] = useState<UserBilling | null>(null)
  const [loading, setLoading] = useState(false)

  // ── Fetch fresh billing data every time the drawer opens ─────────────────
  // We refetch on every open (not just on mount) so the drawer always shows
  // the current state after a recent payment or cancellation.
  useEffect(() => {
    if (!open) return
    setLoading(true)
    getUserBilling()
      .then(setBilling)
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  const plan = billing?.plan || 'free'
  const planInfo = PLAN_INFO[plan] || PLAN_INFO.free
  const limits = getPlanLimits(plan)
  const status = billing?.subscriptionStatus || 'inactive'

  // Storage from the user object — totalStorageUsedBytes is on the user doc
  // We read it from the user prop since checkAccess/me already computed it
  const storageUsed = user?.stats?.storageUsedBytes || 0
  const storageLimit = limits.storageLimitBytes
  const storagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100))

  // Price to show based on billing cycle
  const priceDisplay = billing?.billingCycle === 'yearly'
    ? `${planInfo.yearlyPrice}/mo (billed yearly)`
    : `${planInfo.monthlyPrice}/mo`

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Billing</h2>
              <p className="text-xs text-slate-500">Manage your subscription</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {loading ? (
            // Loading skeleton
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-20 bg-slate-100 rounded-xl" />
            </div>
          ) : (
            <>
              {/* ── Status banner ────────────────────────────────────────── */}
              {billing?.isTrialActive && (
                <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      Free trial — {billing.trialDaysRemaining} days remaining
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Trial ends {formatDate(billing.trialEndsAt)}. Add a plan to keep access.
                    </p>
                  </div>
                </div>
              )}

              {status === 'canceled' && billing?.currentPeriodEnd && (
                <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Subscription canceled
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Access continues until {formatDate(billing.currentPeriodEnd)}.
                    </p>
                  </div>
                </div>
              )}

              {status === 'past_due' && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Payment failed
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Please update your payment method to avoid losing access.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Current plan card ─────────────────────────────────────── */}
              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      Current plan
                    </p>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-2xl font-bold ${planInfo.color}`}>
                        {planInfo.label}
                      </h3>
                      {status === 'active' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                          Active
                        </span>
                      )}
                      {billing?.isTrialActive && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          Trial
                        </span>
                      )}
                      {status === 'canceled' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                          Cancels soon
                        </span>
                      )}
                      {status === 'past_due' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                          Past due
                        </span>
                      )}
                    </div>
                  </div>
                  {plan !== 'free' && !billing?.isTrialActive && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{priceDisplay}</p>
                    </div>
                  )}
                </div>

                {/* Period end info */}
                {billing?.currentPeriodEnd && status === 'active' && (
                  <p className="text-xs text-slate-500">
                    Next billing date: {formatDate(billing.currentPeriodEnd)}
                  </p>
                )}

                {/* Billing cycle */}
                {billing?.billingCycle && plan !== 'free' && (
                  <p className="text-xs text-slate-500 mt-1">
                    Billed {billing.billingCycle}
                  </p>
                )}
              </div>

              {/* ── Storage usage ─────────────────────────────────────────── */}
              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Storage</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
                  </p>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      storagePercent >= 95 ? 'bg-red-500' :
                      storagePercent >= 80 ? 'bg-amber-500' :
                      'bg-indigo-500'
                    }`}
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
                <p className={`text-xs mt-2 ${
                  storagePercent >= 95 ? 'text-red-600' :
                  storagePercent >= 80 ? 'text-amber-600' :
                  'text-slate-400'
                }`}>
                  {storagePercent >= 95
                    ? 'Storage almost full — upgrade or delete files'
                    : storagePercent >= 80
                    ? 'Storage running low'
                    : `${100 - storagePercent}% remaining`}
                </p>
              </div>

              {/* ── Usage stats ───────────────────────────────────────────── */}
              <div className="border border-slate-200 rounded-xl p-5">
                <p className="text-sm font-semibold text-slate-700 mb-4">Usage</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Documents</span>
                    <span className="text-sm font-medium text-slate-900">
                      {documents?.length ?? 0}
                      {limits.maxDocuments !== -1 ? ` / ${limits.maxDocuments}` : ' (unlimited)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Team members</span>
                    <span className="text-sm font-medium text-slate-900">
                      {limits.maxTeamMembers === 1 ? '1 (solo)' : `Up to ${limits.maxTeamMembers}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">eSignatures / month</span>
                    <span className="text-sm font-medium text-slate-900">
                      {limits.maxESignaturesPerMonth === -1 ? 'Unlimited' : limits.maxESignaturesPerMonth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Spaces</span>
                    <span className="text-sm font-medium text-slate-900">
                      {limits.maxSpaces === -1 ? 'Unlimited' : limits.maxSpaces}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Manage billing (Paddle portal) ────────────────────────── */}
              {plan !== 'free' && billing?.paddleCustomerId && (
                <div className="border border-slate-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Manage subscription
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Update your payment method, download invoices, or cancel
                    your subscription through Paddle's secure billing portal.
                  </p>
                  <a
                    href={`https://customer.paddle.com/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open billing portal
                  </a>
                </div>
              )}

            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white">
          {plan === 'free' || billing?.isTrialActive || status === 'canceled' ? (
            <button
              onClick={() => { onClose(); onUpgrade() }}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              {status === 'canceled' ? 'Resubscribe' : 'Upgrade plan'}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  )
}