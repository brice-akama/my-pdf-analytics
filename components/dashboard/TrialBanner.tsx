"use client"

// components/dashboard/TrialBanner.tsx
//
// WHAT THIS FILE DOES:
//   Shows a dismissible banner at the top of the dashboard when the user is
//   on a free trial or when their access is in a non-standard state
//   (canceled, past_due, expired). Each state has its own message and colour.
//
// WHEN IT SHOWS:
//   - Trial active with more than 3 days left: blue informational banner
//   - Trial expiring in 3 days or fewer: amber urgent banner
//   - Trial expired (no plan): red action-required banner
//   - Subscription canceled (access still active): amber warning banner
//   - Payment failed (past_due): red action-required banner
//
// WHEN IT DOES NOT SHOW:
//   - User is on an active paid subscription
//   - User has already dismissed it this session (stored in sessionStorage)
//     Note: we use sessionStorage not localStorage so the banner reappears
//     on the next login session — the user is reminded each time they log in,
//     not just once ever.
//
// HOW TO USE IT IN THE DASHBOARD:
//   1. Import TrialBanner at the top of your dashboard page
//   2. Place it as the FIRST element inside the <main> content area,
//      above everything else including the page title.
//   See the comment block at the bottom of this file for exact placement.

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, ArrowRight } from "lucide-react"
import { getUserBilling, type UserBilling } from "@/lib/getUserBilling"

// ─────────────────────────────────────────────────────────────────────────────
// BANNER VARIANTS
// Each variant has a colour scheme, headline, and call to action.
// ─────────────────────────────────────────────────────────────────────────────
type BannerVariant = "trial_active" | "trial_urgent" | "trial_expired" | "canceled" | "past_due"

interface BannerConfig {
  containerClass: string
  pillClass: string
  pillText: string
  headline: string
  subtext: string
  ctaText: string
  ctaClass: string
  showCta: boolean
}

