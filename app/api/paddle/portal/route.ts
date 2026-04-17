// app/api/paddle/portal/route.ts
//
// WHAT THIS FILE DOES:
//   Generates a Paddle Customer Portal URL for the authenticated user.
//   The portal lets users update their payment method, view invoices,
//   and manage their subscription without leaving DocMetrics.
//
// WORKS IN BOTH SANDBOX AND PRODUCTION.

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

  // ── Step 2: Check the user has a Paddle customer ID ───────────────────────
  if (!user.paddleCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Please subscribe to a plan first." },
      { status: 400 }
    )
  }

  // ── Step 3: Call Paddle API to create a portal session ────────────────────
  const body: any = {}

  // If user has a subscription ID, pass it so the portal opens on that subscription
  if (user.paddleSubscriptionId) {
    body.subscription_ids = [user.paddleSubscriptionId]
  }

  const paddleRes = await fetch(
    `${getPaddleApiBase()}/customers/${user.paddleCustomerId}/portal-sessions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      },
      body: JSON.stringify(body),
    }
  )

  const paddleText = await paddleRes.text()
  let paddleData: any

  try {
    paddleData = JSON.parse(paddleText)
  } catch {
    console.error("❌ Paddle portal: non-JSON response:", paddleText.slice(0, 200))
    return NextResponse.json(
      { error: "Payment provider error. Please try again." },
      { status: 502 }
    )
  }

  if (!paddleRes.ok) {
    console.error("❌ Paddle portal error:", JSON.stringify(paddleData, null, 2))
    return NextResponse.json(
      { error: "Failed to open billing portal. Please try again or contact support." },
      { status: 502 }
    )
  }

  // ── Step 4: Return the portal URL ─────────────────────────────────────────
  // urls.general.overview is the main portal page
  // urls.subscriptions is an array of subscription-specific URLs
  const portalUrl =
    paddleData?.data?.urls?.general?.overview ||
    paddleData?.data?.urls?.subscriptions?.[0]?.cancel_subscription ||
    null

  if (!portalUrl) {
    console.error("❌ Paddle portal: no URL in response:", JSON.stringify(paddleData, null, 2))
    return NextResponse.json(
      { error: "Could not generate billing portal link. Please try again." },
      { status: 502 }
    )
  }

  console.log(`✅ Paddle portal session created for user ${user.email}`)

  return NextResponse.json({
    success: true,
    portalUrl,
  })
}