import { dbPromise } from "@/app/api/lib/mongodb";

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
    const integration = await db.collection("integrations").findOne({
      userId,
      provider: "slack",
      isActive: true,
    });

    if (!integration || !integration.metadata?.channelId) {
      console.log("Slack not configured for user:", userId);
      return { success: false, reason: "not_configured" };
    }

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: integration.metadata.channelId,
        text: message,
        blocks,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack message failed:", data.error);
      return { success: false, error: data.error };
    }

    console.log("✅ Slack notification sent");
    return { success: true };
  } catch (error) {
    console.error("Slack notification error:", error);
    return { success: false, error };
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function intentBar(level: "high" | "medium" | "low"): string {
  if (level === "high") return "🟢🟢🟢 HIGH";
  if (level === "medium") return "🟡🟡⚪ MEDIUM";
  return "🔴⚪⚪ LOW";
}

function divider() {
  return { type: "divider" };
}

function context(text: string) {
  return {
    type: "context",
    elements: [{ type: "mrkdwn", text }],
  };
}

// ════════════════════════════════════════════════════════════════
// 1. DOCUMENT VIEWED
// ════════════════════════════════════════════════════════════════
export async function notifyDocumentViewed({
  userId,
  documentName,
  viewerName,
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
  const durationStr = formatDuration(duration);
  const visitLabel = isRevisit
    ? `🔄 Revisit #${visitCount || "?"} — *High intent signal*`
    : "👁️ First view";

  const locationStr = location && location !== "Unknown" ? `📍 ${location}` : "📍 Location unavailable";
  const deviceStr = device ? `💻 ${device}` : "💻 Desktop";

  return sendSlackNotification({
    userId,
    message: `👀 ${viewerEmail} just viewed "${documentName}"`,
    blocks: [
      // Header
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*👀 Document Viewed*\n${visitLabel}`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "View Analytics →" },
          url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
          style: "primary",
        },
      },
      divider(),
      // Document info
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*📄 Document*\n${documentName}` },
          { type: "mrkdwn", text: `*⏱ Time Spent*\n${durationStr}` },
          { type: "mrkdwn", text: `*👤 Viewer*\n${viewerEmail}` },
          { type: "mrkdwn", text: `*📊 Pages*\n${pageCount ? `${pageCount} pages` : "—"}` },
          { type: "mrkdwn", text: `*${locationStr.split(" ")[0]} Location*\n${locationStr.replace(/^📍 /, "")}` },
          { type: "mrkdwn", text: `*${deviceStr.split(" ")[0]} Device*\n${deviceStr.replace(/^💻 /, "")}` },
        ],
      },
      divider(),
      // CTA
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "📊 Full Analytics" },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
            style: "primary",
          },
        ],
      },
      context(`DocMetrics • ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// 2. DOCUMENT COMPLETED (full read)
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
  intentLevel?: "high" | "medium" | "low";
  documentId: string;
}) {
  const level = intentLevel || "medium";
  const intentEmoji = level === "high" ? "🔥" : level === "medium" ? "👀" : "📖";
  const intentText = level === "high"
    ? "🎯 *Follow up immediately — they read every word.*"
    : level === "medium"
    ? "📬 *Worth a follow-up this week.*"
    : "📖 *Gauge interest before investing time.*";

  const topPagesText = topPages && topPages.length > 0
    ? topPages.slice(0, 3).map(p => `• Page ${p.page}: *${formatDuration(p.timeSpent)}*`).join("\n")
    : "• No page data available";

  return sendSlackNotification({
    userId,
    message: `${intentEmoji} ${viewerEmail} finished reading "${documentName}" — ${intentBar(level)}`,
    blocks: [
      // Header with intent badge
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${intentEmoji} Full Read Completed*\n${intentBar(level)} INTENT\n\n${intentText}`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "View Analytics →" },
          url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
          style: "primary",
        },
      },
      divider(),
      // Stats
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*📄 Document*\n${documentName}` },
          { type: "mrkdwn", text: `*👤 Viewer*\n${viewerEmail}` },
          { type: "mrkdwn", text: `*⏱ Total Time*\n${formatDuration(totalTimeSeconds)}` },
          { type: "mrkdwn", text: `*📖 Pages Read*\n${totalPages}/${totalPages} (100%)` },
        ],
      },
      // Top pages
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📊 Most time spent on:*\n${topPagesText}`,
        },
      },
      divider(),
      // CTA buttons
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "📊 View Full Analytics" },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
            style: "primary",
          },
        ],
      },
      context(`DocMetrics • ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// 3. SESSION SUMMARY (on session_end)
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
  if (sessionDurationSeconds < 10) return { success: false, reason: "too_short" };

  const completionPct = totalPages > 0
    ? Math.round((pagesViewed.length / totalPages) * 100)
    : 0;

  const engagementLabel = sessionDurationSeconds > 300
    ? "🔥 Deep read"
    : sessionDurationSeconds > 60
    ? "👀 Moderate read"
    : "⚡ Quick scan";

  return sendSlackNotification({
    userId,
    message: `📊 Session ended — ${viewerEmail} spent ${formatDuration(sessionDurationSeconds)} on "${documentName}"`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📊 Session Summary*\n${engagementLabel}`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "View Analytics →" },
          url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
          style: "primary",
        },
      },
      divider(),
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*📄 Document*\n${documentName}` },
          { type: "mrkdwn", text: `*👤 Viewer*\n${viewerEmail}` },
          { type: "mrkdwn", text: `*⏱ Session Duration*\n${formatDuration(sessionDurationSeconds)}` },
          { type: "mrkdwn", text: `*📖 Completion*\n${pagesViewed.length}/${totalPages} pages (${completionPct}%)` },
          { type: "mrkdwn", text: `*💻 Device*\n${device || "Desktop"}` },
          { type: "mrkdwn", text: `*📍 Location*\n${location && location !== "Unknown" ? location : "N/A"}` },
        ],
      },
      divider(),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "📊 Full Analytics" },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
            style: "primary",
          },
        ],
      },
      context(`DocMetrics • ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// 4. SIGNATURE COMPLETED
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
    message: `✅ ${signerName} signed "${documentName}"`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*✅ Signature Collected*\n*${signerName || signerEmail}* has signed your document.`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "View Document →" },
          url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
          style: "primary",
        },
      },
      divider(),
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*📄 Document*\n${documentName}` },
          { type: "mrkdwn", text: `*✍️ Signer*\n${signerEmail}` },
          { type: "mrkdwn", text: `*🕐 Signed At*\n${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` },
          { type: "mrkdwn", text: `*📋 Status*\nCompleted` },
        ],
      },
      divider(),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "📄 View Signed Document" },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
            style: "primary",
          },
        ],
      },
      context(`DocMetrics • ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`),
    ],
  });
}

