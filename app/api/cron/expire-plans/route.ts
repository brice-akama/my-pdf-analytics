// app/api/cron/expire-plans/route.ts
//
// WHAT THIS FILE DOES:
//   Runs nightly to find users whose trial or paid subscription has expired
//   and downgrades them to the free plan.
//
// WHY THIS IS NEEDED:
//   The webhook handler sets subscriptionStatus to "canceled" and stores
//   cancelAt — but it does NOT immediately change the plan to "free".
//   Users keep access until their period ends. This cron job checks every
//   night for users where that period has now passed and downgrades them.
//
// WHO IT AFFECTS:
//   1. Trial users whose trialEndsAt has passed and never subscribed
//   2. Canceled users whose currentPeriodEnd has passed
//
// HOW TO TRIGGER IT:
//   Option A — Vercel Cron (recommended, free on Vercel Pro):
//     Add to vercel.json (see bottom of this file)
//     Vercel calls GET /api/cron/expire-plans every night at midnight UTC
//
//   Option B — External cron (free on any plan):
//     Use cron-job.org or similar to call GET /api/cron/expire-plans nightly
//     Pass the secret header: x-cron-secret: your_secret
//
// SECURITY:
//   This route is protected by a secret header so only your cron service
//   can trigger it. Set CRON_SECRET in your environment variables.

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"

export async function GET(request: NextRequest) {

  // ── Step 1: Verify the cron secret ───────────────────────────────────────
  // Prevents anyone from triggering this route manually
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("x-cron-secret") ||
    request.headers.get("authorization")?.replace("Bearer ", "")

  // Vercel cron jobs send Authorization: Bearer <CRON_SECRET> automatically
  if (cronSecret && authHeader !== cronSecret) {
    console.error("❌ Cron: unauthorized request")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  console.log(`🕐 Cron job running at ${now.toISOString()}`)

  try {
    const db = await dbPromise
    let expiredCount = 0
    let trialExpiredCount = 0

    // ── Step 2: Expire trials ─────────────────────────────────────────────
    // Find users who are still in "trialing" status but whose trial has ended
    // and they never subscribed (no paddleSubscriptionId)
    const expiredTrials = await db.collection("users").updateMany(
      {
        subscriptionStatus: "trialing",
        trialEndsAt: { $lt: now },
        paddleSubscriptionId: null, // never paid
      },
      {
        $set: {
          plan: "free",
          subscriptionStatus: "inactive",
          updated_at: now,
        },
      }
    )

    trialExpiredCount = expiredTrials.modifiedCount
    console.log(`✅ Expired trials downgraded to free: ${trialExpiredCount}`)

    // Mirror to profiles collection
    if (trialExpiredCount > 0) {
      // Get the IDs of users we just downgraded so we can update profiles
      const expiredTrialUsers = await db.collection("users").find(
        {
          subscriptionStatus: "inactive",
          plan: "free",
          trialEndsAt: { $lt: now },
          paddleSubscriptionId: null,
          updated_at: { $gte: new Date(now.getTime() - 5000) }, // updated in last 5 seconds
        },
        { projection: { _id: 1 } }
      ).toArray()

      for (const user of expiredTrialUsers) {
        await db.collection("profiles").updateOne(
          { user_id: user._id.toString() },
          { $set: { plan: "free", subscriptionStatus: "inactive" } }
        )
      }
    }

    // ── Step 3: Expire canceled subscriptions ─────────────────────────────
    // Find users who canceled and whose access period has now ended
    const expiredCanceled = await db.collection("users").updateMany(
      {
        subscriptionStatus: "canceled",
        currentPeriodEnd: { $lt: now },
      },
      {
        $set: {
          plan: "free",
          subscriptionStatus: "inactive",
          updated_at: now,
        },
      }
    )

    expiredCount = expiredCanceled.modifiedCount
    console.log(`✅ Canceled subscriptions downgraded to free: ${expiredCount}`)

    // Mirror to profiles collection
    if (expiredCount > 0) {
      const expiredCanceledUsers = await db.collection("users").find(
        {
          subscriptionStatus: "inactive",
          plan: "free",
          currentPeriodEnd: { $lt: now },
          updated_at: { $gte: new Date(now.getTime() - 5000) },
        },
        { projection: { _id: 1 } }
      ).toArray()

      for (const user of expiredCanceledUsers) {
        await db.collection("profiles").updateOne(
          { user_id: user._id.toString() },
          { $set: { plan: "free", subscriptionStatus: "inactive" } }
        )
      }
    }

    // ── Step 4: Expire past_due subscriptions ─────────────────────────────
    // Find users who are past_due and whose period has ended
    // (Paddle gave up retrying and we never got the canceled webhook)
    const expiredPastDue = await db.collection("users").updateMany(
      {
        subscriptionStatus: "past_due",
        currentPeriodEnd: { $lt: now },
      },
      {
        $set: {
          plan: "free",
          subscriptionStatus: "inactive",
          updated_at: now,
        },
      }
    )

    const pastDueCount = expiredPastDue.modifiedCount
    console.log(`✅ Past due subscriptions downgraded to free: ${pastDueCount}`)

    const total = trialExpiredCount + expiredCount + pastDueCount

    console.log(`✅ Cron complete — total users downgraded: ${total}`)

    return NextResponse.json({
      success: true,
      ran_at: now.toISOString(),
      downgraded: {
        expired_trials: trialExpiredCount,
        canceled_subscriptions: expiredCount,
        past_due_subscriptions: pastDueCount,
        total,
      },
    })

  } catch (error: any) {
    console.error(" Cron job error:", error?.message || error)
    return NextResponse.json(
      { error: "Internal server error", detail: error?.message },
      { status: 500 }
    )
  }
}