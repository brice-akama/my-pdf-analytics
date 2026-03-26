// lib/documentNotifications.ts

import { sendEmail } from './email';
import { dbPromise } from '@/app/api/lib/mongodb';

// ── Helpers ───────────────────────────────────────────────────────

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

// ── Base shell ────────────────────────────────────────────────────

function emailShell(content: string, previewText: string): string {
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
  .title { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 4px; line-height: 1.3; }
  .meta { font-size: 13px; color: #64748b; margin-bottom: 28px; }
  .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .table tr:last-child td { border-bottom: none; }
  .table .lbl { font-size: 12px; color: #94a3b8; font-weight: 500; width: 40%; }
  .table .val { font-size: 13px; color: #0f172a; font-weight: 600; text-align: right; }
  .stats { display: table; width: 100%; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
  .stat { display: table-cell; padding: 16px; text-align: center; border-right: 1px solid #e2e8f0; }
  .stat:last-child { border-right: none; }
  .stat-n { font-size: 20px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 3px; }
  .stat-l { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; display: block; }
  .bar-row { margin-bottom: 10px; }
  .bar-label { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .bar-label span { font-size: 12px; color: #475569; font-weight: 500; }
  .bar-label strong { font-size: 12px; color: #0f172a; }
  .bar-track { background: #f1f5f9; border-radius: 3px; height: 5px; overflow: hidden; }
  .bar-fill { height: 5px; border-radius: 3px; background: #0f172a; }
  .section-head { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .cta { display: block; text-align: center; margin-top: 28px; }
  .cta a { display: inline-block; padding: 11px 28px; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.2px; }
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
    <div class="head">
      <span class="wordmark">DocMetrics</span>
    </div>
    <div class="body">${content}</div>
    <div class="foot">
      <p>
        You are receiving this because view notifications are enabled on your account.<br>
        <a href="https://docmetrics.io/dashboard">Manage notifications</a>
        &nbsp;&middot;&nbsp;
        <a href="https://docmetrics.io/dashboard">Dashboard</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
// TRIGGER 1 — DOCUMENT OPENED
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
  const viewer = viewerEmail || viewerName || 'Anonymous';
  const locationStr = [location?.city, location?.country].filter(Boolean).join(', ') || 'Unknown';
  const deviceLabel = device ? device.charAt(0).toUpperCase() + device.slice(1) : 'Desktop';
  const analyticsUrl = `https://docmetrics.io/documents/${documentId}?tab=performance`;
  const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const subject = isFirstEverView
    ? `"${documentName}" was opened for the first time`
    : `"${documentName}" was opened`;

  const previewText = `${viewer} opened your document from ${locationStr}`;

  const content = `
    <p class="title">${isFirstEverView ? 'First view' : 'Document opened'}</p>
    <p class="meta">${viewer} opened your document.</p>

    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${documentName}</td>
      </tr>
      <tr>
        <td class="lbl">Viewer</td>
        <td class="val">${viewer}</td>
      </tr>
      <tr>
        <td class="lbl">Location</td>
        <td class="val">${locationStr}</td>
      </tr>
      <tr>
        <td class="lbl">Device</td>
        <td class="val">${deviceLabel}</td>
      </tr>
      <tr>
        <td class="lbl">Time</td>
        <td class="val">${now}</td>
      </tr>
    </table>

    <div class="cta"><a href="${analyticsUrl}">View analytics</a></div>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell(content, previewText),
    from: 'DocMetrics <noreply@docmetrics.io>',
  });
}

// ════════════════════════════════════════════════════════════════
// TRIGGER 2 — DOCUMENT COMPLETED
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
  const viewer = viewerEmail || viewerName || 'Anonymous';
  const analyticsUrl = `https://docmetrics.io/documents/${documentId}?tab=performance`;
  const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const subject = `"${documentName}" was read in full`;
  const previewText = `${viewer} read all ${totalPages} pages and spent ${formatTime(totalTimeSeconds)}`;

  const topPagesHtml = topPages && topPages.length > 0 && totalTimeSeconds > 0
    ? `<p class="section-head" style="margin-top:24px;">Pages by time spent</p>
       ${topPages.slice(0, 3).map(p => {
         const pct = Math.min(Math.round((p.timeSpent / totalTimeSeconds) * 100), 100);
         return `<div class="bar-row">
           <div class="bar-label">
             <span>Page ${p.page}</span>
             <strong>${formatTime(p.timeSpent)}</strong>
           </div>
           <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
         </div>`;
       }).join('')}`
    : '';

  const content = `
    <p class="title">Document completed</p>
    <p class="meta">${viewer} finished reading every page.</p>

    <div class="stats">
      <div class="stat">
        <span class="stat-n">${formatTime(totalTimeSeconds)}</span>
        <span class="stat-l">Total time</span>
      </div>
      <div class="stat">
        <span class="stat-n">${totalPages}</span>
        <span class="stat-l">Pages read</span>
      </div>
      ${intentLevel ? `<div class="stat">
        <span class="stat-n">${intentLevel.charAt(0).toUpperCase() + intentLevel.slice(1)}</span>
        <span class="stat-l">Engagement</span>
      </div>` : ''}
    </div>

    <table class="table">
      <tr>
        <td class="lbl">Viewer</td>
        <td class="val">${viewer}</td>
      </tr>
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${documentName}</td>
      </tr>
      <tr>
        <td class="lbl">Completed</td>
        <td class="val">${now}</td>
      </tr>
    </table>

    ${topPagesHtml}

    <div class="cta"><a href="${analyticsUrl}">View analytics</a></div>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell(content, previewText),
    from: 'DocMetrics <noreply@docmetrics.io>',
  });
}

// ════════════════════════════════════════════════════════════════
// TRIGGER 3 — DOCUMENT REVISITED
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
  const viewer = viewerEmail || viewerName || 'Anonymous';
  const analyticsUrl = `https://docmetrics.io/documents/${documentId}?tab=performance`;
  const locationStr = [location?.city, location?.country].filter(Boolean).join(', ') || 'Unknown';
  const deviceLabel = device ? device.charAt(0).toUpperCase() + device.slice(1) : 'Desktop';

  const subject = `"${documentName}" was opened again — visit ${visitCount}`;
  const previewText = `${viewer} returned to your document for the ${visitCount}${visitCount === 2 ? 'nd' : visitCount === 3 ? 'rd' : 'th'} time`;

  const content = `
    <p class="title">Document revisited</p>
    <p class="meta">${viewer} opened your document again.</p>

    <div class="stats">
      <div class="stat">
        <span class="stat-n">${visitCount}</span>
        <span class="stat-l">Total visits</span>
      </div>
    </div>

    <table class="table">
      <tr>
        <td class="lbl">Viewer</td>
        <td class="val">${viewer}</td>
      </tr>
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${documentName}</td>
      </tr>
      ${lastVisitAgo ? `<tr>
        <td class="lbl">Previous visit</td>
        <td class="val">${lastVisitAgo}</td>
      </tr>` : ''}
      <tr>
        <td class="lbl">Location</td>
        <td class="val">${locationStr}</td>
      </tr>
      <tr>
        <td class="lbl">Device</td>
        <td class="val">${deviceLabel}</td>
      </tr>
    </table>

    <div class="cta"><a href="${analyticsUrl}">View analytics</a></div>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell(content, previewText),
    from: 'DocMetrics <noreply@docmetrics.io>',
  });
}

// ════════════════════════════════════════════════════════════════
// TRIGGER 4 — LINK EXPIRED OR VIEW LIMIT HIT
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

  const reasonText =
    reason === 'expired' ? 'reached its expiry date' :
    reason === 'view_limit' ? 'reached its view limit' :
    'was set to deactivate after first view';

  const subject = `Share link for "${documentName}" is no longer active`;
  const previewText = `The link ${reasonText} after ${totalViews} view${totalViews !== 1 ? 's' : ''}`;

  const content = `
    <p class="title">Share link deactivated</p>
    <p class="meta">The link for <strong>${documentName}</strong> ${reasonText}.</p>

    <div class="stats">
      <div class="stat">
        <span class="stat-n">${totalViews}</span>
        <span class="stat-l">Total views</span>
      </div>
      <div class="stat">
        <span class="stat-n">${uniqueViewers}</span>
        <span class="stat-l">Unique viewers</span>
      </div>
    </div>

    <div class="cta"><a href="${analyticsUrl}">View analytics</a></div>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell(content, previewText),
    from: 'DocMetrics <noreply@docmetrics.io>',
  });
}

// ════════════════════════════════════════════════════════════════
// TRIGGER 5 — DAILY DIGEST
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
  if (totalViewsToday === 0) return;

  const subject = `${totalViewsToday} view${totalViewsToday !== 1 ? 's' : ''} across your documents today`;
  const previewText = `${totalUniqueViewersToday} unique viewer${totalUniqueViewersToday !== 1 ? 's' : ''} today`;
  const dashboardUrl = 'https://docmetrics.io/dashboard';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const activeDocs = documents.filter(d => d.viewsToday > 0).slice(0, 5);

  const docsHtml = activeDocs.map(d => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:500;">${d.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:700;text-align:right;">${d.viewsToday}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#94a3b8;text-align:right;">${formatTime(d.avgTimeSeconds)} avg</td>
    </tr>
  `).join('');

  const content = `
    <p class="title">Daily summary</p>
    <p class="meta">${dateStr}</p>

    <div class="stats">
      <div class="stat">
        <span class="stat-n">${totalViewsToday}</span>
        <span class="stat-l">Views</span>
      </div>
      <div class="stat">
        <span class="stat-n">${totalUniqueViewersToday}</span>
        <span class="stat-l">Unique viewers</span>
      </div>
    </div>

    ${activeDocs.length > 0 ? `
      <p class="section-head">Documents</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="font-size:10px;font-weight:600;color:#94a3b8;text-align:left;padding-bottom:8px;text-transform:uppercase;letter-spacing:0.8px;">Name</th>
            <th style="font-size:10px;font-weight:600;color:#94a3b8;text-align:right;padding-bottom:8px;text-transform:uppercase;letter-spacing:0.8px;">Views</th>
            <th style="font-size:10px;font-weight:600;color:#94a3b8;text-align:right;padding-bottom:8px;text-transform:uppercase;letter-spacing:0.8px;">Avg time</th>
          </tr>
        </thead>
        <tbody>${docsHtml}</tbody>
      </table>
    ` : ''}

    <div class="cta"><a href="${dashboardUrl}">Open dashboard</a></div>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell(content, previewText),
    from: 'DocMetrics <noreply@docmetrics.io>',
  });
}

// ════════════════════════════════════════════════════════════════
// DEDUP GUARD
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