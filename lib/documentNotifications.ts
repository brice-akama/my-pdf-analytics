// lib/documentNotifications.ts
// Complete document notification system — Gmail via Resend
// Triggers: opened, completed, revisit, link expired, daily digest

import { sendEmail } from './email';
import { dbPromise } from '@/app/api/lib/mongodb';

// ── Shared helpers ────────────────────────────────────────────────
function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m 0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatTimeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours ago`;
  return `${Math.floor(secs / 86400)} days ago`;
}

function getDeviceIcon(device: string): string {
  if (device === 'mobile') return '📱';
  if (device === 'tablet') return '📟';
  return '💻';
}

// ── Base email shell — consistent branding ────────────────────────
function emailShell(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>DocMetrics</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { width: 100%; background: #f1f5f9; padding: 32px 16px; }
  .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .top-bar { height: 4px; background: linear-gradient(90deg, #0ea5e9, #a855f7); }
  .header { padding: 28px 32px 20px; border-bottom: 1px solid #f1f5f9; }
  .logo { font-size: 13px; font-weight: 700; color: #0ea5e9; letter-spacing: 0.5px; text-transform: uppercase; }
  .body { padding: 28px 32px; }
  .headline { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 6px; line-height: 1.3; }
  .subline { font-size: 14px; color: #64748b; margin: 0 0 24px; }
  .info-block { background: #f8fafc; border-radius: 10px; padding: 18px 20px; margin: 0 0 20px; }
  .info-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
  .info-row:last-child { border-bottom: none; padding-bottom: 0; }
  .info-label { font-size: 12px; color: #94a3b8; font-weight: 500; }
  .info-value { font-size: 13px; color: #1e293b; font-weight: 600; text-align: right; max-width: 60%; word-break: break-all; }
  .stat-row { display: flex; gap: 12px; margin: 0 0 20px; }
  .stat-box { flex: 1; background: #f8fafc; border-radius: 10px; padding: 14px 16px; text-align: center; }
  .stat-number { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; margin-bottom: 4px; }
  .stat-label { font-size: 11px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .signal-badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; margin: 2px; }
  .signal-high { background: #dcfce7; color: #15803d; }
  .signal-medium { background: #fef9c3; color: #92400e; }
  .signal-low { background: #f1f5f9; color: #64748b; }
  .cta-btn { display: block; width: fit-content; margin: 24px auto 0; padding: 13px 32px; background: linear-gradient(135deg, #0ea5e9, #a855f7); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.3px; text-align: center; }
  .section-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 10px; }
  .page-row { display: flex; align-items: center; gap-10px; margin-bottom: 8px; }
  .page-bar-wrap { flex: 1; background: #f1f5f9; border-radius: 4px; height: 6px; overflow: hidden; }
  .page-bar { height: 6px; border-radius: 4px; background: linear-gradient(90deg, #0ea5e9, #a855f7); }
  .alert-box { border-radius: 10px; padding: 14px 18px; margin: 0 0 20px; }
  .alert-fire { background: #fff7ed; border-left: 3px solid #f97316; }
  .alert-info { background: #eff6ff; border-left: 3px solid #3b82f6; }
  .alert-green { background: #f0fdf4; border-left: 3px solid #22c55e; }
  .alert-text { font-size: 13px; color: #1e293b; margin: 0; line-height: 1.5; }
  .footer { padding: 20px 32px 28px; text-align: center; border-top: 1px solid #f1f5f9; }
  .footer p { font-size: 11px; color: #94a3b8; margin: 4px 0; line-height: 1.6; }
  .footer a { color: #0ea5e9; text-decoration: none; }
</style>
</head>
<body>
<span style="display:none;font-size:1px;color:#f8fafc;max-height:0;overflow:hidden;">${previewText}</span>
<div class="wrapper">
  <div class="card">
    <div class="top-bar"></div>
    <div class="header">
      <span class="logo">● DocMetrics</span>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>You're receiving this because you enabled view notifications on <strong>DocMetrics</strong>.</p>
      <p><a href="https://docmetrics.io/settings/notifications">Manage notifications</a> · <a href="https://docmetrics.io/dashboard">Open dashboard</a></p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
// TRIGGER 1 — DOCUMENT OPENED (first view on a share link)
// Called from: track route session_start when pageNum === 1
// ════════════════════════════════════════════════════════════════
export async function sendDocumentOpenedEmail({
  ownerEmail,
  ownerName,
  viewerEmail,
  viewerName,
  documentName,
  documentId,
  location,
  device,
  shareToken,
  isFirstEverView,
}: {
  ownerEmail: string;
  ownerName?: string;
  viewerEmail?: string;
  viewerName?: string;
  documentName: string;
  documentId: string;
  location?: { country?: string; city?: string; countryCode?: string };
  device?: string;
  shareToken?: string;
  isFirstEverView?: boolean;
}) {
  const viewer = viewerName || viewerEmail || 'Someone';
  const locationStr = location?.city && location?.country
    ? `${location.city}, ${location.country}`
    : location?.country || 'Unknown location';
  const deviceIcon = getDeviceIcon(device || 'desktop');
  const analyticsUrl = `https://docmetrics.io/documents/${documentId}?tab=performance`;
  const now = new Date();

  const subject = isFirstEverView
    ? `🔔 ${viewer} just opened "${documentName}" for the first time`
    : `🔔 ${viewer} opened "${documentName}"`;

  const previewText = `${viewer} is reading your document right now from ${locationStr}`;

  const content = `
    <p class="headline">${isFirstEverView ? '🎉 First view!' : '👁 Document opened'}</p>
    <p class="subline">${viewer} just opened your document. This is a great time to follow up.</p>

    <div class="info-block">
      <div class="info-row">
        <span class="info-label">Document</span>
        <span class="info-value">📄 ${documentName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Viewer</span>
        <span class="info-value">${viewerEmail || viewerName || 'Anonymous'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Location</span>
        <span class="info-value">📍 ${locationStr}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Device</span>
        <span class="info-value">${deviceIcon} ${device ? device.charAt(0).toUpperCase() + device.slice(1) : 'Desktop'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Opened</span>
        <span class="info-value">🕐 ${now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>
    </div>

    <div class="alert-box alert-fire">
      <p class="alert-text">⚡ <strong>Best time to follow up:</strong> Reach out while they're actively reading — your message will land when the document is top of mind.</p>
    </div>

    <a href="${analyticsUrl}" class="cta-btn">📊 View Full Analytics →</a>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell(content, previewText),
    from: 'DocMetrics <support@docmetrics.io>',
  });
}

// ════════════════════════════════════════════════════════════════
// TRIGGER 2 — DOCUMENT COMPLETED (viewer read all pages)
// Called from: track route when viewer hits last page
// ════════════════════════════════════════════════════════════════
export async function sendDocumentCompletedEmail({
  ownerEmail,
  viewerEmail,
  viewerName,
  documentName,
  documentId,
  totalPages,
  totalTimeSeconds,
  topPages,
  intentLevel,
}: {
  ownerEmail: string;
  viewerEmail?: string;
  viewerName?: string;
  documentName: string;
  documentId: string;
  totalPages: number;
  totalTimeSeconds: number;
  topPages?: { page: number; timeSpent: number }[];
  intentLevel?: 'high' | 'medium' | 'low';
}) {
  const viewer = viewerName || viewerEmail || 'Someone';
  const analyticsUrl = `https://docmetrics.io/documents/${documentId}?tab=performance`;
  const intentEmoji = intentLevel === 'high' ? '🔥' : intentLevel === 'medium' ? '👀' : '📖';
  const intentLabel = intentLevel === 'high' ? 'High Intent' : intentLevel === 'medium' ? 'Medium Intent' : 'Low Intent';
  const intentClass = intentLevel === 'high' ? 'signal-high' : intentLevel === 'medium' ? 'signal-medium' : 'signal-low';

  const subject = `✅ ${viewer} finished reading "${documentName}" — ${intentEmoji} ${intentLabel}`;
  const previewText = `${viewer} read all ${totalPages} pages and spent ${formatTime(totalTimeSeconds)} on your document`;

  // Build top pages HTML
  const topPagesHtml = topPages && topPages.length > 0
    ? `<p class="section-label">Most time spent on</p>
       ${topPages.slice(0, 3).map(p => {
         const pct = Math.min(Math.round((p.timeSpent / totalTimeSeconds) * 100), 100);
         return `<div style="margin-bottom:10px;">
           <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
             <span style="font-size:12px;color:#475569;font-weight:600;">Page ${p.page}</span>
             <span style="font-size:12px;color:#0ea5e9;font-weight:700;">${formatTime(p.timeSpent)}</span>
           </div>
           <div class="page-bar-wrap"><div class="page-bar" style="width:${pct}%"></div></div>
         </div>`;
       }).join('')}`
    : '';

  const content = `
    <p class="headline">✅ Full read completed</p>
    <p class="subline">${viewer} read every page of your document — a strong buying signal.</p>

    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-number">${formatTime(totalTimeSeconds)}</div>
        <div class="stat-label">Total time</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${totalPages}/${totalPages}</div>
        <div class="stat-label">Pages read</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${intentEmoji}</div>
        <div class="stat-label"><span class="signal-badge ${intentClass}">${intentLabel}</span></div>
      </div>
    </div>

    <div class="info-block">
      <div class="info-row">
        <span class="info-label">Viewer</span>
        <span class="info-value">${viewerEmail || viewerName || 'Anonymous'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Document</span>
        <span class="info-value">📄 ${documentName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Completed</span>
        <span class="info-value">${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>
    </div>

    ${topPagesHtml}

    <div class="alert-box alert-green">
      <p class="alert-text">🎯 <strong>Follow up now.</strong> ${viewer} just finished reading — they have full context. This is the highest-value moment to start a conversation.</p>
    </div>

    <a href="${analyticsUrl}" class="cta-btn">📊 See Detailed Analytics →</a>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell(content, previewText),
    from: 'DocMetrics <support@docmetrics.io>',
  });
}

// ════════════════════════════════════════════════════════════════
// TRIGGER 3 — DOCUMENT REVISITED
// Called from: track route session_start when isRevisit = true
// ════════════════════════════════════════════════════════════════
export async function sendDocumentRevisitedEmail({
  ownerEmail,
  viewerEmail,
  viewerName,
  documentName,
  documentId,
  visitCount,
  lastVisitAgo,
  device,
  location,
}: {
  ownerEmail: string;
  viewerEmail?: string;
  viewerName?: string;
  documentName: string;
  documentId: string;
  visitCount: number;
  lastVisitAgo?: string;
  device?: string;
  location?: { country?: string; city?: string };
}) {
  const viewer = viewerName || viewerEmail || 'Someone';
  const analyticsUrl = `https://docmetrics.io/documents/${documentId}?tab=performance`;
  const locationStr = location?.city && location?.country
    ? `${location.city}, ${location.country}`
    : location?.country || 'Unknown';

  // Escalate urgency based on visit count
  const urgency = visitCount >= 5 ? 'very high' : visitCount >= 3 ? 'high' : 'medium';
  const emoji = visitCount >= 5 ? '🚨' : visitCount >= 3 ? '🔥' : '🔄';

  const subject = `${emoji} ${viewer} came back — visit #${visitCount} on "${documentName}"`;
  const previewText = `${visitCount} visits is a strong buying signal. This is your moment.`;

  const content = `
    <p class="headline">${emoji} Revisit detected — visit #${visitCount}</p>
    <p class="subline">${viewer} is back on your document. Multiple visits = serious buyer.</p>

    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-number">${visitCount}</div>
        <div class="stat-label">Total visits</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${urgency === 'very high' ? '🚨' : urgency === 'high' ? '🔥' : '👀'}</div>
        <div class="stat-label">${urgency} intent</div>
      </div>
    </div>

    <div class="info-block">
      <div class="info-row">
        <span class="info-label">Viewer</span>
        <span class="info-value">${viewerEmail || viewerName || 'Anonymous'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Document</span>
        <span class="info-value">📄 ${documentName}</span>
      </div>
      ${lastVisitAgo ? `<div class="info-row">
        <span class="info-label">Previous visit</span>
        <span class="info-value">${lastVisitAgo}</span>
      </div>` : ''}
      <div class="info-row">
        <span class="info-label">Location</span>
        <span class="info-value">📍 ${locationStr}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Device</span>
        <span class="info-value">${getDeviceIcon(device || 'desktop')} ${device || 'Desktop'}</span>
      </div>
    </div>

    <div class="alert-box alert-fire">
      <p class="alert-text">💡 <strong>Why revisits matter:</strong> People return to documents when they're comparing options, building internal consensus, or preparing to make a decision. <strong>This is your window.</strong></p>
    </div>

    <a href="${analyticsUrl}" class="cta-btn">📊 View Analytics →</a>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell(content, previewText),
    from: 'DocMetrics <support@docmetrics.io>',
  });
}

// ════════════════════════════════════════════════════════════════
// TRIGGER 4 — LINK EXPIRED OR VIEW LIMIT HIT
// Called from: share route when expiry/limit is reached
// ════════════════════════════════════════════════════════════════
export async function sendLinkExpiredEmail({
  ownerEmail,
  documentName,
  documentId,
  reason,
  totalViews,
  uniqueViewers,
}: {
  ownerEmail: string;
  documentName: string;
  documentId: string;
  reason: 'expired' | 'view_limit' | 'self_destruct';
  totalViews: number;
  uniqueViewers: number;
}) {
  const analyticsUrl = `https://docmetrics.io/documents/${documentId}?tab=activity`;
  const reasonText = reason === 'expired'
    ? 'reached its expiry date'
    : reason === 'view_limit'
    ? 'hit its view limit'
    : 'self-destructed after first view';

  const subject = `⚠️ Your share link for "${documentName}" has ${reason === 'expired' ? 'expired' : 'been deactivated'}`;
  const previewText = `The link ${reasonText} after ${totalViews} views from ${uniqueViewers} viewer${uniqueViewers !== 1 ? 's' : ''}`;

  const content = `
    <p class="headline">⚠️ Share link deactivated</p>
    <p class="subline">Your link for <strong>${documentName}</strong> ${reasonText}.</p>

    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-number">${totalViews}</div>
        <div class="stat-label">Total views</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${uniqueViewers}</div>
        <div class="stat-label">Unique viewers</div>
      </div>
    </div>

    <div class="alert-box alert-info">
      <p class="alert-text">📋 <strong>What now?</strong> You can create a new share link with updated settings from your document dashboard. All analytics from this link are still available.</p>
    </div>

    <a href="${analyticsUrl}" class="cta-btn">📊 View Analytics & Create New Link →</a>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell(content, previewText),
    from: 'DocMetrics <support@docmetrics.io>',
  });
}

// ════════════════════════════════════════════════════════════════
// TRIGGER 5 — DAILY DIGEST
// Called from: a cron job at 8am owner's timezone
// ════════════════════════════════════════════════════════════════
export async function sendDailyDigestEmail({
  ownerEmail,
  ownerName,
  documents,
  totalViewsToday,
  totalUniqueViewersToday,
}: {
  ownerEmail: string;
  ownerName?: string;
  documents: {
    name: string;
    id: string;
    viewsToday: number;
    topViewer?: string;
    avgTimeSeconds: number;
  }[];
  totalViewsToday: number;
  totalUniqueViewersToday: number;
}) {
  if (totalViewsToday === 0) return; // Don't send empty digests

  const subject = `📊 Daily summary: ${totalViewsToday} view${totalViewsToday !== 1 ? 's' : ''} across your documents today`;
  const previewText = `${totalUniqueViewersToday} unique people viewed your documents today`;
  const dashboardUrl = 'https://docmetrics.io/dashboard';

  const docsHtml = documents
    .filter(d => d.viewsToday > 0)
    .slice(0, 5)
    .map(d => `
      <div style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:600;color:#1e293b;">📄 ${d.name}</span>
          <span style="font-size:12px;font-weight:700;color:#0ea5e9;">${d.viewsToday} view${d.viewsToday !== 1 ? 's' : ''}</span>
        </div>
        ${d.topViewer ? `<p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">Top viewer: ${d.topViewer} · Avg time: ${formatTime(d.avgTimeSeconds)}</p>` : ''}
      </div>
    `).join('');

  const content = `
    <p class="headline">📊 Your daily summary</p>
    <p class="subline">Here's what happened with your documents ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.</p>

    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-number">${totalViewsToday}</div>
        <div class="stat-label">Views today</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${totalUniqueViewersToday}</div>
        <div class="stat-label">Unique viewers</div>
      </div>
    </div>

    <p class="section-label">Document activity</p>
    <div class="info-block" style="padding: 4px 16px;">
      ${docsHtml || '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:12px 0;">No activity today</p>'}
    </div>

    <a href="${dashboardUrl}" class="cta-btn">Go to Dashboard →</a>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell(content, previewText),
    from: 'DocMetrics <support@docmetrics.io>',
  });
}

// ════════════════════════════════════════════════════════════════
// DEDUP GUARD — prevent duplicate notifications per session
// ════════════════════════════════════════════════════════════════
export async function hasNotificationBeenSent(
  type: string,
  sessionId: string,
  documentId: string
): Promise<boolean> {
  const db = await dbPromise;
  const existing = await db.collection('notification_log').findOne({
    type,
    sessionId,
    documentId,
  });
  return !!existing;
}

export async function markNotificationSent(
  type: string,
  sessionId: string,
  documentId: string
) {
  const db = await dbPromise;
  await db.collection('notification_log').insertOne({
    type,
    sessionId,
    documentId,
    sentAt: new Date(),
  });
}