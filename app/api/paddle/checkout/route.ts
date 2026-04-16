// app/api/paddle/checkout/route.ts
//
// WHAT THIS FILE DOES:
//   Creates a Paddle checkout session when a logged-in user clicks "Upgrade"
//   on the /plan page. Returns a checkout URL that the frontend redirects to.
//   Paddle hosts the entire payment form — we never touch card details.
//
// WHY THIS MUST BE A BACKEND ROUTE (not a direct frontend call):
//   Your PADDLE_API_KEY is a secret. If the frontend called Paddle directly,
//   the key would be visible in the browser's DevTools to anyone. This route
//   keeps the key server-side only and returns just the checkout URL.
//
// FLOW:
//   1. Frontend sends { planId: "pro", billingCycle: "monthly" }
//   2. This route reads the user's identity from their JWT cookie
//   3. Looks up the correct Paddle price ID from environment variables
//   4. Calls Paddle API to create a checkout session
//   5. Returns { checkoutUrl } to the frontend
//   6. Frontend does window.location.href = checkoutUrl
//   7. User pays on Paddle's hosted page
//   8. Paddle redirects user to our success page
//   9. Paddle fires a webhook to Phase 4 — that is where the DB updates happen
//
// WHAT THIS ROUTE DOES NOT DO:
//   It does not update the database. It does not grant access. It does not
//   change the user's plan. ALL of that happens in the webhook handler (Phase 4)
//   because the redirect can arrive before the webhook and cannot be trusted.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { dbPromise } from '@/app/api/lib/mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// ─────────────────────────────────────────────────────────────────────────────
// PRICE ID MAP
//
// Maps every plan + billing cycle combination to the environment variable
// that holds the Paddle price ID. The price IDs themselves live in .env —
// never hardcoded here. To add a new plan later, add a row to this map
// and a matching variable to .env. Nothing else changes.
//
// Price ID format from Paddle: pri_XXXXXXXXXXXXXXXX
// ─────────────────────────────────────────────────────────────────────────────
const PRICE_ID_MAP: Record<string, string | undefined> = {
  'starter:monthly':  process.env.PADDLE_STARTER_MONTHLY_PRICE_ID,
  'starter:yearly':   process.env.PADDLE_STARTER_YEARLY_PRICE_ID,
  'pro:monthly':      process.env.PADDLE_PRO_MONTHLY_PRICE_ID,
  'pro:yearly':       process.env.PADDLE_PRO_YEARLY_PRICE_ID,
  'business:monthly': process.env.PADDLE_BUSINESS_MONTHLY_PRICE_ID,
  'business:yearly':  process.env.PADDLE_BUSINESS_YEARLY_PRICE_ID,
}

