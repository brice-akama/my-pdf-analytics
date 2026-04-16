"use client"

// app/upgrade/success/page.tsx
//
// WHAT THIS FILE DOES:
//   Shows a "payment successful" screen after Paddle redirects the user back
//   from the hosted checkout. Auto-redirects to the dashboard after 5 seconds.
//
// CRITICAL — WHY THIS PAGE DOES NOT GRANT ACCESS:
//   Paddle redirects the user here AND fires a webhook to our server
//   (POST /api/webhooks/paddle) roughly at the same time. The redirect
//   arrives in the browser first. The webhook may still be in flight.
//
//   If we updated the database on this page, we would have a race condition:
//     - User lands here
//     - We try to update DB — webhook hasn't arrived yet
//     - We read the DB — plan is still "trialing"
//     - We show wrong plan to the user
//
//   The webhook (Phase 4) is signed by Paddle and is the ONLY trustworthy
//   signal that a payment succeeded. This page is purely cosmetic.
//   It tells the user their payment went through and to wait a moment
//   while the webhook does its job in the background.
//
// WHAT THE URL LOOKS LIKE WHEN PADDLE REDIRECTS HERE:
//   /upgrade/success?plan=pro&cycle=monthly
//   We read these params to show a personalised message like
//   "Your Pro Monthly plan is being activated."

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"

// Human-readable plan names for the success message.
// These must match the planId values sent to the checkout route.
const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
}

export default function UpgradeSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read the plan and cycle from the URL Paddle redirected back to
  const planId = searchParams?.get("plan") || ""
  const billingCycle = searchParams?.get("cycle") || ""

  const planName = PLAN_NAMES[planId] || "your new plan"
  const cycleLabel = billingCycle === "yearly" ? "Yearly" : "Monthly"

  // Countdown state — counts down from 5, then redirects to dashboard.
  // We give 5 seconds because the webhook needs a moment to fire and
  // update the database. By the time the user reaches the dashboard,
  // their new plan should be active in 99% of cases.
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          // Use replace so the user cannot hit Back and return to this page
          router.replace("/dashboard")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">

        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">
          Payment successful!
        </h1>

        {/* Plan name */}
        <p className="text-lg text-slate-600 mb-2">
          Your{" "}
          <span className="font-semibold text-indigo-600">
            {planName} {cycleLabel}
          </span>{" "}
          plan is being activated.
        </p>

        {/* Explanation — sets correct expectations about the brief delay */}
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          It takes just a moment to update your account. You will have full
          access to all{" "}
          <span className="font-medium text-slate-700">{planName}</span>{" "}
          features by the time you reach your dashboard.
        </p>

        {/* Auto-redirect indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          <span>
            Taking you to your dashboard in{" "}
            <span className="font-semibold text-slate-700">{countdown}</span>{" "}
            {countdown === 1 ? "second" : "seconds"}…
          </span>
        </div>

        {/* Manual redirect link — for users who do not want to wait */}
        <button
          onClick={() => router.replace("/dashboard")}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline underline-offset-2 transition-colors"
        >
          Go to dashboard now
        </button>

        {/* Receipt note */}
        <p className="text-xs text-slate-400 mt-8">
          A receipt has been sent to your email by Paddle, our payment
          provider. If you have any questions about your payment, contact{" "}
          <a
            href="mailto:support@docmetrics.io"
            className="text-indigo-500 hover:text-indigo-600"
          >
            support@docmetrics.io
          </a>
        </p>
      </div>
    </div>
  )
}