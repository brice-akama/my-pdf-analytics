// lib/emailService.welcome.ts
//
//  WHY THIS FILE EXISTS:
// lib/emailService.ts imports { sendEmail } from './email' at the top level.
// That import loads the entire ./email module into the bundle, which pulls in
// a chain ending at html-encoding-sniffer → @exodus/bytes (ESM-only) and
// causes ERR_REQUIRE_ESM in the signup serverless function.
//
// sendWelcomeEmail itself only uses Resend directly — it does NOT need ./email.
// So we re-export it here as a standalone module with zero problematic imports.
// 
// USAGE in signup/route.ts:
//   import { sendWelcomeEmail } from '@/lib/emailService.welcome';
//
// All other routes can keep importing from '@/lib/emailService' as normal.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'DocMetrics <noreply@docmetrics.io>';

export async function sendWelcomeEmail({
  recipientName,
  recipientEmail,
}: {
  recipientName: string;
  recipientEmail: string;
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://docmetrics.io'}/dashboard`;

  const subject = 'Welcome to DocMetrics';
  const previewText = 'Your account is ready. Here is how to get started.';

  const html = `<!DOCTYPE html>
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
  .section-label { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0 12px; }
  .feature-row { margin-bottom: 14px; }
  .feature-title { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
  .feature-desc { font-size: 13px; color: #475569; line-height: 1.6; }
  .step-row { display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start; }
  .step-num { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #0f172a; color: #fff; border-radius: 50%; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .step-text { font-size: 13px; color: #475569; line-height: 1.6; }
  .cta { text-align: center; margin: 28px 0 4px; }
  .cta a { display: inline-block; padding: 12px 32px; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; }
  .foot { padding: 20px 32px; border-top: 1px solid #f1f5f9; }
  .foot p { font-size: 11px; color: #94a3b8; line-height: 1.7; }
  .foot a { color: #64748b; text-decoration: underline; }
</style>
</head>
<body>
<span style="display:none;font-size:1px;max-height:0;overflow:hidden;color:#f8fafc;">${previewText}</span>
<div class="wrap">
  <div class="card">
    <div class="accent"></div>
    <div class="head"><span class="wordmark">DocMetrics</span></div>
    <div class="body">
      <p class="title">Welcome, ${recipientName}</p>
      <p class="meta">Your DocMetrics account is ready. Here is a quick overview of what you can do.</p>

      <p class="section-label">What DocMetrics does</p>
      <div class="feature-row">
        <div class="feature-title">Document sharing</div>
        <div class="feature-desc">Share documents with custom permissions, expiration dates, and view tracking.</div>
      </div>
      <div class="feature-row">
        <div class="feature-title">E-signatures</div>
        <div class="feature-desc">Send documents for signature and track signing status in real time.</div>
      </div>
      <div class="feature-row">
        <div class="feature-title">Analytics</div>
        <div class="feature-desc">See who viewed your documents, how long they spent, and which pages they read.</div>
      </div>

      <p class="section-label">Getting started</p>
      <div class="step-row">
        <span class="step-num">1</span>
        <span class="step-text"><strong>Upload a document</strong> — drag and drop any PDF from your dashboard.</span>
      </div>
      <div class="step-row">
        <span class="step-num">2</span>
        <span class="step-text"><strong>Share or send for signature</strong> — choose who can view it or request a signature.</span>
      </div>
      <div class="step-row">
        <span class="step-num">3</span>
        <span class="step-text"><strong>Track activity</strong> — monitor views, time spent, and signature progress.</span>
      </div>
      <div class="step-row">
        <span class="step-num">4</span>
        <span class="step-text"><strong>Invite your team</strong> — add members and manage permissions from settings.</span>
      </div>

      <div class="cta"><a href="${dashboardUrl}">Go to dashboard</a></div>

      <p style="font-size:13px;color:#475569;margin-top:24px;line-height:1.6;">
        Questions? Reply to this email or reach us at
        <a href="mailto:support@docmetrics.io" style="color:#0f172a;font-weight:600;">support@docmetrics.io</a>
      </p>
    </div>
    <div class="foot">
      <p>This message was sent on behalf of <strong>DocMetrics</strong>.<br>If you were not expecting this, you can safely ignore it.</p>
    </div>
  </div>
</div>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: [recipientEmail],
    subject,
    html,
  });

  if (error) {
    console.error('sendWelcomeEmail error:', error);
    throw error;
  }

  console.log('Welcome email sent to:', recipientEmail);
  return { success: true };
}