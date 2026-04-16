// app/api/auth/signup/route.ts
//
// WHAT THIS FILE DOES:
//   Handles new account creation for both email/password signups and Google OAuth.
//   After a successful signup the user gets a JWT cookie and lands in the dashboard.
//
// CHANGES MADE IN PHASE 2 (Paddle payment integration prep):
//
//   1. Added billing fields to userDoc so every new user document is born
//      with a consistent shape. Before this, billing fields were missing entirely
//      which meant we'd have to handle "field might not exist" everywhere else.
//      Fields added: plan, subscriptionStatus, trialEndsAt, paddleCustomerId,
//      paddleSubscriptionId, currentPeriodEnd, billingCycle.
//
//   2. Added totalStorageUsedBytes = 0 to userDoc. Previously, storage was
//      calculated on every /api/auth/me request by summing all document sizes —
//      that gets slow fast. Now we maintain a running total on the user document
//      and just increment/decrement it on upload/delete.
//
//   3. Added onboarding fields (industry, companySize, useCases) to userDoc.
//      The frontend was already collecting and sending these in the 4-step
//      onboarding flow but this route was never saving them to MongoDB.
//      They are now saved so we can use them for analytics and personalization.
//
//   4. trialEndsAt is set here at account creation — 14 days from now.
//      We do NOT enforce trial expiry yet (that comes last, after Paddle
//      checkout and webhooks are fully working). This field just needs to
//      exist with the right value so when we do enforce it, the data is ready.
//
// WHAT WAS NOT CHANGED:
//   All validation logic, rate limiting, OAuth handling, organization invite
//   acceptance, welcome email, audit logging, and JWT cookie logic are
//   completely untouched. Only userDoc and profileDoc got new fields.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '../../lib/mongodb'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  sanitizeInput,
  isValidEmail,
  isValidPassword,
  isValidName,
  getClientIP,
  getUserAgent,
  checkRateLimit,
} from '@/lib/security'

import { notifyInviterOfAcceptance } from '@/lib/emails/teamEmails'
import { sendWelcomeEmail } from '@/lib/emailService.welcome'