// ════════════════════════════════════════════════════════════════
// 5. DAILY DIGEST (call from cron job at 8am owner timezone)
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
        .map(l => `• ${l.email} — ${formatDuration(l.timeSpent)} on _${l.document}_`)
        .join("\n")
    : "• No high-intent activity yesterday";

  return sendSlackNotification({
    userId,
    message: `📈 DocMetrics Daily Digest — ${totalViews} views yesterday`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*📈 DocMetrics Daily Digest*\nHere's what happened with your documents yesterday.`,
        },
      },
      divider(),
      // Stats row
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*👁️ Total Views*\n${totalViews}` },
          { type: "mrkdwn", text: `*👥 Unique Viewers*\n${uniqueViewers}` },
          { type: "mrkdwn", text: `*✍️ New Signatures*\n${newSignatures}` },
          {
            type: "mrkdwn",
            text: `*📄 Top Document*\n${topDocument ? `${topDocument.name} (${topDocument.views} views)` : "No views"}`,
          },
        ],
      },
      // Hot leads
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🔥 High Intent Leads Yesterday*\n${leadsText}`,
        },
      },
      divider(),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "📊 View Full Report" },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/reports`,
            style: "primary",
          },
          ...(topDocument
            ? [{
                type: "button",
                text: { type: "plain_text", text: "📄 Top Document" },
                url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${topDocument.id}`,
              }]
            : []),
        ],
      },
      context(`DocMetrics Daily Digest • ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`),
    ],
  });
}