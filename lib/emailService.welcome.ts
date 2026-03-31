// lib/emailService.welcome.ts
//
//  WHY THIS FILE EXISTS:
// lib/emailService.ts imports { sendEmail } from './email' at the top level.
// That import loads the entire ./email module into the bundle, which pulls in
// a chain ending at html-encoding-sniffer → @exodus/bytes (ESM-only) and
// causes ERR_REQUIRE_ESM in the signup serverless function.
//
// These functions only use Resend directly — they do NOT need ./email.
// So we re-export them here as a standalone module with zero problematic imports.
//
// USAGE:
//   import { sendWelcomeEmail } from '@/lib/emailService.welcome';
//   import { sendPasswordResetEmail } from '@/lib/emailService.welcome';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'DocMetrics <noreply@docmetrics.io>';

// ============================================================
//  WELCOME EMAIL
// ============================================================

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
  .title { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .meta { font-size: 13px; color: #64748b; margin-bottom: 32px; line-height: 1.7; }
  .section-label { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 16px; padding-top: 28px; border-top: 1px solid #f1f5f9; }
  .feature-row { margin-bottom: 20px; }
  .feature-title { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
  .feature-desc { font-size: 13px; color: #475569; line-height: 1.7; }
  .step-row { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
  .step-num { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #0f172a; color: #fff; border-radius: 50%; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
  .step-text { font-size: 13px; color: #475569; line-height: 1.7; }
  .cta { text-align: center; margin: 32px 0 8px; }
  .cta a { display: inline-block; padding: 13px 36px; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; }
  .support-note { font-size: 13px; color: #475569; margin-top: 28px; line-height: 1.7; padding-top: 24px; border-top: 1px solid #f1f5f9; }
  .support-note a { color: #0f172a; font-weight: 600; }
  .foot { padding: 20px 32px; border-top: 1px solid #f1f5f9; }
  .foot p { font-size: 11px; color: #94a3b8; line-height: 1.8; }
</style>
</head>
<body>
<span style="display:none;font-size:1px;max-height:0;overflow:hidden;color:#f8fafc;">${previewText}</span>
<div class="wrap">
  <div class="card">
    <div class="accent"></div>

    <div class="head">
      <span class="wordmark">DocMetrics</span>
    </div>

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

      <div class="cta">
        <a href="${dashboardUrl}">Go to dashboard</a>
      </div>

      <p class="support-note">
        Questions? Reply to this email or reach us at
        <a href="mailto:support@docmetrics.io">support@docmetrics.io</a>
      </p>
    </div>

    <div class="foot">
      <p>
        This message was sent on behalf of <strong>DocMetrics</strong>.<br>
        If you were not expecting this, you can safely ignore it.
      </p>
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

// ============================================================
//  PASSWORD RESET EMAIL
// ============================================================

export async function sendPasswordResetEmail({
  recipientName,
  recipientEmail,
  resetCode,
}: {
  recipientName: string;
  recipientEmail: string;
  resetCode: string;
}) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://docmetrics.io'}/reset-password/verify`;

  const subject = 'Your DocMetrics password reset code';
  const previewText = `Your reset code is ${resetCode}. It expires in 15 minutes.`;

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
  .title { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .meta { font-size: 13px; color: #64748b; line-height: 1.7; margin-bottom: 32px; }
  .code-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 28px; }
  .code { font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0f172a; font-family: 'Courier New', Courier, monospace; }
  .code-note { font-size: 12px; color: #94a3b8; margin-top: 10px; }
  .divider { border: none; border-top: 1px solid #f1f5f9; margin: 28px 0; }
  .info-row { margin-bottom: 16px; }
  .info-label { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .info-text { font-size: 13px; color: #475569; line-height: 1.7; }
  .cta { text-align: center; margin: 28px 0 8px; }
  .cta a { display: inline-block; padding: 13px 36px; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; }
  .warning { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px 16px; margin-top: 28px; }
  .warning p { font-size: 12px; color: #92400e; line-height: 1.7; }
  .foot { padding: 20px 32px; border-top: 1px solid #f1f5f9; }
  .foot p { font-size: 11px; color: #94a3b8; line-height: 1.8; }
</style>
</head>
<body>
<span style="display:none;font-size:1px;max-height:0;overflow:hidden;color:#f8fafc;">${previewText}</span>
<div class="wrap">
  <div class="card">
    <div class="accent"></div>

    <div class="head">
      <span class="wordmark">DocMetrics</span>
    </div>

    <div class="body">
      <p class="title">Password reset request</p>
      <p class="meta">Hi ${recipientName}, we received a request to reset your password. Use the code below to continue.</p>

      <div class="code-block">
        <div class="code">${resetCode}</div>
        <div class="code-note">This code expires in 15 minutes</div>
      </div>

      <div class="info-row">
        <div class="info-label">How to use it</div>
        <div class="info-text">Go to the reset page, enter your email address, paste this code, then choose your new password.</div>
      </div>

      <div class="cta">
        <a href="${verifyUrl}">Enter reset code</a>
      </div>

      <hr class="divider" />

      <div class="warning">
        <p>
          <strong>Did not request this?</strong><br>
          If you did not ask to reset your password, you can safely ignore this email. Your account remains secure and no changes have been made.
        </p>
      </div>
    </div>

    <div class="foot">
      <p>
        This message was sent on behalf of <strong>DocMetrics</strong>.<br>
        If you need help, contact us at <a href="mailto:support@docmetrics.io" style="color:#64748b;">support@docmetrics.io</a>
      </p>
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
    console.error('sendPasswordResetEmail error:', error);
    throw error;
  }

  console.log('Password reset email sent to:', recipientEmail);
  return { success: true };
}