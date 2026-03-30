"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  CheckCircle,
  Download,
  Settings,
  Sparkles,
  BarChart3,
  FileText,
  X,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
  plan?: string
}

type DocumentType = {
  _id: string
  filename: string
  size: number
  numPages: number
  createdAt: string
}

type Props = {
  open: boolean
  onClose: () => void
  user: UserType | null
  documents: DocumentType[]
  onUpgrade: () => void
}

export default function BillingDrawer({
  open,
  onClose,
  user,
  documents,
  onUpgrade,
}: Props) {
  const isFreePlan = !user?.plan || user?.plan?.toLowerCase() === "free"

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Billing & Subscription
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {isFreePlan
                    ? "Upgrade to unlock premium features"
                    : "Manage your subscription and billing"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isFreePlan ? (
                /* ── Free Plan View ────────────────────────────────────── */
                <div className="space-y-6 max-w-3xl">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border-2 border-slate-200 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
                      <FileText className="h-8 w-8 text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      You're on the Free Plan
                    </h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Upgrade to unlock unlimited documents, advanced analytics,
                      team collaboration, and more!
                    </p>

                    {/* Missing features */}
                    <div className="bg-white rounded-lg p-4 mb-6 border border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 mb-3">
                        What you're missing:
                      </p>
                      <div className="grid md:grid-cols-2 gap-3 text-left">
                        {[
                          "Unlimited documents",
                          "Advanced analytics",
                          "Team collaboration",
                          "Custom branding",
                        ].map((feature) => (
                          <div key={feature} className="flex items-start gap-2">
                            <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <X className="h-3 w-3 text-purple-600" />
                            </div>
                            <span className="text-sm text-slate-600">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => { onClose(); onUpgrade() }}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto px-8"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Compare Plans
                    </Button>
                  </div>

                  {/* Current Usage */}
                  <div className="bg-white rounded-lg border-2 p-6">
                    <h4 className="font-semibold text-slate-900 mb-4">
                      Current Usage
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Documents */}
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Documents</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-2xl font-bold text-slate-900">
                            {documents.length}
                          </p>
                          <p className="text-sm text-slate-500">/ 5</p>
                        </div>
                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            style={{
                              width: `${Math.min((documents.length / 5) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      {/* eSignatures */}
                      <div>
                        <p className="text-sm text-slate-600 mb-1">eSignatures</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-2xl font-bold text-slate-900">0</p>
                          <p className="text-sm text-slate-500">/ 4</p>
                        </div>
                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full w-0" />
                        </div>
                      </div>
                      {/* Team Members */}
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Team Members</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-2xl font-bold text-slate-900">1</p>
                          <p className="text-sm text-slate-500">/ 1</p>
                        </div>
                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full w-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Paid Plan View ────────────────────────────────────── */
                <div className="space-y-6 max-w-3xl">
                  {/* Active Subscription */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-bold text-slate-900">
                            {user?.plan} Plan
                          </h3>
                          <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Billed monthly • Next billing:{" "}
                          <span className="font-semibold">Jan 15, 2025</span>
                        </p>
                      </div>
                      <Button
                        onClick={() => { onClose(); onUpgrade() }}
                        variant="outline"
                        className="gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Compare Plans
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-purple-200">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Monthly Cost</p>
                        <p className="text-3xl font-bold text-slate-900">$45</p>
                        <p className="text-xs text-slate-500 mt-1">per user</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Documents</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {documents.length}
                        </p>
                        <p className="text-xs text-green-600 mt-1">Unlimited</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Storage Used</p>
                        <p className="text-3xl font-bold text-slate-900">2.4 GB</p>
                        <p className="text-xs text-slate-500 mt-1">of unlimited</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-lg border-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900">
                        Payment Method
                      </h4>
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          Visa ending in 4242
                        </p>
                        <p className="text-sm text-slate-500">Expires 12/2025</p>
                      </div>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div className="bg-white rounded-lg border-2 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900">
                        Billing History
                      </h4>
                      <Button variant="ghost" size="sm" className="text-purple-600">
                        View All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { date: "Dec 15, 2024", amount: "$45.00", invoice: "INV-001" },
                        { date: "Nov 15, 2024", amount: "$45.00", invoice: "INV-002" },
                        { date: "Oct 15, 2024", amount: "$45.00", invoice: "INV-003" },
                      ].map((inv) => (
                        <div
                          key={inv.invoice}
                          className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {inv.invoice}
                              </p>
                              <p className="text-xs text-slate-500">{inv.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-slate-900">
                              {inv.amount}
                            </span>
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                              <Download className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manage Subscription */}
                  <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <Settings className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 mb-1">
                          Need to make changes?
                        </p>
                        <p className="text-xs text-slate-600 mb-3">
                          Update your payment method, cancel subscription, or
                          change your plan.
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Cancel Subscription
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { onClose(); onUpgrade() }}
                          >
                            Change Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-white sticky bottom-0">
              <Button variant="outline" onClick={onClose} className="w-full h-11">
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}