// ─────────────────────────────────────────────────────────────────────────────
// PADDLE API BASE URL
//
// Sandbox and production use different base URLs. We read PADDLE_ENVIRONMENT
// from .env so switching environments never requires a code change —
// just update the env var and redeploy.
//
// Sandbox:    https://sandbox-api.paddle.com
// Production: https://api.paddle.com
// ─────────────────────────────────────────────────────────────────────────────
function getPaddleApiBase(): string {
  return process.env.PADDLE_ENVIRONMENT === 'production'
    ? 'https://api.paddle.com'
    : 'https://sandbox-api.paddle.com'
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // ── Step 1: Authenticate the user ──────────────────────────────────────
    // We read the JWT from the cookie — same pattern as every other route.
    // If there is no valid token, we reject immediately. An anonymous user
    // must never be able to create a checkout session.
    const token =
      request.cookies.get('auth-token')?.value ||
      request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized — please log in first' },
        { status: 401 }
      )
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired session — please log in again' },
        { status: 401 }
      )
    }

    const userId = decoded.userId || decoded.id
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      )
    }

    // ── Step 2: Parse and validate the request body ─────────────────────────
    // The frontend sends { planId, billingCycle }.
    // planId is one of: "starter" | "pro" | "business"
    // billingCycle is one of: "monthly" | "yearly"
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { planId, billingCycle } = body

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: 'planId and billingCycle are required' },
        { status: 400 }
      )
    }

    const validPlans = ['starter', 'pro', 'business']
    const validCycles = ['monthly', 'yearly']

    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
        { status: 400 }
      )
    }

    if (!validCycles.includes(billingCycle)) {
      return NextResponse.json(
        { error: `Invalid billing cycle. Must be "monthly" or "yearly"` },
        { status: 400 }
      )
    }

    // ── Step 3: Look up the Paddle price ID ─────────────────────────────────
    // The map key combines planId and billingCycle: "pro:monthly"
    // If the price ID is missing from .env, we catch it here rather than
    // sending a malformed request to Paddle and getting a confusing error back.
    const priceKey = `${planId}:${billingCycle}`
    const priceId = PRICE_ID_MAP[priceKey]

    if (!priceId) {
      console.error(`❌ Missing Paddle price ID for key: ${priceKey}`)
      console.error('Check that PADDLE_' + priceKey.toUpperCase().replace(':', '_') + '_PRICE_ID is set in .env')
      return NextResponse.json(
        { error: 'This plan is not available right now. Please contact support.' },
        { status: 500 }
      )
    }

    // ── Step 4: Fetch the user's email from MongoDB ─────────────────────────
    // We pass the email to Paddle so their checkout form is pre-filled.
    // This reduces friction — the user does not have to type their email again.
    // We also pass it as custom_data so the webhook handler can find the right
    // user in our database when the payment completes (Phase 4).
    const db = await dbPromise
    let user: any

    try {
      const { ObjectId } = await import('mongodb')
      user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { email: 1, profile: 1, paddleCustomerId: 1 } }
      )
    } catch {
      user = await db.collection('users').findOne(
        { id: userId },
        { projection: { email: 1, profile: 1, paddleCustomerId: 1 } }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // ── Step 5: Build the success and cancel URLs ───────────────────────────
    // After payment Paddle redirects the user to success_url.
    // If the user closes the checkout without paying, Paddle redirects to
    // cancel_url so they land back on the plan selection page.
    //
    // We append ?session_id={checkout.id} to the success URL so the success
    // page can display a personalised message if needed in the future.
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://www.docmetrics.io'

    const successUrl = `${appUrl}/upgrade/success?plan=${planId}&cycle=${billingCycle}`
    const cancelUrl = `${appUrl}/plan?cancelled=true`

    // ── Step 6: Call Paddle API to create the checkout session ──────────────
    // We use Paddle's /transactions endpoint to create a one-time checkout.
    // custom_data is a free-form object Paddle passes back in the webhook —
    // this is how Phase 4 knows which user just paid and which plan to set.
    //
    // If the user has already paid before and has a paddleCustomerId, we pass
    // it so Paddle can pre-fill their saved payment method.
    const paddlePayload: any = {
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],
      customer: {
        email: user.email,
      },
      custom_data: {
        // These three fields are what the webhook handler reads in Phase 4
        // to know which user to update and which plan to assign.
        userId: userId,
        planId: planId,
        billingCycle: billingCycle,
      },
      checkout: {
  url: successUrl,
},
    }

    // If the user has an existing Paddle customer ID (returning customer),
    // attach it so Paddle can pre-fill their saved payment method.
    if (user.paddleCustomerId) {
      paddlePayload.customer = {
        ...paddlePayload.customer,
        id: user.paddleCustomerId,
      }
    }

    console.log(`🛒 Creating Paddle checkout for user ${userId}, plan: ${planId} ${billingCycle}`)

    const paddleRes = await fetch(
      `${getPaddleApiBase()}/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Paddle uses Bearer token authentication
          Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        },
        body: JSON.stringify(paddlePayload),
      }
    )

    // Always read as text first, then parse safely — Paddle can return HTML
    // error pages if the API key or base URL is wrong, which would crash JSON.parse
    const paddleText = await paddleRes.text()
    let paddleData: any

    try {
      paddleData = JSON.parse(paddleText)
    } catch {
      console.error('❌ Paddle API returned non-JSON response:', paddleText.slice(0, 300))
      return NextResponse.json(
        { error: 'Payment provider error. Please try again.' },
        { status: 502 }
      )
    }

    if (!paddleRes.ok) {
      // Paddle returns error details in paddleData.error
      console.error('❌ Paddle API error:', JSON.stringify(paddleData, null, 2))
      return NextResponse.json(
        {
          error: 'Failed to create checkout session.',
          // Only expose paddle error code in development — never in production
          ...(process.env.NODE_ENV === 'development' && {
            detail: paddleData?.error?.detail || paddleData?.error?.code,
          }),
        },
        { status: 502 }
      )
    }

    // ── Step 7: Extract the checkout URL and return it ──────────────────────
    // Paddle returns the checkout URL in data.url.
    // The frontend will redirect to this URL immediately.
     const checkoutUrl = paddleData?.data?.checkout?.url

    if (!checkoutUrl) {
      console.error('❌ Paddle response missing checkout URL:', JSON.stringify(paddleData, null, 2))
      return NextResponse.json(
        { error: 'Could not create checkout link. Please try again.' },
        { status: 502 }
      )
    }

    console.log(`✅ Paddle checkout created for ${user.email}, plan: ${planId}:${billingCycle}`)

    return NextResponse.json({
      success: true,
      checkoutUrl,
      // Return these so the frontend can show a loading state with plan name
      planId,
      billingCycle,
    })

  } catch (error: any) {
    console.error(' Checkout route error:', error?.message || error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}