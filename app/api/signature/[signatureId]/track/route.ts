// app/api/signature/[signatureId]/track/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { Resend } from "resend";
import { ObjectId } from "mongodb";
import { sendSlackNotification } from "@/lib/integrations/slack";
import { getValidHubSpotToken } from "@/lib/integrations/hubspot";

const resend = new Resend(process.env.RESEND_API_KEY);

// ── HELPERS ──────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── GMAIL ────────────────────────────────────────────────────────────
async function sendGmailNotification(ownerEmail: string, subject: string, htmlBody: string) {
  console.log("📧 Attempting Gmail send to:", ownerEmail, "| Subject:", subject);
  try {
    const result = await resend.emails.send({
      from: "DocMetrics <noreply@docmetrics.io>",
      to: ownerEmail,
      subject,
      html: htmlBody,
    });
    console.log("✅ Gmail sent:", result);
  } catch (err) {
    console.error("❌ Gmail notification error:", err);
  }
}

function buildSignatureEmailHtml({
  title,
  subtitle,
  stats,
  color = "#7c3aed",
}: {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string }>;
  color?: string;
}) {
  const statsHtml = stats
    .map(
      (s) => `
      <td style="padding:0 12px;text-align:center;border-right:1px solid #e2e8f0">
        <div style="font-size:22px;font-weight:900;color:#0f172a">${s.value}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:1px">${s.label}</div>
      </td>`
    )
    .join("");

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
  <div style="height:5px;background:linear-gradient(90deg,${color},#3b82f6)"></div>
  <div style="padding:28px 32px 20px">
    <div style="display:inline-flex;align-items:center;gap:8px;background:${color}15;border-radius:999px;padding:6px 14px;margin-bottom:16px">
      <span style="font-size:13px;font-weight:700;color:${color}">✍️ Signature Update</span>
    </div>
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a">${title}</h1>
    <p style="margin:0;font-size:14px;color:#64748b">${subtitle}</p>
  </div>
  <div style="padding:0 32px 24px">
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <tr style="background:#f8fafc">${statsHtml}</tr>
    </table>
  </div>
  <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">DocMetrics · Signature Tracking</p>
  </div>
</div></body></html>`;
}

// ── HUBSPOT HELPER ───────────────────────────────────────────────────
async function syncToHubSpot(
  ownerId: string,
  recipientEmail: string,
  documentName: string,
  actionLabel: string,
  noteBody: string,
  extraProps: Record<string, string>
) {
  try {
    const token = await getValidHubSpotToken(ownerId);

    // Find contact by email
    const searchRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: recipientEmail }] }],
        properties: ["email", "firstname", "lastname"],
        limit: 1,
      }),
    });
    const searchData = await searchRes.json();
    const contact = searchData.results?.[0];

    console.log("🔍 HubSpot contact search for:", recipientEmail, "| found:", !!contact);

    if (!contact) {
      console.log("❌ HubSpot: No contact found for:", recipientEmail);
      return;
    }

    const contactId = contact.id;
    console.log("✅ HubSpot contact found:", contactId);

    // Update contact properties
    await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ properties: extraProps }),
    });

    // Create note
    const noteRes = await fetch(`https://api.hubapi.com/crm/v3/objects/notes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        properties: {
          hs_note_body: noteBody,
          hs_timestamp: new Date().getTime().toString(),
        },
      }),
    });
    const noteData = await noteRes.json();

    // Associate note to contact
    if (noteData.id) {
      await fetch(
        `https://api.hubapi.com/crm/v3/objects/notes/${noteData.id}/associations/contacts/${contactId}/note_to_contact`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ HubSpot note created and associated for:", recipientEmail);
    }
  } catch (err) {
    console.error("❌ HubSpot sync error:", err);
  }
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;

    // Safe JSON parse — sendBeacon can send empty body
    let body: any = {};
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      // empty body, ignore
    }

    const { action, page, timeSpent, userAgent: bodyUserAgent } = body;

    const db = await dbPromise;

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // ── Fetch document name ──
    let doc = null;
    try {
      doc = await db.collection("documents").findOne({
        $or: [
          { _id: new ObjectId(signatureRequest.documentId?.toString()) },
          { _id: signatureRequest.documentId },
        ],
      });
    } catch { /* invalid ObjectId */ }
    const documentName = doc?.originalFilename || doc?.filename || "Document";

    // ── Fetch owner ──
    const owner = await db.collection("users").findOne({
      _id: signatureRequest.ownerId || signatureRequest.createdBy,
    });
    const ownerEmail = owner?.email || signatureRequest.ownerEmail;
    const ownerId = owner?._id?.toString() || signatureRequest.ownerId?.toString();

    const recipientName = signatureRequest.recipientName || signatureRequest.recipient?.name || "Recipient";
    const recipientEmail = signatureRequest.recipientEmail || signatureRequest.recipient?.email || "";

    const now = new Date();
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown";
    const userAgent = bodyUserAgent || request.headers.get("user-agent") || "";

    console.log("🔍 SIG TRACK:", { action, documentName, ownerEmail, ownerId, recipientEmail });

    // ════════════════════════════════════════
    // ACTION: viewed
    // ════════════════════════════════════════
    if (action === "viewed") {
      const isFirstView = !signatureRequest.viewedAt;

      const update: any = {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: now },
        $push: { viewHistory: { viewedAt: now, ip, userAgent } },
      };
      if (isFirstView) update.$set.viewedAt = now;

      await db.collection("signature_requests").updateOne({ uniqueId: signatureId }, update);

      const viewCount = (signatureRequest.viewCount || 0) + 1;
      const eventLabel = isFirstView ? "Signature Link Opened" : "Signature Link Revisited";

      // ── Gmail ──
      if (ownerEmail) {
        sendGmailNotification(
          ownerEmail,
          `${isFirstView ? "✍️" : "👀"} ${recipientName} ${isFirstView ? "opened" : "revisited"} "${documentName}"`,
          buildSignatureEmailHtml({
            title: eventLabel,
            subtitle: `${recipientName} (${recipientEmail}) just ${isFirstView ? "opened" : "revisited"} their signing link.`,
            stats: [
              { label: "Recipient", value: recipientName },
              { label: "Visit #", value: String(viewCount) },
              { label: "Time", value: new Date().toLocaleTimeString() },
            ],
            color: isFirstView ? "#7c3aed" : "#0ea5e9",
          })
        ).catch(() => {});
      }

      // ── Slack ──
      if (ownerId) {
        sendSlackNotification({
          userId: ownerId,
          message: `${isFirstView ? "✍️" : "👀"} ${recipientName} ${isFirstView ? "opened" : `revisited (visit #${viewCount})`} their signing link for "${documentName}"`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${isFirstView ? "✍️" : "👀"} *${eventLabel}*\n*${recipientName}* (${recipientEmail}) ${isFirstView ? "just opened" : `revisited (visit #${viewCount})`} their signing link for *${documentName}*`,
              },
            },
            { type: "divider" },
            {
              type: "context",
              elements: [{ type: "mrkdwn", text: `📅 ${new Date().toLocaleString()} · 🌐 ${ip}` }],
            },
          ],
        }).catch(() => {});
      }

      // ── HubSpot ──
      if (ownerId && recipientEmail) {
        syncToHubSpot(
          ownerId,
          recipientEmail,
          documentName,
          eventLabel,
          `✍️ ${eventLabel}\n\nDocument: ${documentName}\nRecipient: ${recipientName} (${recipientEmail})\nVisit #${viewCount}\nTime: ${new Date().toLocaleString()}`,
          {
            docmetrics_last_document: documentName,
            docmetrics_last_viewed: now.toISOString(),
            docmetrics_view_count: String(viewCount),
          }
        ).catch(() => {});
      }
    }

    // ════════════════════════════════════════
    // ACTION: time_spent
    // ════════════════════════════════════════
    else if (action === "time_spent") {
      if (typeof timeSpent === "number" && timeSpent > 0) {
        await db.collection("signature_requests").updateOne(
          { uniqueId: signatureId },
          { $inc: { totalTimeSpentSeconds: timeSpent } }
        );

        const newTotal = (signatureRequest.totalTimeSpentSeconds || 0) + timeSpent;

        if (timeSpent > 10) {
          // ── Slack ──
          if (ownerId) {
            sendSlackNotification({
              userId: ownerId,
              message: `⏱️ ${recipientName} spent ${formatDuration(timeSpent)} reviewing "${documentName}"`,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `⏱️ *Signing Session Summary*\n*${recipientName}* spent *${formatDuration(timeSpent)}* reviewing "${documentName}"\nTotal time: *${formatDuration(newTotal)}*`,
                  },
                },
              ],
            }).catch(() => {});
          }

          // ── HubSpot ──
          if (ownerId && recipientEmail) {
            syncToHubSpot(
              ownerId,
              recipientEmail,
              documentName,
              "Signing Session",
              `⏱️ Signing Session\n\nDocument: ${documentName}\nRecipient: ${recipientName} (${recipientEmail})\nSession time: ${formatDuration(timeSpent)}\nTotal time: ${formatDuration(newTotal)}`,
              {
                docmetrics_total_read_time: String(newTotal),
                docmetrics_last_session_time: String(timeSpent),
              }
            ).catch(() => {});
          }
        }
      }
    }

    // ════════════════════════════════════════
    // ACTION: page_scroll
    // ════════════════════════════════════════
    else if (action === "page_scroll") {
      if (typeof page === "number") {
        await db.collection("signature_requests").updateOne(
          { uniqueId: signatureId },
          {
            $addToSet: { pagesViewed: page },
            $set: { lastActivePage: page, lastSeenAt: now },
          }
        );
      }
    }

    // ════════════════════════════════════════
    // ACTION: page_time
    // ════════════════════════════════════════
    else if (action === "page_time") {
      if (typeof page === "number" && typeof timeSpent === "number" && timeSpent > 0) {
        const existing = signatureRequest.pageData?.find((p: any) => p.page === page);
        if (existing) {
          await db.collection("signature_requests").updateOne(
            { uniqueId: signatureId, "pageData.page": page },
            { $inc: { "pageData.$.timeSpent": timeSpent } }
          );
        } else {
          await db.collection("signature_requests").updateOne(
            { uniqueId: signatureId },
            { $push: { pageData: { page, timeSpent, skipped: false } as any } }
          );
        }
      }
    }

    // ════════════════════════════════════════
    // ACTION: signed
    // ════════════════════════════════════════
    else if (action === "signed") {
      const totalTime = signatureRequest.totalTimeSpentSeconds || 0;
      const pagesViewed = (signatureRequest.pagesViewed || []).length;

      // ── Gmail ──
      if (ownerEmail) {
        sendGmailNotification(
          ownerEmail,
          `✅ ${recipientName} signed "${documentName}"`,
          buildSignatureEmailHtml({
            title: "Document Signed! 🎉",
            subtitle: `${recipientName} (${recipientEmail}) has completed signing "${documentName}".`,
            stats: [
              { label: "Signer", value: recipientName },
              { label: "Time Reading", value: formatDuration(totalTime) },
              { label: "Pages Viewed", value: String(pagesViewed) },
            ],
            color: "#22c55e",
          })
        ).catch(() => {});
      }

      // ── Slack ──
      if (ownerId) {
        sendSlackNotification({
          userId: ownerId,
          message: `✅ ${recipientName} signed "${documentName}"`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `✅ *Document Signed!*\n*${recipientName}* (${recipientEmail}) has signed *${documentName}*\n⏱️ Time reading: *${formatDuration(totalTime)}* · 📄 Pages viewed: *${pagesViewed}*`,
              },
            },
            { type: "divider" },
            {
              type: "context",
              elements: [{ type: "mrkdwn", text: `🕐 Signed at ${new Date().toLocaleString()}` }],
            },
          ],
        }).catch(() => {});
      }

      // ── HubSpot ──
      if (ownerId && recipientEmail) {
        syncToHubSpot(
          ownerId,
          recipientEmail,
          documentName,
          "Document Signed",
          `✅ Document Signed!\n\nDocument: ${documentName}\nSigner: ${recipientName} (${recipientEmail})\nTime reading: ${formatDuration(totalTime)}\nPages viewed: ${pagesViewed}\nSigned at: ${new Date().toLocaleString()}`,
          {
            docmetrics_last_document: documentName,
            docmetrics_completed_read: "true",
            docmetrics_total_read_time: String(totalTime),
            docmetrics_intent_level: "HIGH",
          }
        ).catch(() => {});
      }
    }

    // ════════════════════════════════════════
    // ACTION: declined
    // ════════════════════════════════════════
    else if (action === "declined") {
      const reason = body.reason || "No reason provided";

      // ── Gmail ──
      if (ownerEmail) {
        sendGmailNotification(
          ownerEmail,
          `❌ ${recipientName} declined to sign "${documentName}"`,
          buildSignatureEmailHtml({
            title: "Signing Declined",
            subtitle: `${recipientName} (${recipientEmail}) declined to sign "${documentName}".`,
            stats: [
              { label: "Signer", value: recipientName },
              { label: "Reason", value: reason.substring(0, 30) },
              { label: "Time", value: new Date().toLocaleTimeString() },
            ],
            color: "#ef4444",
          })
        ).catch(() => {});
      }

      // ── Slack ──
      if (ownerId) {
        sendSlackNotification({
          userId: ownerId,
          message: `❌ ${recipientName} declined to sign "${documentName}"`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `❌ *Signing Declined*\n*${recipientName}* (${recipientEmail}) declined to sign *${documentName}*\n💬 Reason: _${reason}_`,
              },
            },
          ],
        }).catch(() => {});
      }

      // ── HubSpot ──
      if (ownerId && recipientEmail) {
        syncToHubSpot(
          ownerId,
          recipientEmail,
          documentName,
          "Signing Declined",
          `❌ Signing Declined\n\nDocument: ${documentName}\nSigner: ${recipientName} (${recipientEmail})\nReason: ${reason}\nDeclined at: ${new Date().toLocaleString()}`,
          {
            docmetrics_last_document: documentName,
            docmetrics_intent_level: "LOW",
          }
        ).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Signature track error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}