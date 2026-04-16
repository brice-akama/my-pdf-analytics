// app/api/auth/google/route.ts
//
// WHAT THIS FILE DOES:
//   Handles Google OAuth for both login and signup flows.
//   Step 1 (no code param): redirects the user to Google's consent screen.
//   Step 2 (code param): exchanges the code for tokens, fetches the Google
//   profile, then either logs in an existing user or creates a new account.
//
// ORIGINAL FIXES (already in place before Phase 2):
//   #1 — Removed internal fetch('/api/auth/signup') call. Calling your own
//        serverless endpoint from within a serverless function causes the OAuth
//        code to be consumed on a different cold instance, triggering
//        "invalid_grant" on the second attempt. Signup logic is inlined instead.
//   #2 — All fetch() calls check res.ok before res.json() to prevent
//        "Unexpected token '<'" crashes when Google returns HTML error pages.
//   #3 — State is decoded from the CALLBACK url params, not the initial request,
//        so mode/next survive the redirect round-trip correctly.
//
// CHANGES MADE IN PHASE 2 (Paddle payment integration prep):
//
//   1. Added all Phase 2 billing and storage fields to the userDoc inside
//      createGoogleUser. Before this, Google-signup users were created without
//      plan, subscriptionStatus, trialEndsAt, totalStorageUsedBytes, etc.
//      That meant /api/auth/me returned undefined for those fields on every
//      Google user and fell back to messy defaults.
//      Google users now get the exact same starting document shape as email
//      signup users — same plan, same trial period, same storage counter.
//
//   2. Added Phase 2 fields to profileDoc as well so the profiles collection
//      stays in sync with the users collection from day one.
//
//   3. Fixed the sendWelcomeEmail import. It was importing from '@/lib/emailService'
//      which has a top-level import chain ending at html-encoding-sniffer →
//      @exodus/bytes (ESM-only) → ERR_REQUIRE_ESM crash at runtime.
//      Changed to '@/lib/emailService.welcome' which is the isolated module
//      that only exports sendWelcomeEmail with no problematic imports.
//      This was already fixed in the email signup route — now consistent here.
//
//   4. Added onboarding fields (industry, companySize, useCases) to userDoc
//      as null / empty array. Google users skip the onboarding steps so these
//      fields will be null — but the fields must exist on every user document
//      so the rest of the app never has to handle "field might not exist".
//
// WHAT WAS NOT CHANGED:
//   base64url helpers, OAuth redirect logic, token exchange, state decoding,
//   existing user login path, organization invite acceptance, JWT signing,
//   cookie setting, error redirect handling.

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '../../lib/mongodb'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { notifyInviterOfAcceptance } from '@/lib/emails/teamEmails'

// PHASE 2 FIX: Import from the isolated module, NOT from '@/lib/emailService'.
// The original emailService.ts pulls in ESM-only dependencies that crash the
// Node.js runtime on this route. emailService.welcome re-exports only what
// we need with zero problematic imports.
import { sendWelcomeEmail } from '@/lib/emailService.welcome'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

// ─────────────────────────────────────────────────────────────────────────────
// BASE64URL HELPERS
// Used to encode/decode the state param that survives the Google redirect.
// ─────────────────────────────────────────────────────────────────────────────

