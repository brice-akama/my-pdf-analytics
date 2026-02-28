// app/api/portal/[shareLink]/otp/route.ts
//
// POST { email }
//   → generates a 6-digit OTP, stores it in `portalOtps` collection with
//     a 10-minute TTL, sends it via your existing emailService, returns { success }
//
// POST { email, code }
//   → validates the OTP, marks it used, returns { success, verified: true }
//     On success the caller should proceed to the normal /verify flow.
//
// COLLECTION SCHEMA:  portalOtps
//   { email, shareLink, code, createdAt, expiresAt, used: bool }
//   TTL index on expiresAt (MongoDB auto-deletes expired docs)
//   Create once in your DB setup:
//     db.portalOtps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import { sendEmail } from '@/lib/email'
// ↓ import your existing email sender — adjust path to match your project
 

const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS       = 5   // lock after 5 wrong codes in 10 min

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params    = context.params instanceof Promise ? await context.params : context.params
    const shareLink = params.shareLink
    const body      = await request.json()
    const { email, code } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const db    = await dbPromise
    const otps  = db.collection('portalOtps')
    const now   = new Date()

    // ══════════════════════════════════════════════════════════════════════
    // MODE A: VERIFY — body has { email, code }
    // ══════════════════════════════════════════════════════════════════════
    if (code) {
      if (typeof code !== 'string' || code.length !== 6) {
        return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
      }

      // Check for too many wrong attempts
      const recentBadAttempts = await otps.countDocuments({
        email:     email.toLowerCase(),
        shareLink,
        used:      false,
        verified:  false,
        expiresAt: { $gt: now },
        badAttempts: { $exists: true },
      })

      // Find the active OTP
      const record = await otps.findOne({
        email:     email.toLowerCase(),
        shareLink,
        used:      false,
        expiresAt: { $gt: now },
      }, { sort: { createdAt: -1 } })

      if (!record) {
        return NextResponse.json(
          { error: 'Code expired or not found. Request a new one.' },
          { status: 400 }
        )
      }

      // Wrong code — increment bad attempts
      if (record.code !== code) {
        await otps.updateOne(
          { _id: record._id },
          { $inc: { badAttempts: 1 } }
        )
        const attempts = (record.badAttempts || 0) + 1
        if (attempts >= MAX_ATTEMPTS) {
          await otps.updateOne({ _id: record._id }, { $set: { used: true } })
          return NextResponse.json(
            { error: 'Too many incorrect attempts. Please request a new code.' },
            { status: 429 }
          )
        }
        return NextResponse.json(
          { error: `Incorrect code. ${MAX_ATTEMPTS - attempts} attempt${MAX_ATTEMPTS - attempts === 1 ? '' : 's'} remaining.` },
          { status: 400 }
        )
      }

      // ✅ Correct code — mark used
      await otps.updateOne(
        { _id: record._id },
        { $set: { used: true, verifiedAt: now } }
      )

      return NextResponse.json({ success: true, verified: true })
    }

    // ══════════════════════════════════════════════════════════════════════
    // MODE B: SEND — body has { email } only
    // ══════════════════════════════════════════════════════════════════════

    // Rate limit: max 3 sends per email per 10 min
    const recentSends = await otps.countDocuments({
      email:     email.toLowerCase(),
      shareLink,
      createdAt: { $gt: new Date(now.getTime() - OTP_EXPIRY_MINUTES * 60 * 1000) },
    })

    if (recentSends >= 3) {
      return NextResponse.json(
        { error: 'Too many code requests. Please wait a few minutes.' },
        { status: 429 }
      )
    }

    // Invalidate any existing unused OTPs for this email+link
    await otps.updateMany(
      { email: email.toLowerCase(), shareLink, used: false },
      { $set: { used: true } }
    )

    // Generate new OTP
    const otp       = generateOtp()
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await otps.insertOne({
      email:       email.toLowerCase(),
      shareLink,
      code:        otp,
      createdAt:   now,
      expiresAt,
      used:        false,
      badAttempts: 0,
    })

    // Send the email
    await sendEmail({
      to:      email,
      subject: 'Your verification code',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <div style="margin-bottom:24px;">
            <div style="width:44px;height:44px;background:#09090b;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="color:white;font-size:20px;">🔐</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#09090b;">
              Your verification code
            </h1>
            <p style="margin:0;font-size:14px;color:#71717a;">
              Use this code to access the secure document portal. It expires in ${OTP_EXPIRY_MINUTES} minutes.
            </p>
          </div>

          <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#09090b;font-family:monospace;">
              ${otp}
            </span>
          </div>

          <p style="font-size:12px;color:#a1a1aa;margin:0;">
            If you didn't request this, you can safely ignore this email.
            This code can only be used once.
          </p>
        </div>
      `,
      
    })

    return NextResponse.json({
      success: true,
      message: `Code sent to ${email}`,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    })

  } catch (err) {
    console.error('❌ OTP error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}