function getBannerConfig(variant: BannerVariant, daysLeft: number, endDate: string): BannerConfig {
  switch (variant) {
    case "trial_active":
      return {
        containerClass: "bg-gradient-to-r from-blue-600 to-indigo-600",
        pillClass: "bg-white/20 text-white",
        pillText: "Free trial",
        headline: `${daysLeft} days left in your trial`,
        subtext: "You have full Pro access. Add a plan before your trial ends to keep everything.",
        ctaText: "Choose a plan",
        ctaClass: "bg-white text-indigo-700 hover:bg-blue-50",
        showCta: true,
      }

    case "trial_urgent":
      return {
        containerClass: "bg-gradient-to-r from-amber-500 to-orange-500",
        pillClass: "bg-white/20 text-white",
        pillText: daysLeft === 1 ? "Last day" : `${daysLeft} days left`,
        headline: "Your trial is ending very soon",
        subtext: `Trial ends ${endDate}. Add a plan now to avoid losing access to your documents and settings.`,
        ctaText: "Upgrade now",
        ctaClass: "bg-white text-amber-700 hover:bg-amber-50",
        showCta: true,
      }

    case "trial_expired":
      return {
        containerClass: "bg-gradient-to-r from-slate-700 to-slate-900",
        pillClass: "bg-white/20 text-white",
        pillText: "Trial ended",
        headline: "Your free trial has expired",
        subtext: "You are now on the Free plan. Upgrade to restore full access to your documents.",
        ctaText: "See plans",
        ctaClass: "bg-white text-slate-800 hover:bg-slate-50",
        showCta: true,
      }

    case "canceled":
      return {
        containerClass: "bg-gradient-to-r from-amber-500 to-yellow-500",
        pillClass: "bg-white/20 text-white",
        pillText: "Cancels soon",
        headline: "Your subscription is canceled",
        subtext: `You have access until ${endDate}. Resubscribe to keep your plan and avoid downgrading.`,
        ctaText: "Resubscribe",
        ctaClass: "bg-white text-amber-700 hover:bg-amber-50",
        showCta: true,
      }

    case "past_due":
      return {
        containerClass: "bg-gradient-to-r from-red-600 to-rose-600",
        pillClass: "bg-white/20 text-white",
        pillText: "Payment failed",
        headline: "We could not process your last payment",
        subtext: "Paddle will retry automatically. Update your payment method to avoid any interruption.",
        ctaText: "Update payment",
        ctaClass: "bg-white text-red-700 hover:bg-red-50",
        showCta: true,
      }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT DATE
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TrialBanner() {
  const router = useRouter()

  const [billing, setBilling] = useState<UserBilling | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // ── Fetch billing state on mount ─────────────────────────────────────────
  useEffect(() => {
    // Check sessionStorage first — if dismissed this session, stay hidden
    const wasDismissed = sessionStorage.getItem("trial_banner_dismissed")
    if (wasDismissed === "true") {
      setDismissed(true)
      setLoaded(true)
      return
    }

    getUserBilling().then((data) => {
      setBilling(data)
      setLoaded(true)
    })
  }, [])

  // ── Determine which variant to show (if any) ─────────────────────────────
  function resolveVariant(): BannerVariant | null {
    if (!billing) return null

    const { subscriptionStatus, isTrialActive, trialDaysRemaining, plan } = billing

    // Active paid subscription — no banner needed
    if (subscriptionStatus === "active" && !isTrialActive) return null

    // Trial states
    if (subscriptionStatus === "trialing") {
      if (isTrialActive && trialDaysRemaining > 3) return "trial_active"
      if (isTrialActive && trialDaysRemaining <= 3) return "trial_urgent"
      // subscriptionStatus is trialing but isTrialActive is false means expired
      return "trial_expired"
    }

    // Inactive (trial expired, never paid)
    if (subscriptionStatus === "inactive") return "trial_expired"

    // Canceled but still has access
    if (subscriptionStatus === "canceled") return "canceled"

    // Payment failed
    if (subscriptionStatus === "past_due") return "past_due"

    return null
  }

  const variant = resolveVariant()

  // Do not render if: still loading, already dismissed, or no banner needed
  if (!loaded || dismissed || !variant || !billing) return null

  const endDate = formatDate(billing.currentPeriodEnd || billing.trialEndsAt)
  const config = getBannerConfig(variant, billing.trialDaysRemaining, endDate)

  const handleDismiss = () => {
    // Store dismissal in sessionStorage — reappears on next login session
    sessionStorage.setItem("trial_banner_dismissed", "true")
    setDismissed(true)
  }

  const handleCta = () => {
    router.push("/plan")
  }

  return (
    // Animate in smoothly — uses a simple CSS transition via the translate classes
    <div
      className={`
        w-full ${config.containerClass}
        px-4 py-3
        flex items-center justify-between gap-4
        transition-all duration-300 ease-out
      `}
      role="banner"
      aria-label="Subscription status"
    >
      {/* Left: pill + headline + subtext */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Status pill */}
        <span
          className={`
            hidden sm:inline-flex
            items-center px-2.5 py-0.5 rounded-full
            text-xs font-semibold whitespace-nowrap flex-shrink-0
            ${config.pillClass}
          `}
        >
          {config.pillText}
        </span>

        {/* Text block */}
        <div className="min-w-0">
          <span className="text-sm font-semibold text-white">
            {config.headline}
          </span>
          <span className="hidden md:inline text-sm text-white/75 ml-2">
            {config.subtext}
          </span>
        </div>
      </div>

      {/* Right: CTA button + dismiss */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {config.showCta && (
          <button
            onClick={handleCta}
            className={`
              hidden sm:flex items-center gap-1.5
              px-3 py-1.5 rounded-lg
              text-xs font-semibold
              transition-colors duration-150
              ${config.ctaClass}
            `}
          >
            {config.ctaText}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}

        {/* Mobile CTA — just "Upgrade" text link */}
        {config.showCta && (
          <button
            onClick={handleCta}
            className="sm:hidden text-xs font-semibold text-white underline underline-offset-2"
          >
            {config.ctaText}
          </button>
        )}

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="
            h-7 w-7 rounded-full
            flex items-center justify-center
            text-white/70 hover:text-white hover:bg-white/15
            transition-colors duration-150
          "
          aria-label="Dismiss this banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW TO ADD THIS BANNER TO YOUR DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
//
// STEP 1: Import TrialBanner at the top of your dashboard page file.
//   Add this import alongside your other component imports:
//
//   import TrialBanner from "@/components/dashboard/TrialBanner"
//
// STEP 2: Find this block in your DashboardPage return statement:
//
//   <div className="flex min-h-[calc(100vh-64px)]">
//     {/* Sidebar */}
//     <Sidebar activePage={activePage} onNavigate={setActivePage} />
//
//     {/* Main Content */}
//     <main className="flex-1 p-8">
//       <div className="max-w-7xl mx-auto">
//         {renderContent()}
//       </div>
//     </main>
//   </div>
//
// STEP 3: Change it to this — the banner sits ABOVE the flex row so it
//   stretches the full width across both sidebar and content:
//
//   <>
//     {/* Trial / subscription status banner */}
//     <TrialBanner />
//
//     <div className="flex min-h-[calc(100vh-64px)]">
//       {/* Sidebar */}
//       <Sidebar activePage={activePage} onNavigate={setActivePage} />
//
//       {/* Main Content */}
//       <main className="flex-1 p-8">
//         <div className="max-w-7xl mx-auto">
//           {renderContent()}
//         </div>
//       </main>
//     </div>
//   </>
//
// That is all. The component handles its own data fetching, variant logic,
// and dismissal. The dashboard page does not need any new props or state.