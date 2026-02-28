  // app/api/portal/[shareLink]/nda-sign/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params    = context.params instanceof Promise ? await context.params : context.params
    const shareLink = params.shareLink
    const body      = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const db = await dbPromise

    const space = await db.collection('spaces').findOne({
      'publicAccess': { $elemMatch: { shareLink, enabled: true } }
    })

    if (!space) {
      return NextResponse.json({ success: false, error: 'Invalid or expired link' }, { status: 404 })
    }

    const linkConfig = Array.isArray(space.publicAccess)
      ? space.publicAccess.find((l: any) => l.shareLink === shareLink && l.enabled !== false)
      : space.publicAccess

    if (!linkConfig) {
      return NextResponse.json({ success: false, error: 'Link not found' }, { status: 404 })
    }

    if (!linkConfig.requireNDA) {
      return NextResponse.json({ success: true, message: 'NDA not required' })
    }

    const now = new Date()
    const ip  = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown'
    const ua  = request.headers.get('user-agent') || 'unknown'

    // Idempotent
    const existing = await db.collection('ndaSignatures').findOne({
      shareLink, email: email.toLowerCase(),
    })
    if (existing) {
      return NextResponse.json({ success: true, message: 'Already signed', alreadySigned: true })
    }

    const { insertedId } = await db.collection('ndaSignatures').insertOne({
      spaceId:         space._id,
      shareLink,
      email:           email.toLowerCase(),
      ndaDocumentUrl:  linkConfig.ndaDocumentUrl  || null,
      ndaDocumentName: linkConfig.ndaDocumentName || null,
      signedAt:        now,
      ipAddress:       ip,
      userAgent:       ua,
    })

    await db.collection('activityLogs').insertOne({
      spaceId:         space._id,
      shareLink,
      visitorEmail:    email.toLowerCase(),
      performedBy:     email.toLowerCase(),
      performedByRole: 'visitor',
      event:           'nda_signed',
      documentId:      null,
      documentName:    linkConfig.ndaDocumentName || 'NDA',
      timestamp:       now,
      ipAddress:       ip,
      userAgent:       ua,
      meta: {
        ndaDocumentUrl:  linkConfig.ndaDocumentUrl  || null,
        ndaDocumentName: linkConfig.ndaDocumentName || null,
      }
    })

    console.log('✅ NDA signed by:', email, '| Space:', space.name)

    const documentHash = crypto
      .createHash('sha256')
      .update(linkConfig.ndaDocumentUrl || '')
      .digest('hex')

    const APP_URL        = process.env.NEXT_PUBLIC_APP_URL || ''
    const certificateUrl = `${APP_URL}/api/portal/${shareLink}/nda-certificate?id=${insertedId}&email=${encodeURIComponent(email)}`
    const docName        = linkConfig.ndaDocumentName || 'Non-Disclosure Agreement'
    const signedAt       = now.toUTCString()

    // ── NDA view URL — route through proxy so Cloudinary auth is handled ──────
    const ndaViewUrl = linkConfig.ndaDocumentUrl
      ? `${APP_URL}/api/portal/${shareLink}/nda-proxy?url=${encodeURIComponent(linkConfig.ndaDocumentUrl)}`
      : null

    // ── Shared email sections HTML ────────────────────────────────────────────
    const agreementSection = `
      <div style="background:#fff;border-radius:10px;border:1px solid #eee;padding:20px;margin-bottom:14px;">
        <h3 style="margin:0 0 12px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Agreement Details</h3>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:5px 0;color:#888;width:38%;">Document</td><td style="padding:5px 0;color:#111;font-weight:600;">${docName}</td></tr>
          <tr style="border-top:1px solid #f2f2f2;"><td style="padding:5px 0;color:#888;">Space / Project</td><td style="padding:5px 0;color:#111;font-weight:600;">${space.name}</td></tr>
        </table>
      </div>`

    const signatorySection = `
      <div style="background:#fff;border-radius:10px;border:1px solid #eee;padding:20px;margin-bottom:14px;">
        <h3 style="margin:0 0 12px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Signatory</h3>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:5px 0;color:#888;width:38%;">Email</td><td style="padding:5px 0;color:#111;font-weight:600;">${email}</td></tr>
          <tr style="border-top:1px solid #f2f2f2;"><td style="padding:5px 0;color:#888;">IP Address</td><td style="padding:5px 0;color:#111;font-family:monospace;font-size:12px;">${ip}</td></tr>
          <tr style="border-top:1px solid #f2f2f2;"><td style="padding:5px 0;color:#888;">User Agent</td><td style="padding:5px 0;color:#555;font-size:11px;">${ua.substring(0, 80)}</td></tr>
        </table>
      </div>`

    const verificationSection = `
      <div style="background:#fff;border-radius:10px;border:1px solid #eee;padding:20px;margin-bottom:14px;">
        <h3 style="margin:0 0 12px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Timestamp & Verification</h3>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:5px 0;color:#888;width:38%;">Signed At (UTC)</td><td style="padding:5px 0;color:#111;font-weight:600;">${signedAt}</td></tr>
          <tr style="border-top:1px solid #f2f2f2;"><td style="padding:5px 0;color:#888;">Signature ID</td><td style="padding:5px 0;font-family:monospace;font-size:11px;color:#111;">${insertedId}</td></tr>
          <tr style="border-top:1px solid #f2f2f2;"><td style="padding:5px 0;color:#888;">Document Hash</td><td style="padding:5px 0;font-family:monospace;font-size:10px;color:#111;word-break:break-all;">${documentHash}</td></tr>
        </table>
      </div>`

    const ndaRefSection = ndaViewUrl ? `
      <div style="background:#fff;border-radius:10px;border:1px solid #eee;padding:20px;margin-bottom:14px;">
        <h3 style="margin:0 0 12px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">NDA Document Reference</h3>
        <p style="margin:0 0 10px;font-size:12px;color:#555;">Click below to view the exact document that was signed.</p>
        <a href="${ndaViewUrl}"
          style="display:inline-block;padding:9px 18px;background:#f5f5f5;border:1px solid #ddd;border-radius:6px;font-size:12px;color:#333;text-decoration:none;font-weight:600;">
          View NDA Document
        </a>
      </div>` : ''

    const downloadBtn = `
      <div style="text-align:center;margin:22px 0;">
        <a href="${certificateUrl}"
          style="display:inline-block;background:#111;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.3px;">
          Download Certificate PDF
        </a>
      </div>`

    const footer = `<p style="color:#bbb;font-size:11px;text-align:center;margin-top:16px;">Powered by DocMetrics &mdash; docmetrics.io</p>`

    // ── VISITOR EMAIL ─────────────────────────────────────────────────────────
    await sendEmail({
      to: email,
      subject: `NDA Signed — ${space.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8f8f8;">
          <div style="background:#111;border-radius:12px;padding:28px;text-align:center;margin-bottom:20px;">
            <p style="color:#aaa;font-size:11px;margin:0 0 6px;letter-spacing:1px;">DOCMETRICS</p>
            <h1 style="color:#fff;margin:0;font-size:22px;">NDA Signature Confirmed</h1>
            <div style="display:inline-block;background:#1db954;color:#fff;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;margin-top:10px;">SIGNED</div>
          </div>
          <p style="color:#555;font-size:14px;margin-bottom:16px;">
            You have successfully signed the NDA for <strong style="color:#111;">${space.name}</strong>.
            Keep this email as your legal record.
          </p>
          ${agreementSection}
          ${signatorySection}
          ${verificationSection}
          ${ndaRefSection}
          ${downloadBtn}
          ${footer}
        </div>
      `
    })

    // ── OWNER EMAIL ───────────────────────────────────────────────────────────
    if (space.userId) {
      const ownerProfile =
        await db.collection('users').findOne({ _id: space.userId }) ||
        await db.collection('profiles').findOne({ user_id: space.userId })

      const ownerEmail = ownerProfile?.email
      if (ownerEmail) {
        await sendEmail({
          to: ownerEmail,
          subject: `NDA Signed — ${email} signed for ${space.name}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8f8f8;">
              <div style="background:#111;border-radius:12px;padding:28px;text-align:center;margin-bottom:20px;">
                <p style="color:#aaa;font-size:11px;margin:0 0 6px;letter-spacing:1px;">DOCMETRICS</p>
                <h1 style="color:#fff;margin:0;font-size:22px;">NDA Signature Received</h1>
                <p style="color:#aaa;margin:8px 0 0;font-size:13px;">${space.name}</p>
              </div>
              <p style="color:#555;font-size:14px;margin-bottom:16px;">
                <strong style="color:#111;">${email}</strong> has signed your NDA for
                <strong style="color:#111;">${space.name}</strong>.
              </p>
              ${agreementSection}
              ${signatorySection}
              ${verificationSection}
              ${ndaRefSection}
              ${downloadBtn}
              ${footer}
            </div>
          `
        })
        console.log('✅ Owner notified:', ownerEmail)
      }
    }

    return NextResponse.json({
      success:  true,
      message:  'NDA signed successfully',
      signedAt: now.toISOString(),
    })

  } catch (err) {
    console.error('❌ NDA sign error:', err)
    return NextResponse.json({ success: false, error: 'Failed to record NDA signature' }, { status: 500 })
  }
}

// GET — check if already signed
export async function GET(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params    = context.params instanceof Promise ? await context.params : context.params
    const shareLink = params.shareLink
    const email     = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ signed: false, error: 'Email required' }, { status: 400 })
    }

    const db = await dbPromise

    const signature = await db.collection('ndaSignatures').findOne({
      shareLink, email: email.toLowerCase(),
    })

    return NextResponse.json({
      signed:   !!signature,
      signedAt: signature?.signedAt || null,
    })

  } catch (err) {
    console.error('❌ NDA check error:', err)
    return NextResponse.json({ signed: false, error: 'Server error' }, { status: 500 })
  }
}