// app/api/webhooks/paddle/route.ts
//
// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — PADDLE WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════════════════════
//
// WHAT THIS FILE IS:
//   This is the most important file in the entire payment integration.
//   Everything else — the checkout route, the success page, the plan page —
//   is just UI. THIS file is what actually gives users access to what they
//   paid for. Without this, users can pay and nothing changes in their account.
//
// HOW IT WORKS:
//   After a payment event happens (success, cancellation, renewal, failure),
//   Paddle sends an HTTP POST to this URL with a JSON body describing what
//   happened. This route:
//     1. Verifies the request genuinely came from Paddle (signature check)
//     2. Reads the event type to know what happened
//     3. Updates the user's MongoDB document accordingly
//     4. Returns 200 OK so Paddle knows we processed it
//
// WHY THE WEBHOOK IS THE SOURCE OF TRUTH (not the redirect):
//   The success page redirect and the webhook fire at roughly the same time
//   after a payment. The redirect arrives in the browser first — but it can
//   be faked. Anyone can visit /upgrade/success?plan=pro in their browser.
//   The webhook is signed with your PADDLE_WEBHOOK_SECRET — it is
//   cryptographically impossible to fake without that secret. This is why
//   we NEVER update the database in the success page. Only here.
//
// WHY WE RETURN 200 EVEN ON SOME ERRORS:
//   If this route returns anything other than 200, Paddle treats it as a
//   failed delivery and retries the webhook up to 24 hours. This can cause
//   the same event to be processed multiple times. So we return 200 for
//   events we do not handle (unknown event types) and only return non-200
//   for genuine infrastructure failures (DB down, signature invalid).
//
// PADDLE WEBHOOK EVENTS WE HANDLE:
//   subscription.created   → user just subscribed, activate their plan
//   subscription.updated   → plan changed or payment method updated
//   subscription.canceled  → user canceled, set their end date
//   subscription.activated → subscription moved from trialing to active
//   transaction.completed  → payment succeeded (fires on renewals too)
//   transaction.payment_failed → payment failed, notify, set past_due
//
// HOW PADDLE IDENTIFIES WHICH USER THIS IS:
//   When we created the checkout session in Phase 3, we passed:
//     custom_data: { userId, planId, billingCycle }
//   Paddle stores this and sends it back in every event for this transaction.
//   We use custom_data.userId to find the user in MongoDB.
//   We also store paddleCustomerId so future events from the same customer
//   can be matched even if custom_data is missing (e.g. renewals, disputes).

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import crypto from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// PLAN NAME NORMALISER
//
// Paddle sends plan information in custom_data.planId which we set when
// creating the checkout. This helper ensures we only ever write one of our
// four valid plan names to the database regardless of what comes in.
// If something unexpected arrives, we default to "free" — the safest choice
// because it never grants more than was paid for.
// ─────────────────────────────────────────────────────────────────────────────
function normalisePlan(raw: string | undefined | null): string {
  const valid = ['free', 'starter', 'pro', 'business']
  const cleaned = (raw || '').toLowerCase().trim()
  return valid.includes(cleaned) ? cleaned : 'free'
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE VERIFICATION
//
// Every webhook Paddle sends includes an HTTP header called
// "paddle-signature" that looks like:
//   ts=1712345678;h1=abc123def456...
//
// The signature is an HMAC-SHA256 hash of (timestamp + ":" + raw body)
// using your PADDLE_WEBHOOK_SECRET as the key.
//
// We verify this before touching the database so that:
//   a) Fake/forged webhooks from bad actors are rejected immediately
//   b) Replayed old webhooks (where someone captures and resends a real one)
//      are rejected if the timestamp is too old (we allow 5 minutes)
//
// IMPORTANT: We must read the raw request body as text BEFORE parsing it
// as JSON. If we parse JSON first and then stringify it back, the byte order
// and whitespace may differ from the original, making the signature invalid.
// ─────────────────────────────────────────────────────────────────────────────
function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) {
    console.error('❌ Webhook missing paddle-signature header')
    return false
  }

  // Parse "ts=1712345678;h1=abc123..." into parts
  const parts = Object.fromEntries(
    signatureHeader.split(';').map((p) => p.split('=') as [string, string])
  )

  const timestamp = parts['ts']
  const receivedSignature = parts['h1']

  if (!timestamp || !receivedSignature) {
    console.error('❌ Webhook signature header malformed:', signatureHeader)
    return false
  }

  // Reject webhooks older than 5 minutes to prevent replay attacks.
  // A replay attack is when someone captures a valid webhook and sends it
  // again later — e.g. to re-activate a plan that was already cancelled.
  const webhookAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
  if (webhookAge > 300) {
    console.error(`❌ Webhook too old: ${webhookAge} seconds`)
    return false
  }

  // Compute the expected signature using the same algorithm Paddle uses
  const signedPayload = `${timestamp}:${rawBody}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  // Use timingSafeEqual to prevent timing attacks.
  // A timing attack is when an attacker can guess the secret by measuring
  // how long the comparison takes. timingSafeEqual always takes the same time.
  try {
    const expected = Buffer.from(expectedSignature, 'hex')
    const received = Buffer.from(receivedSignature, 'hex')
    if (expected.length !== received.length) return false
    return crypto.timingSafeEqual(expected, received)
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIND USER HELPER
//
// We try two strategies to find the user this event belongs to:
//
// Strategy 1 — custom_data.userId (most reliable for new subscriptions)
//   We set this when creating the checkout in Phase 3. Paddle stores it
//   and echoes it back in every event for that transaction.
//
// Strategy 2 — paddleCustomerId (reliable for renewals and future events)
//   After the first payment, we store the Paddle customer ID on the user
//   document. Every subsequent event from Paddle includes the customer ID
//   so we can find the user even without custom_data.
//
// We try Strategy 1 first because it is more specific. If custom_data is
// missing (can happen on renewals if Paddle does not echo it), we fall
// back to Strategy 2.
// ─────────────────────────────────────────────────────────────────────────────
async function findUser(db: any, customData: any, customerId: string | null) {
  // Strategy 1: use userId from custom_data we set at checkout time
  if (customData?.userId) {
    try {
      const { ObjectId } = await import('mongodb')
      const user = await db.collection('users').findOne({
        _id: new ObjectId(customData.userId),
      })
      if (user) return user
    } catch {
      // ObjectId parse failed — try string match
      const user = await db.collection('users').findOne({
        id: customData.userId,
      })
      if (user) return user
    }
  }

  // Strategy 2: use the Paddle customer ID we stored after first payment
  if (customerId) {
    const user = await db.collection('users').findOne({
      paddleCustomerId: customerId,
    })
    if (user) return user
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN WEBHOOK HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // ── Step 1: Read raw body as text ────────────────────────────────────────
  // We MUST read as text before any JSON parsing. The signature verification
  // requires the exact bytes Paddle sent. JSON.parse + JSON.stringify would
  // change whitespace and break the signature check.
  const rawBody = await request.text()

  // ── Step 2: Verify the webhook signature ─────────────────────────────────
  // Reject immediately if the signature is invalid. This protects against:
  //   - Random HTTP scanners hitting our webhook URL
  //   - Attackers trying to fake a payment event
  //   - Replayed old webhooks
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET
  if (!webhookSecret) {
    // If the secret is not configured, something is wrong with our deployment.
    // We return 500 here (not 200) so Paddle retries and we notice the problem.
    console.error('❌ PADDLE_WEBHOOK_SECRET is not set in environment variables')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  const signatureHeader = request.headers.get('paddle-signature')
  const isValid = verifyPaddleSignature(rawBody, signatureHeader, webhookSecret)

  if (!isValid) {
    console.error('❌ Paddle webhook signature verification failed')
    // Return 401 so Paddle does NOT retry — this is not a transient error,
    // it means the request is not from Paddle
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  // ── Step 3: Parse the JSON body ──────────────────────────────────────────
  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    console.error('❌ Webhook body is not valid JSON')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType: string = event?.event_type || ''
  const eventData: any = event?.data || {}

  console.log(`📨 Paddle webhook received: ${eventType}`)

  // ── Step 4: Connect to MongoDB ───────────────────────────────────────────
  const db = await dbPromise

  // ── Step 5: Route to the correct handler based on event type ─────────────
  // Each event type means something different happened and requires a
  // different database update. We handle each one explicitly rather than
  // using a generic handler so the logic for each is clear and auditable.
  try {
    switch (eventType) {

      // ──────────────────────────────────────────────────────────────────────
      // EVENT: subscription.created
      //
      // WHEN IT FIRES: The user just completed their first payment and a
      // recurring subscription was created in Paddle.
      //
      // WHAT WE DO:
      //   - Set their plan to what they purchased
      //   - Set status to "active"
      //   - Store the Paddle customer ID and subscription ID
      //   - Set currentPeriodEnd so we know when to check access
      //   - Set billingCycle (monthly or yearly)
      //
      // WHY WE STORE paddleSubscriptionId:
      //   We need this to cancel or modify the subscription later when the
      //   user requests it from the billing settings page.
      // ──────────────────────────────────────────────────────────────────────
      case 'subscription.created': {
        const customData = eventData.custom_data || {}
        const customerId = eventData.customer_id || null
        const subscriptionId = eventData.id || null
        const planId = normalisePlan(customData.planId)
        const billingCycle = customData.billingCycle || 'monthly'

        // currentPeriodEnd tells us when this billing period ends.
        // Paddle sends it as an ISO string in next_billed_at or
        // current_billing_period.ends_at depending on the API version.
        const periodEnd =
          eventData.current_billing_period?.ends_at ||
          eventData.next_billed_at ||
          null

        const user = await findUser(db, customData, customerId)
        if (!user) {
          console.error(
            `❌ subscription.created: user not found. customData: ${JSON.stringify(customData)}, customerId: ${customerId}`
          )
          // Return 200 anyway — we do not want Paddle to retry endlessly
          // for a user that genuinely does not exist. Log it for investigation.
          return NextResponse.json({ received: true })
        }

        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              plan: planId,
              subscriptionStatus: 'active',
              paddleCustomerId: customerId,
              paddleSubscriptionId: subscriptionId,
              currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
              billingCycle,
              updated_at: new Date(),
            },
          }
        )

        // Mirror the plan on the profile document too so profile lookups
        // always reflect the current billing state
        await db.collection('profiles').updateOne(
          { user_id: user._id.toString() },
          { $set: { plan: planId, subscriptionStatus: 'active' } }
        )

        console.log(
          `✅ subscription.created: user ${user.email} → plan: ${planId}, cycle: ${billingCycle}`
        )
        break
      }

      // ──────────────────────────────────────────────────────────────────────
      // EVENT: subscription.activated
      //
      // WHEN IT FIRES: A subscription moves from "trialing" state to "active"
      // (when a free trial converts to a paid subscription).
      // Also fires when a previously paused subscription is resumed.
      //
      // WHAT WE DO: Same as subscription.created — activate the plan.
      // We handle it separately because some Paddle configurations only fire
      // this event and not subscription.created for trial conversions.
      // ──────────────────────────────────────────────────────────────────────
      case 'subscription.activated': {
        const customData = eventData.custom_data || {}
        const customerId = eventData.customer_id || null
        const subscriptionId = eventData.id || null
        const planId = normalisePlan(customData.planId)
        const billingCycle = customData.billingCycle || 'monthly'

        const periodEnd =
          eventData.current_billing_period?.ends_at ||
          eventData.next_billed_at ||
          null

        const user = await findUser(db, customData, customerId)
        if (!user) {
          console.error(`❌ subscription.activated: user not found`)
          return NextResponse.json({ received: true })
        }

        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              plan: planId,
              subscriptionStatus: 'active',
              paddleCustomerId: customerId,
              paddleSubscriptionId: subscriptionId,
              currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
              billingCycle,
              updated_at: new Date(),
            },
          }
        )

        await db.collection('profiles').updateOne(
          { user_id: user._id.toString() },
          { $set: { plan: planId, subscriptionStatus: 'active' } }
        )

        console.log(
          `✅ subscription.activated: user ${user.email} → plan: ${planId}`
        )
        break
      }

      // ──────────────────────────────────────────────────────────────────────
      // EVENT: subscription.updated
      //
      // WHEN IT FIRES: Many things can trigger this:
      //   - User upgraded from Starter → Pro
      //   - User downgraded from Pro → Starter
      //   - User switched from monthly → yearly billing
      //   - User updated their payment method
      //   - Paddle updated the subscription internally
      //
      // WHAT WE DO:
      //   Update the plan, billing cycle, and period end date.
      //   We check the subscription status from the event payload to handle
      //   the case where this update event fires alongside a cancellation.
      //
      // WHY WE CHECK status IN THE EVENT:
      //   Paddle sometimes fires subscription.updated instead of
      //   subscription.canceled for immediate cancellations. Reading the
      //   status field from the event payload handles both cases correctly.
      // ──────────────────────────────────────────────────────────────────────
      case 'subscription.updated': {
        const customData = eventData.custom_data || {}
        const customerId = eventData.customer_id || null
        const subscriptionStatus = eventData.status || 'active'

        // For upgrades/downgrades, the new plan comes from custom_data.
        // Paddle does not automatically know our plan names — we set them.
        const planId = normalisePlan(customData.planId)
        const billingCycle = customData.billingCycle || 'monthly'

        const periodEnd =
          eventData.current_billing_period?.ends_at ||
          eventData.next_billed_at ||
          null

        // cancelAt is set when status is "canceled" — the date access ends
        const cancelAt =
          eventData.current_billing_period?.ends_at || null

        const user = await findUser(db, customData, customerId)
        if (!user) {
          console.error(`❌ subscription.updated: user not found`)
          return NextResponse.json({ received: true })
        }

        // Map Paddle's status names to our internal status names
        // Paddle uses: active, trialing, past_due, paused, canceled
        // We use:      active, trialing, past_due, canceled, inactive
        const internalStatus =
          subscriptionStatus === 'canceled' ? 'canceled' :
          subscriptionStatus === 'past_due' ? 'past_due' :
          subscriptionStatus === 'paused' ? 'canceled' :
          'active'

        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              plan: planId,
              subscriptionStatus: internalStatus,
              billingCycle,
              currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
              // Store cancelAt so we know exactly when to downgrade them
              ...(internalStatus === 'canceled' && cancelAt
                ? { cancelAt: new Date(cancelAt) }
                : {}),
              updated_at: new Date(),
            },
          }
        )

        await db.collection('profiles').updateOne(
          { user_id: user._id.toString() },
          { $set: { plan: planId, subscriptionStatus: internalStatus } }
        )

        console.log(
          `✅ subscription.updated: user ${user.email} → plan: ${planId}, status: ${internalStatus}`
        )
        break
      }

      // ──────────────────────────────────────────────────────────────────────
      // EVENT: subscription.canceled
      //
      // WHEN IT FIRES: The user (or you on their behalf) canceled the
      // subscription in Paddle.
      //
      // WHAT WE DO — CRITICAL INDUSTRY RULE:
      //   We do NOT immediately remove access or change their plan to free.
      //   The user paid for the full billing period. They keep access until
      //   currentPeriodEnd. We:
      //     1. Set status to "canceled" (so the UI shows "cancels on X date")
      //     2. Store cancelAt (the date access actually ends)
      //     3. Leave plan as-is (still "pro" etc until the period ends)
      //
      // WHY WE DO NOT DOWNGRADE IMMEDIATELY:
      //   This is the industry standard. Notion, Linear, DocSend — all of them
      //   let the user keep access until the period they paid for ends.
      //   Cutting access immediately would be hostile to users and would
      //   generate chargebacks and negative reviews.
      //
      // THE ACTUAL DOWNGRADE TO FREE happens in one of two ways:
      //   Option A: A nightly cron job checks for users where
      //             status === "canceled" AND cancelAt < now
      //             and sets plan to "free" and status to "inactive"
      //   Option B: The access control middleware checks currentPeriodEnd
      //             on every protected request and denies access if expired
      //   We implement Option B in Phase 5 (access control middleware).
      // ──────────────────────────────────────────────────────────────────────
      case 'subscription.canceled': {
        const customData = eventData.custom_data || {}
        const customerId = eventData.customer_id || null

        // The date access actually ends — user paid until this date
        const cancelAt =
          eventData.current_billing_period?.ends_at ||
          eventData.canceled_at ||
          null

        const user = await findUser(db, customData, customerId)
        if (!user) {
          console.error(`❌ subscription.canceled: user not found`)
          return NextResponse.json({ received: true })
        }

        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              subscriptionStatus: 'canceled',
              cancelAt: cancelAt ? new Date(cancelAt) : null,
              // Plan stays unchanged — they keep access until cancelAt
              updated_at: new Date(),
            },
          }
        )

        await db.collection('profiles').updateOne(
          { user_id: user._id.toString() },
          { $set: { subscriptionStatus: 'canceled' } }
        )

        console.log(
          `✅ subscription.canceled: user ${user.email}, access ends: ${cancelAt}`
        )
        break
      }

      // ──────────────────────────────────────────────────────────────────────
      // EVENT: transaction.completed
      //
      // WHEN IT FIRES: A payment was successfully collected. This fires:
      //   - On the first payment (alongside subscription.created)
      //   - On every subsequent renewal payment
      //   - On one-time purchases (if you ever add them)
      //
      // WHAT WE DO:
      //   Update currentPeriodEnd to the new period end date.
      //   This is important for renewals — when a user's subscription renews,
      //   their currentPeriodEnd must be pushed forward or our access control
      //   middleware will incorrectly block them after the old end date passes.
      //
      //   We also ensure their status is "active" in case it was "past_due"
      //   (payment failed then succeeded on retry).
      // ──────────────────────────────────────────────────────────────────────
      case 'transaction.completed': {
        const customData = eventData.custom_data || {}
        const customerId = eventData.customer_id || null

        // For a subscription renewal, the new period end is in
        // subscription_id → we need to look at the subscription object.
        // Paddle also includes billing_period in the transaction data itself.
        const periodEnd =
          eventData.billing_period?.ends_at ||
          eventData.current_billing_period?.ends_at ||
          null

        const user = await findUser(db, customData, customerId)
        if (!user) {
          // transaction.completed also fires for non-subscription transactions
          // (like Paddle's own internal billing). Not finding a user here is
          // normal — just log and continue.
          console.log(
            `ℹ️ transaction.completed: no matching user found (customerId: ${customerId}) — may be a Paddle internal transaction`
          )
          return NextResponse.json({ received: true })
        }

        const updateFields: any = {
          subscriptionStatus: 'active', // payment succeeded → ensure active
          updated_at: new Date(),
        }

        if (periodEnd) {
          updateFields.currentPeriodEnd = new Date(periodEnd)
        }

        // Store paddle customer ID if we do not have it yet
        if (customerId && !user.paddleCustomerId) {
          updateFields.paddleCustomerId = customerId
        }

        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: updateFields }
        )

        console.log(
          `✅ transaction.completed: user ${user.email}, new period end: ${periodEnd}`
        )
        break
      }

      // ──────────────────────────────────────────────────────────────────────
      // EVENT: transaction.payment_failed
      //
      // WHEN IT FIRES: A payment attempt failed. This can happen:
      //   - Card declined on initial purchase (rare — Paddle handles retries)
      //   - Card declined on renewal (common — card expired, insufficient funds)
      //   - Bank 3D Secure challenge failed
      //
      // WHAT WE DO:
      //   Set status to "past_due". We do NOT immediately remove access.
      //   Paddle automatically retries failed payments several times over
      //   the next few days. If all retries fail, Paddle fires
      //   subscription.canceled and we handle that above.
      //
      //   "past_due" in the UI shows a banner: "Your payment failed.
      //   Please update your payment method." with a link to the Paddle
      //   billing portal where they can update their card.
      //
      // WHY WE DO NOT SEND AN EMAIL HERE:
      //   Paddle already sends a payment failed email to the user
      //   automatically (you can configure this in your Paddle dashboard).
      //   Sending a second email from our side would be redundant and
      //   feel spammy. Just update the DB status and let the UI handle it.
      // ──────────────────────────────────────────────────────────────────────
      case 'transaction.payment_failed': {
        const customData = eventData.custom_data || {}
        const customerId = eventData.customer_id || null

        const user = await findUser(db, customData, customerId)
        if (!user) {
          console.error(`❌ transaction.payment_failed: user not found`)
          return NextResponse.json({ received: true })
        }

        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              subscriptionStatus: 'past_due',
              updated_at: new Date(),
            },
          }
        )

        await db.collection('profiles').updateOne(
          { user_id: user._id.toString() },
          { $set: { subscriptionStatus: 'past_due' } }
        )

        console.log(
          `⚠️ transaction.payment_failed: user ${user.email} → status: past_due`
        )
        break
      }

      // ──────────────────────────────────────────────────────────────────────
      // ALL OTHER EVENTS
      //
      // Paddle sends many more event types we do not need to handle:
      //   adjustment.created, adjustment.updated (refunds/credits)
      //   customer.created, customer.updated
      //   price.created, product.created (catalog changes)
      //   report.created (analytics)
      //
      // We return 200 for all of these so Paddle does not retry them.
      // We log them at info level so we have a record in case we need to
      // add handling for one of them in the future.
      // ──────────────────────────────────────────────────────────────────────
      default: {
        console.log(`ℹ️ Unhandled Paddle event type: ${eventType} — ignoring`)
        break
      }
    }
  } catch (handlerError: any) {
    // If the database update fails (DB timeout, connection error), we return
    // 500 so Paddle retries the webhook. The retry will succeed once the DB
    // recovers. This is the correct behaviour — we want to retry transient
    // infrastructure failures, not permanently lose the event.
    console.error(
      `🔥 Webhook handler error for event ${eventType}:`,
      handlerError?.message || handlerError
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }

  // ── Step 6: Acknowledge receipt ───────────────────────────────────────────
  // Always return 200 after successful processing. Paddle treats anything
  // other than 2xx as a failure and will retry. We only want retries for
  // genuine failures (DB down etc) handled above — not for normal processing.
  return NextResponse.json({ received: true }, { status: 200 })
}