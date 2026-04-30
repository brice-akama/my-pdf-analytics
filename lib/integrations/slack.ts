// lib/integrations/slack.ts
import { dbPromise } from '@/app/api/lib/mongodb';

// ── Core sender ───────────────────────────────────────────────────
export async function sendSlackNotification({
  userId,
  message,
  blocks,
}: {
  userId: string;
  message: string;
  blocks?: any[];
}) {
  try {
    const db = await dbPromise;
    const integration = await db.collection('integrations').findOne({
      userId,
      provider: 'slack',
      isActive: true,
    });

    if (!integration || !integration.metadata?.channelId) {
      return { success: false, reason: 'not_configured' };
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel:      integration.metadata.channelId,
        text:         message,
        blocks,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Slack message failed:', data.error);
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Slack notification error:', error);
    return { success: false, error };
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function divider() {
  return { type: 'divider' };
}

function context(text: string) {
  return {
    type: 'context',
    elements: [{ type: 'mrkdwn', text }],
  };
}

function analyticsButton(documentId: string, label = 'View Analytics') {
  return {
    type: 'button',
    text: { type: 'plain_text', text: label },
    url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
  };
}

const ts = () =>
  new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

// ════════════════════════════════════════════════════════════════
// 1 — DOCUMENT VIEWED
// ════════════════════════════════════════════════════════════════
export async function notifyDocumentViewed({
  userId,
  documentName,
  viewerEmail,
  duration,
  location,
  device,
  documentId,
  pageCount,
  isRevisit,
  visitCount,
}: {
  userId: string;
  documentName: string;
  viewerName: string;
  viewerEmail: string;
  duration: number;
  location?: string;
  device?: string;
  documentId: string;
  pageCount?: number;
  isRevisit?: boolean;
  visitCount?: number;
}) {
  const title = isRevisit
    ? `Document Revisited — Visit ${visitCount || '?'}`
    : 'Document Opened';

  return sendSlackNotification({
    userId,
    message: `${viewerEmail} opened "${documentName}"`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${title}*` },
        accessory: analyticsButton(documentId),
      },
      divider(),
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Document*\n${documentName}` },
          { type: 'mrkdwn', text: `*Viewer*\n${viewerEmail}` },
          { type: 'mrkdwn', text: `*Pages*\n${pageCount ?? '—'}` },
          { type: 'mrkdwn', text: `*Device*\n${device || 'Desktop'}` },
          { type: 'mrkdwn', text: `*Location*\n${location || 'Unknown'}` },
          { type: 'mrkdwn', text: `*Time*\n${ts()}` },
        ],
      },
      context('DocMetrics'),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// 2 — DOCUMENT COMPLETED
// ════════════════════════════════════════════════════════════════
export async function notifyDocumentCompleted({
  userId,
  documentName,
  viewerEmail,
  totalTimeSeconds,
  totalPages,
  topPages,
  intentLevel,
  documentId,
}: {
  userId: string;
  documentName: string;
  viewerEmail: string;
  totalTimeSeconds: number;
  totalPages: number;
  topPages?: { page: number; timeSpent: number }[];
  intentLevel?: 'high' | 'medium' | 'low';
  documentId: string;
}) {
  const engagementLabel = intentLevel
    ? intentLevel.charAt(0).toUpperCase() + intentLevel.slice(1)
    : '—';

  const topPagesText = topPages && topPages.length > 0
    ? topPages.slice(0, 3).map(p => `Page ${p.page}: ${formatDuration(p.timeSpent)}`).join('  ·  ')
    : '—';

  return sendSlackNotification({
    userId,
    message: `${viewerEmail} finished reading "${documentName}"`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Document Completed*' },
        accessory: analyticsButton(documentId),
      },
      divider(),
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Document*\n${documentName}` },
          { type: 'mrkdwn', text: `*Viewer*\n${viewerEmail}` },
          { type: 'mrkdwn', text: `*Total time*\n${formatDuration(totalTimeSeconds)}` },
          { type: 'mrkdwn', text: `*Pages read*\n${totalPages}/${totalPages}` },
          { type: 'mrkdwn', text: `*Engagement*\n${engagementLabel}` },
          { type: 'mrkdwn', text: `*Completed*\n${ts()}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Pages by time spent*\n${topPagesText}` },
      },
      context('DocMetrics'),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// 3 — SESSION SUMMARY
// ════════════════════════════════════════════════════════════════
export async function notifySessionSummary({
  userId,
  documentName,
  viewerEmail,
  sessionDurationSeconds,
  pagesViewed,
  totalPages,
  device,
  location,
  documentId,
}: {
  userId: string;
  documentName: string;
  viewerEmail: string;
  sessionDurationSeconds: number;
  pagesViewed: number[];
  totalPages: number;
  device?: string;
  location?: string;
  documentId: string;
}) {
  if (sessionDurationSeconds < 10) return { success: false, reason: 'too_short' };

  const completionPct = totalPages > 0
    ? Math.round((pagesViewed.length / totalPages) * 100)
    : 0;

  return sendSlackNotification({
    userId,
    message: `${viewerEmail} spent ${formatDuration(sessionDurationSeconds)} on "${documentName}"`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Session Summary*' },
        accessory: analyticsButton(documentId),
      },
      divider(),
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Document*\n${documentName}` },
          { type: 'mrkdwn', text: `*Viewer*\n${viewerEmail}` },
          { type: 'mrkdwn', text: `*Duration*\n${formatDuration(sessionDurationSeconds)}` },
          { type: 'mrkdwn', text: `*Pages*\n${pagesViewed.length}/${totalPages} (${completionPct}%)` },
          { type: 'mrkdwn', text: `*Device*\n${device || 'Desktop'}` },
          { type: 'mrkdwn', text: `*Location*\n${location || 'Unknown'}` },
        ],
      },
      context('DocMetrics'),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// 4 — SIGNATURE COMPLETED
// ════════════════════════════════════════════════════════════════
export async function notifySignatureCompleted({
  userId,
  documentName,
  signerName,
  signerEmail,
  documentId,
}: {
  userId: string;
  documentName: string;
  signerName: string;
  signerEmail: string;
  documentId: string;
}) {
  return sendSlackNotification({
    userId,
    message: `${signerName || signerEmail} signed "${documentName}"`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*Signature Collected*' },
        accessory: analyticsButton(documentId, 'View Document'),
      },
      divider(),
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Document*\n${documentName}` },
          { type: 'mrkdwn', text: `*Signer*\n${signerEmail}` },
          { type: 'mrkdwn', text: `*Name*\n${signerName || '—'}` },
          { type: 'mrkdwn', text: `*Signed*\n${ts()}` },
        ],
      },
      context('DocMetrics'),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// 5 — DAILY DIGEST
// ════════════════════════════════════════════════════════════════
export async function notifyDailyDigest({
  userId,
  stats,
}: {
  userId: string;
  stats: {
    totalViews: number;
    uniqueViewers: number;
    topDocument: { name: string; views: number; id: string } | null;
    highIntentLeads: { email: string; document: string; timeSpent: number }[];
    newSignatures: number;
  };
}) {
  const { totalViews, uniqueViewers, topDocument, highIntentLeads, newSignatures } = stats;

  const leadsText = highIntentLeads.length > 0
    ? highIntentLeads.slice(0, 3)
        .map(l => `${l.email}  ·  ${formatDuration(l.timeSpent)}  ·  ${l.document}`)
        .join('\n')
    : 'No activity';

  const dateStr = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });

  return sendSlackNotification({
    userId,
    message: `Daily summary — ${totalViews} views`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Daily Summary*\n${dateStr}` },
      },
      divider(),
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Views*\n${totalViews}` },
          { type: 'mrkdwn', text: `*Unique viewers*\n${uniqueViewers}` },
          { type: 'mrkdwn', text: `*Signatures*\n${newSignatures}` },
          {
            type: 'mrkdwn',
            text: `*Top document*\n${topDocument ? `${topDocument.name} (${topDocument.views})` : '—'}`,
          },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Most engaged viewers*\n${leadsText}` },
      },
      divider(),
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Dashboard' },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          },
          ...(topDocument ? [{
            type: 'button',
            text: { type: 'plain_text', text: topDocument.name },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${topDocument.id}`,
          }] : []),
        ],
      },
      context('DocMetrics'),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// 6 — PORTAL / SPACE EVENT
// ════════════════════════════════════════════════════════════════
export async function notifyPortalEvent({
  userId,
  visitorEmail,
  spaceName,
  spaceId,
  event,
  documentName,
  isRevisit,
  visitCount,
}: {
  userId: string;
  visitorEmail: string;
  spaceName: string;
  spaceId: string;
  event: 'document_open' | 'revisit' | 'document_view' | 'download' | 'portal_enter';
  documentName?: string;
  isRevisit?: boolean;
  visitCount?: number;
}) {
  const spaceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/spaces/${spaceId}`;
  const normalised = event === 'portal_enter' ? 'document_open' : event;

  const titleMap: Record<string, string> = {
    document_open: 'Space Opened',
    revisit:       `Space Revisited${visitCount ? ` — Visit ${visitCount}` : ''}`,
    document_view: 'Document Viewed',
    download:      'Document Downloaded',
  };

  const title = titleMap[normalised] || 'Space Event';

  const fields: { type: 'mrkdwn'; text: string }[] = [
    { type: 'mrkdwn', text: `*Visitor*\n${visitorEmail}` },
    { type: 'mrkdwn', text: `*Space*\n${spaceName}` },
    { type: 'mrkdwn', text: `*Time*\n${ts()}` },
  ];

  if (documentName) {
    fields.push({ type: 'mrkdwn', text: `*Document*\n${documentName}` });
  }

  if (isRevisit && visitCount) {
    fields.push({ type: 'mrkdwn', text: `*Visit number*\n${visitCount}` });
  }

  return sendSlackNotification({
    userId,
    message: `${visitorEmail} — ${title} — ${spaceName}`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${title}*` },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'View Space' },
          url: spaceUrl,
        },
      },
      divider(),
      { type: 'section', fields },
      context('DocMetrics'),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// 7 — DEAL INSIGHT (where did this deal slow down)
// ════════════════════════════════════════════════════════════════
export async function notifyDealInsight({
  userId,
  documentName,
  documentId,
  viewerEmail,
  slowestPage,
  slowestPageTime,
  avgPageTime,
  skippedPages,
  totalPages,
  trigger, // 'session_end' | 'gone_silent'
  daysSilent,
  narrative: narrativeOverride,
}: {
  userId: string;
  documentName: string;
  documentId: string;
  viewerEmail: string;
  slowestPage: number;
  slowestPageTime: number;
  avgPageTime: number;
  skippedPages: number[];
  totalPages: number;
  trigger: 'session_end' | 'gone_silent';
  daysSilent?: number;
  narrative?: string;
}) {
  const multiplier = avgPageTime > 0
    ? (slowestPageTime / avgPageTime).toFixed(1)
    : '?';

  const skippedText = skippedPages.length > 0
    ? `Page ${skippedPages.join(', ')} never opened`
    : 'All pages opened';

  const title = trigger === 'gone_silent'
    ? `Deal Going Cold — ${daysSilent} days silent`
    : 'Deal Insight — Session Just Ended';

  const insight = trigger === 'gone_silent'
    ? `*${viewerEmail}* opened your proposal ${daysSilent} days ago and hasn't returned. Last thing they saw was page ${slowestPage}.`
    : `*${viewerEmail}* just finished a session. They spent ${multiplier}x longer than average on page ${slowestPage}.`;

  const narrative = narrativeOverride || insight;

  return sendSlackNotification({
    userId,
    message: `Deal insight for ${viewerEmail} on "${documentName}"`,
    blocks: [
     {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${title}*` },
        accessory: analyticsButton(documentId, 'View Analytics'),
      },
      divider(),
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ` *Prospect:* ${viewerEmail}\n\n${narrative}`,
        },
      },
      divider(),
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Document*\n${documentName}` },
          { type: 'mrkdwn', text: `*Viewer*\n${viewerEmail}` },
          { type: 'mrkdwn', text: `*Slowest page*\nPage ${slowestPage} (${formatDuration(slowestPageTime)})` },
          { type: 'mrkdwn', text: `*Avg per page*\n${formatDuration(avgPageTime)}` },
          { type: 'mrkdwn', text: `*Skipped*\n${skippedText}` },
          { type: 'mrkdwn', text: `*Total pages*\n${totalPages}` },
        ],
      },
      context('DocMetrics'),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// HELPER — Check if Slack is connected
// ════════════════════════════════════════════════════════════════
export async function isSlackConnected(userId: string): Promise<boolean> {
  try {
    const db = await dbPromise;
    const integration = await db.collection('integrations').findOne({
      userId,
      provider: 'slack',
      isActive: true,
      'metadata.channelId': { $exists: true },
    });
    return !!integration;
  } catch {
    return false;
  }
}