export async function POST(request: NextRequest) {
  try {
    const db = await dbPromise
    const users = db.collection('users')
    const profiles = db.collection('profiles')
    const auditLog = db.collection('audit_log')

    await Promise.all([
      users.createIndex({ email: 1 }, { unique: true }),
      profiles.createIndex({ email: 1 }, { unique: true }),
      profiles.createIndex({ user_id: 1 }, { unique: true }),
    ])

    const clientIP = getClientIP(request)
    const userAgent = getUserAgent(request)

    // Rate limit — 3 signup attempts per IP per hour
    const rateLimitExceeded = await Promise.resolve(
      checkRateLimit(`signup:${clientIP}`, 3, 3600000)
    )
    if (rateLimitExceeded) {
      return NextResponse.json({ error: 'Too many signup attempts' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Destructure everything the frontend sends — including the new onboarding fields
    const {
      firstName,
      lastName,
      companyName,
      email,
      password,
      avatar,
      full_name,
      // --- PHASE 2: onboarding fields the frontend was sending but we never saved ---
      industry,
      companySize,
      useCases,
    } = body

    // Sanitize all string inputs before touching the database
    const sanitizedFirstName = sanitizeInput(
      firstName || (full_name ? full_name.split(' ')[0] : '') || ''
    )
    const sanitizedLastName = sanitizeInput(
      lastName || (full_name?.split(' ').slice(1).join(' ') ?? '')
    )
    const sanitizedCompanyName = sanitizeInput(companyName || '')
    const sanitizedEmail = sanitizeInput(email || '').toLowerCase()
    const sanitizedAvatar = sanitizeInput(avatar || '')

    // Sanitize the new onboarding fields — these are optional strings/arrays
    // so we default gracefully rather than erroring if they are missing
    const sanitizedIndustry = sanitizeInput(industry || '')
    const sanitizedCompanySize = sanitizeInput(companySize || '')
    // useCases is an array of strings — sanitize each item individually
    const sanitizedUseCases: string[] = Array.isArray(useCases)
      ? useCases.map((uc: string) => sanitizeInput(uc))
      : []

    // Google OAuth signups come in with no password but may have avatar/full_name
    const isOAuthSignup = !password && (!!sanitizedAvatar || !!full_name)

    const missingFields: string[] = []
    const invalidFields: { field: string; reason: string }[] = []

    if (!sanitizedFirstName) missingFields.push('firstName')
    else if (!isValidName(sanitizedFirstName))
      invalidFields.push({ field: 'firstName', reason: 'Invalid first name' })

    if (!sanitizedEmail) missingFields.push('email')
    else if (!isValidEmail(sanitizedEmail))
      invalidFields.push({ field: 'email', reason: 'Invalid email address' })

    if (sanitizedCompanyName && !isValidName(sanitizedCompanyName))
      invalidFields.push({ field: 'companyName', reason: 'Invalid company name' })

    if (!isOAuthSignup) {
      if (!password) missingFields.push('password')
      else if (!isValidPassword(password))
        invalidFields.push({ field: 'password', reason: 'Password too weak' })
    }

    if (missingFields.length) {
      return NextResponse.json({ error: 'Missing required fields', missingFields }, { status: 400 })
    }

    if (invalidFields.length) {
      return NextResponse.json({ error: 'Invalid field values', invalidFields }, { status: 400 })
    }

    const fullName = `${sanitizedFirstName}${sanitizedLastName ? ' ' + sanitizedLastName : ''}`.trim()

    // Block duplicate emails before attempting any insert
    const existingProfile = await profiles.findOne({ email: sanitizedEmail })
    if (existingProfile) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    // OAuth users get a random unhashable password — they will always log in via Google
    const randomPassword = Math.random().toString(36).slice(-16)
    const passwordToHash = isOAuthSignup ? randomPassword : password
    const passwordHash = await bcrypt.hash(passwordToHash, 10)

    const now = new Date()

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2: Calculate trialEndsAt right here at account creation time.
    //
    // All new users get a 14-day trial of the Pro plan regardless of which
    // plan they clicked on the marketing page. This is the industry standard
    // (Notion, DocSend, Linear all do this). The trial plan name is "pro" so
    // the user experiences the full product during their trial period.
    //
    // We are NOT enforcing this expiry yet — that logic comes in a later phase
    // once Paddle checkout and webhooks are working. Setting the date now means
    // the data will be correct when we do flip the enforcement switch.
    // ─────────────────────────────────────────────────────────────────────────
    const trialEndsAt = new Date(now)
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const userDoc = {
      email: sanitizedEmail,
      passwordHash,
      provider: isOAuthSignup ? 'google' : 'local',

      // User profile fields — same as before
      profile: {
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName || null,
        fullName,
        companyName: sanitizedCompanyName || null,
        avatarUrl: sanitizedAvatar || null,
      },

      // ── PHASE 2: Onboarding fields ────────────────────────────────────────
      // These were collected in the 4-step signup flow but never persisted.
      // Saving them here allows us to personalize the dashboard, run cohort
      // analytics (which industries convert best?), and tailor onboarding emails.
      industry: sanitizedIndustry || null,
      companySize: sanitizedCompanySize || null,
      useCases: sanitizedUseCases.length > 0 ? sanitizedUseCases : [],

      // ── PHASE 2: Billing fields ───────────────────────────────────────────
      // Every user document is born with these fields so every other part of
      // the codebase can read them without "field might not exist" defensive code.
      //
      // plan: what tier they are on. Starts as "pro" during trial.
      //   After trial expires and they have not paid → "free".
      //   After they pay Paddle → whatever they purchased.
      //
      // subscriptionStatus: the lifecycle state of their subscription.
      //   "trialing"  — within the 14-day trial window
      //   "active"    — paying customer, all good
      //   "canceled"  — they canceled, still has access until currentPeriodEnd
      //   "past_due"  — payment failed, Paddle is retrying
      //   "inactive"  — trial expired, no payment, on free plan
      //
      // trialEndsAt: the exact moment the trial expires. Set once, never changed.
      //
      // paddleCustomerId / paddleSubscriptionId: filled in by the webhook handler
      //   when the user completes their first Paddle checkout. Null until then.
      //
      // currentPeriodEnd: when the current billing period ends. For trialing users
      //   this mirrors trialEndsAt. For paid users Paddle sends this via webhook.
      //
      // billingCycle: "monthly" or "yearly". Null until they pick a paid plan.
      plan: 'pro',
      subscriptionStatus: 'trialing',
      trialEndsAt,
      paddleCustomerId: null,
      paddleSubscriptionId: null,
      currentPeriodEnd: trialEndsAt,
      billingCycle: null,

      // ── PHASE 2: Storage tracking field ──────────────────────────────────
      // Starts at zero for every new user. Incremented on every file upload,
      // decremented on every file delete. This lets /api/auth/me read a single
      // field instead of summing all document sizes on every request — which
      // would get very slow as a user accumulates hundreds of files.
      totalStorageUsedBytes: 0,

      email_verified: isOAuthSignup ? true : false,
      created_at: now,
      updated_at: now,
    }

    const insertResult = await users.insertOne(userDoc)
    const insertedUserId = insertResult.insertedId.toString()

    // ─────────────────────────────────────────────────────────────────────────
    // AUTO-ACCEPT PENDING ORGANIZATION INVITATIONS
    // Logic unchanged from before — if someone was invited before they signed up,
    // we accept the invite automatically here.
    // ─────────────────────────────────────────────────────────────────────────
    const pendingInvitations = await db
      .collection('organization_members')
      .find({ email: sanitizedEmail, status: 'invited' })
      .toArray()

    let organizationId = insertedUserId
    let userRole = 'owner'

    if (pendingInvitations.length > 0) {
      const invite = pendingInvitations[0]
      organizationId = invite.organizationId
      userRole = invite.role

      for (const inv of pendingInvitations) {
        await db.collection('organization_members').updateOne(
          { _id: inv._id },
          {
            $set: {
              userId: insertedUserId,
              status: 'active',
              joinedAt: new Date(),
              lastActiveAt: new Date(),
            },
          }
        )
      }

      console.log(`✅ User ${sanitizedEmail} joined organization ${organizationId} as ${userRole}`)

      // Fire and forget — notify the person who sent the invite, but never block signup
      notifyInviterOfAcceptance({
        invitedByUserId: invite.invitedBy,
        newMemberName: fullName || sanitizedFirstName,
        newMemberEmail: sanitizedEmail,
        role: userRole,
        organizationName: invite.organizationName || 'your team',
      }).catch((err) => {
        console.error('❌ Signup: failed to notify inviter (non-blocking):', err)
      })
    } else {
      console.log(`✅ User ${sanitizedEmail} created new organization as owner`)
    }

    // Profile document mirrors the user document for quick lookups
    const profileDoc = {
      _id: new ObjectId(insertedUserId),
      user_id: insertedUserId,
      email: sanitizedEmail,
      full_name: fullName,
      first_name: sanitizedFirstName,
      last_name: sanitizedLastName || null,
      avatar_url: sanitizedAvatar || null,
      company_name: sanitizedCompanyName || null,
      organization_id: organizationId,
      role: userRole,
      // PHASE 2: Mirror the plan here too so profile lookups reflect billing state
      plan: 'pro',
      subscriptionStatus: 'trialing',
      created_at: now,
    }

    await profiles.updateOne({ user_id: insertedUserId }, { $set: profileDoc }, { upsert: true })

    // Audit log entry — same as before
    await auditLog.insertOne({
      user_id: insertedUserId,
      action: 'signup',
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: {
        email: sanitizedEmail,
        signup_method: isOAuthSignup ? 'oauth' : 'email',
        // PHASE 2: Log what plan and trial state they started on
        initialPlan: 'pro',
        initialStatus: 'trialing',
        trialEndsAt,
      },
      created_at: now,
    })

    // Welcome email — fire and forget, never blocks signup returning to the user
    sendWelcomeEmail({
      recipientName: sanitizedFirstName,
      recipientEmail: sanitizedEmail,
    }).catch((emailError) => {
      console.error('⚠️ Failed to send welcome email (non-blocking):', emailError)
    })

    // Sign a 7-day JWT and set it as an httpOnly cookie
    const token = jwt.sign(
      { userId: insertedUserId, email: sanitizedEmail },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: insertedUserId,
        email: sanitizedEmail,
        full_name: fullName,
        provider: userDoc.provider,
        profile: userDoc.profile,
        // PHASE 2: Return the trial info so the frontend can show "X days left"
        plan: userDoc.plan,
        subscriptionStatus: userDoc.subscriptionStatus,
        trialEndsAt: userDoc.trialEndsAt,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}