function base64urlEncode(obj: Record<string, unknown>) {
  const b = Buffer.from(JSON.stringify(obj)).toString('base64')
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecodeToObj(s: string): Record<string, string> | null {
  if (!s) return null
  const pad = (4 - (s.length % 4)) % 4
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  try {
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  } catch (e) {
    console.warn('⚠️ Failed to decode state:', e)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// createGoogleUser
//
// Called when a Google profile has no matching account in our users collection.
// Creates the user, profile, and audit log entry inline — no internal fetch.
//
// PHASE 2: This function now writes the same billing and storage fields that
// the email signup route writes. Both signup paths produce identical document
// shapes so /api/auth/me never has to treat Google users differently.
// ─────────────────────────────────────────────────────────────────────────────
async function createGoogleUser(profile: {
  email: string
  given_name?: string
  family_name?: string
  name?: string
  picture?: string
}) {
  const db = await dbPromise
  const users = db.collection('users')
  const profiles = db.collection('profiles')
  const auditLog = db.collection('audit_log')

  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true }),
    profiles.createIndex({ email: 1 }, { unique: true }),
    profiles.createIndex({ user_id: 1 }, { unique: true }),
  ])

  const email = profile.email.toLowerCase().trim()
  const firstName = profile.given_name || profile.name?.split(' ')?.[0] || ''
  const lastName =
    profile.family_name || profile.name?.split(' ').slice(1).join(' ') || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const avatarUrl = profile.picture || null
  const now = new Date()

  // If the account already exists (race condition or duplicate call), just return it
  const existingUser = await users.findOne({ email })
  if (existingUser) {
    return { userId: existingUser._id.toString(), email, isNew: false }
  }

  // Google users never use a password — generate a random one that is never
  // exposed and can never be guessed. They always log in through Google.
  const randomPassword =
    Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16)
  const passwordHash = await bcrypt.hash(randomPassword, 10)

  // ── PHASE 2: Set trial dates ─────────────────────────────────────────────
  // Google users get the same 14-day Pro trial as email signup users.
  // We are not enforcing trial expiry yet — that comes in the final phase
  // once Paddle checkout and webhooks are working end to end. Setting the
  // date now means the data will be correct when we do flip the switch.
  const trialEndsAt = new Date(now)
  trialEndsAt.setDate(trialEndsAt.getDate() + 14)

  const userDoc = {
    email,
    passwordHash,
    provider: 'google',

    // Profile fields
    profile: {
      firstName,
      lastName: lastName || null,
      fullName,
      companyName: null,
      avatarUrl,
    },

    // ── PHASE 2: Onboarding fields ────────────────────────────────────────
    // Google users skip the 4-step onboarding flow entirely and go straight
    // to the dashboard. These fields are null/empty but must exist on the
    // document so every other part of the app can read them without crashing.
    industry: null,
    companySize: null,
    useCases: [],

    // ── PHASE 2: Billing fields ───────────────────────────────────────────
    // Identical starting values to the email signup route.
    // plan starts as "pro" during the trial — Google users get the same full
    // trial experience as email users.
    //
    // paddleCustomerId and paddleSubscriptionId stay null until the user
    // completes a Paddle checkout. The webhook handler writes those values.
    plan: 'pro',
    subscriptionStatus: 'trialing',
    trialEndsAt,
    paddleCustomerId: null,
    paddleSubscriptionId: null,
    currentPeriodEnd: trialEndsAt,
    billingCycle: null,

    // ── PHASE 2: Storage tracking ─────────────────────────────────────────
    // Starts at zero. Every upload route increments this with $inc,
    // every delete route decrements it. /api/auth/me reads this single
    // field instead of summing all document sizes — much faster at scale.
    totalStorageUsedBytes: 0,

    email_verified: true,  // Google already verified the email for us
    created_at: now,
    updated_at: now,
  }

  const insertResult = await users.insertOne(userDoc)
  const insertedUserId = insertResult.insertedId.toString()

  // ── Auto-accept pending organization invitations ──────────────────────────
  // If someone invited this email address before they had a DocMetrics account,
  // we accept the invite automatically now that they have signed up.
  const pendingInvitations = await db
    .collection('organization_members')
    .find({ email, status: 'invited' })
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
            joinedAt: now,
            lastActiveAt: now,
          },
        }
      )
    }

    console.log(`✅ Google user ${email} joined org ${organizationId} as ${userRole}`)

    // Fire and forget — notify the inviter without blocking the signup response
    notifyInviterOfAcceptance({
      invitedByUserId: invite.invitedBy,
      newMemberName: fullName || firstName,
      newMemberEmail: email,
      role: userRole,
      organizationName: invite.organizationName || 'your team',
    }).catch((err) => {
      console.error('❌ Failed to notify inviter (non-blocking):', err)
    })
  }

  // Profile document — mirrors user for quick profile lookups
  const profileDoc = {
    _id: new ObjectId(insertedUserId),
    user_id: insertedUserId,
    email,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName || null,
    avatar_url: avatarUrl,
    company_name: null,
    organization_id: organizationId,
    role: userRole,
    // PHASE 2: Mirror billing fields on the profile document too
    plan: 'pro',
    subscriptionStatus: 'trialing',
    created_at: now,
  }

  await profiles.updateOne(
    { user_id: insertedUserId },
    { $set: profileDoc },
    { upsert: true }
  )

  await auditLog.insertOne({
    user_id: insertedUserId,
    action: 'signup',
    ip_address: 'oauth',
    user_agent: 'google-oauth',
    metadata: {
      email,
      signup_method: 'oauth',
      // PHASE 2: Log starting billing state for analytics and debugging
      initialPlan: 'pro',
      initialStatus: 'trialing',
      trialEndsAt,
    },
    created_at: now,
  })

  // Fire and forget — never block the OAuth redirect on an email
  sendWelcomeEmail({ recipientName: firstName, recipientEmail: email }).catch(
    (err) => console.error('⚠️ Welcome email failed (non-blocking):', err)
  )

  console.log(`✅ Google signup complete for: ${email}`)
  return { userId: insertedUserId, email, isNew: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GET HANDLER
// Handles both Step 1 (initiate OAuth) and Step 2 (callback with code).
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('❌ Missing Google OAuth env vars')
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      )
    }

    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const providerError = url.searchParams.get('error')
    const rawState = url.searchParams.get('state') || ''

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const redirectUri = `${request.nextUrl.origin}/api/auth/google`

    // Handle user cancelling the Google consent screen
    if (providerError) {
      console.warn('⚠️ Google OAuth provider error:', providerError)
      return NextResponse.redirect(
        `${baseUrl}/login?oauth_error=${encodeURIComponent(providerError)}`
      )
    }

    // ── STEP 1: No code yet — redirect to Google ──────────────────────────
    if (!code) {
      const incomingMode = url.searchParams.get('mode') || 'login'
      const incomingNext =
        url.searchParams.get('next') ||
        (incomingMode === 'login' ? '/dashboard' : '/dashboard')
      const incomingCs = url.searchParams.get('state') || ''

      const authUrl = new URL(GOOGLE_AUTH_URL)
      authUrl.searchParams.set('client_id', CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'openid email profile')
      authUrl.searchParams.set(
        'state',
        base64urlEncode({ mode: incomingMode, next: incomingNext, cs: incomingCs })
      )
      authUrl.searchParams.set('prompt', 'select_account')
      // access_type=online avoids refresh_token issues that cause invalid_grant
      authUrl.searchParams.set('access_type', 'online')

      console.log('🌍 Redirecting to Google for mode:', incomingMode)
      return NextResponse.redirect(authUrl.toString())
    }

    // ── STEP 2: Code received — exchange for tokens ───────────────────────
    console.log('🔁 OAuth callback received, exchanging code...')

    const tokenBody = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    })

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    })

    // Always read as text first, then parse — prevents JSON parse crash
    // if Google returns an HTML error page
    const tokenText = await tokenRes.text()
    let tokenJson: Record<string, string> = {}
    try {
      tokenJson = JSON.parse(tokenText)
    } catch {
      console.error('❌ Google token response was not JSON:', tokenText.slice(0, 200))
      return NextResponse.redirect(`${baseUrl}/login?error=oauth_token_parse_failed`)
    }

    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error('❌ Google token exchange failed:', tokenJson)
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(tokenJson.error || 'token_exchange_failed')}`
      )
    }

    // Fetch user profile from Google using the access token
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    })

    if (!userRes.ok) {
      const errText = await userRes.text()
      console.error('❌ Failed to fetch Google user info:', errText.slice(0, 200))
      return NextResponse.redirect(`${baseUrl}/login?error=userinfo_failed`)
    }

    const googleProfile = await userRes.json()

    if (!googleProfile.email) {
      console.error('❌ Google profile missing email:', googleProfile)
      return NextResponse.redirect(`${baseUrl}/login?error=no_email`)
    }

    // Decode state to recover mode and next destination
    const decodedState = base64urlDecodeToObj(rawState)
    const effectiveMode = decodedState?.mode || 'login'
    const effectiveNext = decodedState?.next || '/dashboard'

    console.log(`✅ Google profile received: ${googleProfile.email} (mode: ${effectiveMode})`)

    // ── STEP 3: Find or create user ───────────────────────────────────────
    const db = await dbPromise
    const users = db.collection('users')

    const existingUser = await users.findOne({
      email: googleProfile.email.toLowerCase(),
    })

    let userId: string

    if (existingUser) {
      // User already has an account — log them in regardless of mode
      userId = existingUser._id.toString()
      console.log(`✅ Existing user login: ${googleProfile.email}`)
    } else if (effectiveMode === 'login') {
      // Login mode but no account exists — send them to signup with a clear message
      console.warn(`⚠️ Login attempt for non-existent account: ${googleProfile.email}`)
      return NextResponse.redirect(`${baseUrl}/login?error=user_not_found`)
    } else {
      // Signup mode — create account inline (never via internal fetch)
      const result = await createGoogleUser(googleProfile)
      userId = result.userId
    }

    // ── STEP 4: Sign JWT and redirect ─────────────────────────────────────
    const token = jwt.sign(
      { userId, email: googleProfile.email.toLowerCase() },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const redirectTo =
      effectiveMode === 'signup' ? '/dashboard' : `${effectiveNext}`
    const response = NextResponse.redirect(`${baseUrl}${redirectTo}`)

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(' GOOGLE AUTH ERROR:', message)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://www.docmetrics.io'
    return NextResponse.redirect(`${baseUrl}/login?error=internal_error`)
  }
}