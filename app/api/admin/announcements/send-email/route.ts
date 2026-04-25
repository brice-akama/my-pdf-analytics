// app/api/admin/announcements/send-email/route.ts
//
// WHAT THIS FILE DOES:
//   Sends a bulk announcement email to ALL users in the platform.
//   Uses your exact Resend pattern from emailService.ts —
//   same FROM address, same shell() HTML wrapper, same style.
//
// SAFETY:
//   - Sends in batches of 50 to avoid Resend rate limits
//   - Updates the announcement document with sentAt + recipientCount
//   - Never sends twice — checks sentAt before proceeding
//   - Only sends to users who have email_verified or who signed up via OAuth

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { dbPromise } from '@/app/api/lib/mongodb'
import { ObjectId } from 'mongodb'
import { Resend } from 'resend'

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'default_secret'
)

async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET)
    return payload
  } catch {
    return null
  }
}

// ── Exact same constants as your emailService.ts ───────────────
const FROM = 'DocMetrics <noreply@docmetrics.io>'

// ── Exact same shell() function as your emailService.ts ───────
function shell(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>DocMetrics</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1e293b; }
  .wrap { padding: 40px 16px; }
  .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
  .accent { height: 3px; background: #0f172a; }
  .head { padding: 24px 32px 20px; border-bottom: 1px solid #f1f5f9; }
  .wordmark { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; }
  .body { padding: 32px 32px 24px; }
  .title { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .meta { font-size: 13px; color: #64748b; margin-bottom: 28px; }
  .msg { background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
  .foot { padding: 20px 32px; border-top: 1px solid #f1f5f9; }
  .foot p { font-size: 11px; color: #94a3b8; line-height: 1.7; }
  .foot a { color: #64748b; text-decoration: underline; }
  .notice { background: #f0f9ff; border-left: 3px solid #0284c7; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 13px; color: #075985; line-height: 1.6; margin-top: 20px; }
  .warn { background: #fffbeb; border-left: 3px solid #d97706; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 13px; color: #92400e; line-height: 1.6; margin-top: 20px; }
</style>
</head>
<body>
<span style="display:none;font-size:1px;max-height:0;overflow:hidden;color:#f8fafc;">${previewText}</span>
<div class="wrap">
  <div class="card">
    <div class="accent"></div>
    <div class="head"><span class="wordmark">DocMetrics</span></div>
    <div class="body">${content}</div>
    <div class="foot">
      <p>
        This message was sent on behalf of <strong>DocMetrics</strong>.<br>
        If you were not expecting this, you can safely ignore it.
      </p>
    </div>
  </div>
</div>
</body>
</html>`
}

// ── Build email HTML from announcement ────────────────────────
function buildAnnouncementEmail(announcement: {
  title: string
  message: string
  type: string
}) {
  const previewText = announcement.title

  // Pick notice style based on type
  const noticeClass =
    announcement.type === 'warning' || announcement.type === 'maintenance'
      ? 'warn'
      : 'notice'

  const content = `
    <p class="title">${announcement.title}</p>
    <p class="meta">An update from the DocMetrics team</p>
    <div class="${noticeClass}">${announcement.message}</div>
    <p style="font-size:13px;color:#475569;margin-top:24px;line-height:1.6;">
      Questions? Reply to this email or reach us at
      <a href="mailto:support@docmetrics.io" style="color:#0f172a;font-weight:600;">support@docmetrics.io</a>
    </p>
  `

  return shell(content, previewText)
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => null)
    if (!body?.announcementId) {
      return NextResponse.json({ error: 'announcementId is required' }, { status: 400 })
    }

    const db = await dbPromise

    // ── Fetch the announcement ────────────────────────────────
    let announcement: any
    try {
      announcement = await db.collection('announcements').findOne({
        _id: new ObjectId(body.announcementId),
      })
    } catch {
      return NextResponse.json({ error: 'Invalid announcement ID' }, { status: 400 })
    }

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // ── Prevent double send ───────────────────────────────────
    if (announcement.sentAt && !body.force) {
      return NextResponse.json({
        error: 'This announcement was already sent. Pass force: true to send again.',
        sentAt: announcement.sentAt,
        recipientCount: announcement.recipientCount,
      }, { status: 409 })
    }

    // ── Fetch all users with emails ───────────────────────────
    const users = await db.collection('users').find(
      {},
      { projection: { email: 1, 'profile.firstName': 1, email_verified: 1, provider: 1 } }
    ).toArray()

    // Filter to verified users or OAuth users (they always have valid emails)
    const eligibleUsers = users.filter(u =>
      u.email && (u.email_verified === true || u.provider === 'google')
    )

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ error: 'No eligible users to send to' }, { status: 400 })
    }

    // ── Build the email HTML once (same for everyone) ─────────
    const html = buildAnnouncementEmail({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
    })

    // ── Send in batches of 50 to respect Resend rate limits ───
    const resend = new Resend(process.env.RESEND_API_KEY)
    const BATCH_SIZE = 50
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
      const batch = eligibleUsers.slice(i, i + BATCH_SIZE)

      const batchResults = await Promise.allSettled(
        batch.map(user =>
          resend.emails.send({
            from: FROM,
            to: [user.email],
            subject: announcement.title,
            html,
          })
        )
      )

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          successCount++
        } else {
          failCount++
          errors.push(String(result.reason))
        }
      }

      // Small delay between batches to be safe
      if (i + BATCH_SIZE < eligibleUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // ── Update the announcement with send results ─────────────
    await db.collection('announcements').updateOne(
      { _id: new ObjectId(body.announcementId) },
      {
        $set: {
          sentAt: new Date(),
          recipientCount: successCount,
          updatedAt: new Date(),
        },
      }
    )

    console.log(`✅ Announcement email sent: ${successCount} succeeded, ${failCount} failed`)

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      total: eligibleUsers.length,
      ...(errors.length > 0 && { sampleErrors: errors.slice(0, 3) }),
    })

  } catch (error: any) {
    console.error('Announcement send-email error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}