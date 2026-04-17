// app/api/paddle/cancel/route.ts
//
// WHAT THIS FILE DOES:
//   Cancels the user's Paddle subscription when they click "Cancel plan"
//   inside the BillingDrawer. The cancellation is processed through Paddle's
//   API so the user never needs to leave DocMetrics.
//
// WHAT HAPPENS AFTER THIS ROUTE RUNS:
//   1. Paddle marks the subscription as scheduled to cancel at period end
//   2. Paddle fires a subscription.canceled webhook to /api/webhooks/paddle
//   3. Our webhook handler sets user.subscriptionStatus = "canceled"
//      and stores the cancelAt date
//   4. The user keeps access until currentPeriodEnd
//   5. The BillingDrawer updates on next open to show the "Cancels soon" state

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { checkAccess } from "@/lib/checkAccess"

function getPaddleApiBase(): string {
  return process.env.PADDLE_ENVIRONMENT === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com"
}

export async function POST(request: NextRequest) {

  // ── Step 1: Authenticate ──────────────────────────────────────────────────
  const access = await checkAccess(request)
  if (!access.ok) return access.response

  const { user } = access

  // ── Step 2: Check the user has a subscription to cancel ──────────────────
  if (!user.paddleSubscriptionId) {
    return NextResponse.json(
      { error: "No active subscription found." },
      { status: 400 }
    )
  }

  // ── Step 3: Check if already canceled ────────────────────────────────────
  // If already canceled or inactive, tell the user clearly instead of
  // making a pointless API call to Paddle.
  if (user.subscriptionStatus === "canceled") {
    return NextResponse.json(
      { error: "Your plan is already canceled. You still have access until your billing period ends." },
      { status: 400 }
    )
  }

  if (user.subscriptionStatus === "inactive") {
    return NextResponse.json(
      { error: "You do not have an active subscription to cancel." },
      { status: 400 }
    )
  }

  // ── Step 4: Call Paddle API to cancel the subscription ───────────────────
  // "effective_from": "next_billing_period" means the subscription stays
  // active until the end of the current billing period.
  const paddleRes = await fetch(
    `${getPaddleApiBase()}/subscriptions/${user.paddleSubscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      },
      body: JSON.stringify({
        effective_from: "next_billing_period",
      }),
    }
  )

  const paddleText = await paddleRes.text()
  let paddleData: any

  try {
    paddleData = JSON.parse(paddleText)
  } catch {
    console.error("❌ Paddle cancel: non-JSON response:", paddleText.slice(0, 200))
    return NextResponse.json(
      { error: "Payment provider error. Please try again." },
      { status: 502 }
    )
  }

  if (!paddleRes.ok) {
    console.error("❌ Paddle cancel error:", JSON.stringify(paddleData, null, 2))
    return NextResponse.json(
      { error: "Failed to cancel subscription. Please try again or contact support." },
      { status: 502 }
    )
  }

  console.log(`✅ Subscription canceled for user ${user.email}, sub ID: ${user.paddleSubscriptionId}`)

  return NextResponse.json({
    success: true,
    message: "Your subscription has been canceled. You will keep access until your current billing period ends.",
    cancelAt: paddleData?.data?.current_billing_period?.ends_at || null,
  })
}