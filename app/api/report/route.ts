// app/api/report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const SUPPORT_INBOX = 'support@docmetrics.io'
const FROM = 'DocMetrics <noreply@docmetrics.io>'

const REASON_LABELS: Record<string, string> = {
  phishing:      'Phishing or fraud',
  spam:          'Spam or unsolicited content',
  inappropriate: 'Inappropriate or offensive content',
  misleading:    'Fake or misleading information',
  harassment:    'Harassment or threatening content',
  other:         'Other',
}

export async function POST(request: NextRequest) {
  try {
    // ── Token comes from query string: /api/report?token=xxx ──────
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const { reason, details, reporterEmail } = await request.json()

    // ── Validate reason ───────────────────────────────────────────
    if (!reason || !REASON_LABELS[reason]) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
    }

    const db = await dbPromise

    // ── Look up the share ─────────────────────────────────────────
    const share = await db.collection('shares').findOne({ shareToken: token })
    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // ── Look up the document ──────────────────────────────────────
    const document = await db.collection('documents').findOne({
      _id: share.documentId,
    })

    const documentName = document?.originalFilename || 'Unknown document'

    // ── IP ────────────────────────────────────────────────────────
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // ── Save to DB ────────────────────────────────────────────────
    await db.collection('reports').insertOne({
      shareToken:    token,
      documentId:    share.documentId,
      documentName,
      ownerUserId:   share.userId,
      reason,
      details:       details?.trim() || null,
      reporterEmail: reporterEmail?.trim() || null,
      ip,
      status:        'pending', // pending | reviewed | dismissed
      createdAt:     new Date(),
    })

    // ── Notify support inbox ──────────────────────────────────────
    // Fire and forget — report is saved regardless of email outcome
    resend.emails.send({
      from: FROM,
      to: [SUPPORT_INBOX],
      subject: `New report — ${REASON_LABELS[reason]} — "${documentName}"`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1e293b; }
  .wrap { padding: 40px 16px; }
  .card { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
  .accent { height: 3px; background: #0f172a; }
  .head { padding: 20px 28px 16px; border-bottom: 1px solid #f1f5f9; }
  .wm { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; }
  .body { padding: 24px 28px; }
  .title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  td { padding: 9px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  .lbl { color: #94a3b8; font-weight: 500; width: 36%; }
  .val { color: #0f172a; font-weight: 600; }
  .details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 16px; }
  .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .foot { padding: 16px 28px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="accent"></div>
    <div class="head"><span class="wm">DocMetrics &middot; Trust &amp; Safety</span></div>
    <div class="body">
      <p class="title">New document report</p>
      <table>
        <tr><td class="lbl">Document</td><td class="val">${documentName}</td></tr>
        <tr><td class="lbl">Share token</td><td class="val" style="font-family:monospace;font-size:11px;">${token}</td></tr>
        <tr><td class="lbl">Reason</td><td class="val">${REASON_LABELS[reason]}</td></tr>
        <tr><td class="lbl">Reporter</td><td class="val">${reporterEmail?.trim() || 'Anonymous'}</td></tr>
        <tr><td class="lbl">IP</td><td class="val" style="font-family:monospace;font-size:11px;">${ip}</td></tr>
        <tr><td class="lbl">Received</td><td class="val">${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
      </table>
      ${details?.trim() ? `
        <p class="label">Details from reporter</p>
        <div class="details">${details.trim()}</div>
      ` : ''}
    </div>
    <div class="foot">Review this report in the DocMetrics admin panel.</div>
  </div>
</div>
</body>
</html>`,
    }).catch(err => console.error('Report email failed (non-fatal):', err))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Report submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}