"use client"

// components/dashboard/TrialBanner.tsx
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, ArrowRight } from "lucide-react"
import { getUserBilling, type UserBilling } from "@/lib/getUserBilling"

type BannerVariant = "trial_active" | "trial_urgent" | "trial_expired" | "canceled" | "past_due"

interface BannerConfig {
  containerClass: string
  pillClass: string
  pillText: string
  headline: string
  subtext: string
  mobileSubtext: string   // ← new: shown on mobile for urgent states
  ctaText: string
  ctaClass: string
  showCta: boolean
}

function getBannerConfig(
  variant: BannerVariant,
  daysLeft: number,
  endDate: string
): BannerConfig {
  switch (variant) {

    case "trial_active":
      return {
        containerClass: "bg-gradient-to-r from-blue-600 to-indigo-600",
        pillClass: "bg-white/20 text-white",
        pillText: "Free trial",
        // ── Exact count every day so users watch it tick down ──────────────
        headline: daysLeft === 1
          ? "Your trial ends today"
          : `${daysLeft} days left in your Pro trial`,
        subtext: `You have full Pro access until ${endDate}. Choose a plan before then to keep everything.`,
        mobileSubtext: "",   // mobile sees headline only — that's enough at >3 days
        ctaText: "Choose a plan",
        ctaClass: "bg-white text-indigo-700 hover:bg-blue-50",
        showCta: true,
      }

    case "trial_urgent":
      return {
        containerClass: "bg-gradient-to-r from-amber-500 to-orange-500",
        pillClass: "bg-white/20 text-white",
        // ── Pill also shows the number so it's visible even on very small screens
        pillText: daysLeft === 1 ? "Ends today" : `${daysLeft} days left`,
        headline: daysLeft === 1
          ? "Last day — your trial expires today"
          : `Only ${daysLeft} days left — trial expires ${endDate}`,
        subtext: `Upgrade now to keep your documents, share links, and Pro features after ${endDate}.`,
        // ── Mobile-visible line so phone users see the exact date ──────────
        mobileSubtext: `Expires ${endDate}`,
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
        mobileSubtext: "Upgrade to restore access.",
        ctaText: "See plans",
        ctaClass: "bg-white text-slate-800 hover:bg-slate-50",
        showCta: true,
      }

    case "canceled":
      return {
        containerClass: "bg-gradient-to-r from-amber-500 to-yellow-500",
        pillClass: "bg-white/20 text-white",
        pillText: "Cancels soon",
        headline: `Access ends ${endDate} — your subscription is canceled`,
        subtext: `You have full access until ${endDate}. Resubscribe to keep your plan.`,
        mobileSubtext: `Access until ${endDate}.`,
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
        mobileSubtext: "Update your payment method.",
        ctaText: "Update payment",
        ctaClass: "bg-white text-red-700 hover:bg-red-50",
        showCta: true,
      }
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export default function TrialBanner() {
  const router = useRouter()

  const [billing, setBilling] = useState<UserBilling | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
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

  function resolveVariant(): BannerVariant | null {
    if (!billing) return null

    const { subscriptionStatus, isTrialActive, trialDaysRemaining } = billing

    if (subscriptionStatus === "active" && !isTrialActive) return null

    if (subscriptionStatus === "trialing") {
      if (isTrialActive && trialDaysRemaining > 3) return "trial_active"
      if (isTrialActive && trialDaysRemaining <= 3) return "trial_urgent"
      return "trial_expired"
    }

    if (subscriptionStatus === "inactive") return "trial_expired"
    if (subscriptionStatus === "canceled") return "canceled"
    if (subscriptionStatus === "past_due") return "past_due"

    return null
  }

  const variant = resolveVariant()

  if (!loaded || dismissed || !variant || !billing) return null

  const endDate = formatDate(billing.currentPeriodEnd || billing.trialEndsAt)
  const config = getBannerConfig(variant, billing.trialDaysRemaining, endDate)

  const handleDismiss = () => {
    sessionStorage.setItem("trial_banner_dismissed", "true")
    setDismissed(true)
  }

  const handleCta = () => {
    router.push("/plan")
  }

  return (
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

          {/* Desktop subtext — full sentence */}
          {config.subtext && (
            <span className="hidden md:inline text-sm text-white/75 ml-2">
              {config.subtext}
            </span>
          )}

          {/* Mobile subtext — shown only for urgent/expired variants where
              the headline alone doesn't give enough info on a small screen */}
          {config.mobileSubtext && (
            <span className="md:hidden block text-xs text-white/75 mt-0.5">
              {config.mobileSubtext}
            </span>
          )}
        </div>
      </div>

      {/* Right: CTA + dismiss */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Desktop CTA */}
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

        {/* Mobile CTA */}
        {config.showCta && (
          <button
            onClick={handleCta}
            className="sm:hidden text-xs font-semibold text-white underline underline-offset-2"
          >
            {config.ctaText}
          </button>
        )}

        {/* Dismiss */}
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