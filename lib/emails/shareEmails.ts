// lib/emails/shareEmails.ts
// lib/emails/shareEmails.ts
import { Resend } from "resend";
import { dbPromise } from "@/app/api/lib/mongodb";
import { getValidGmailToken } from "@/lib/integrations/gmail";
import { getValidOutlookToken } from "@/lib/integrations/outlook";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// Core Resend sender
// ─────────────────────────────────────────────────────────────────────────────

export async function sendShareLinkEmail({
  recipientEmail,
  senderName,
  documentName,
  shareLink,
  customMessage,
  expiresAt,
  sharedByName,
  logoUrl,
}: {
  recipientEmail: string;
  senderName: string;
  documentName: string;
  shareLink: string;
  customMessage?: string | null;
  expiresAt?: Date | null;
  sharedByName?: string | null;
  logoUrl?: string | null;
}) {
  const displayName = sharedByName || senderName;

  const { data, error } = await resend.emails.send({
    // ✅ Human-looking from — not "noreply"
    from: `${displayName} via DocMetrics <support@docmetrics.io>`,
    to: [recipientEmail],
    // ✅ Subject sounds like a person wrote it, not a system
    subject: `${documentName}`,
    html: buildShareEmailHtml({
      recipientEmail,
      displayName,
      documentName,
      shareLink,
      customMessage,
      expiresAt,
      logoUrl,
    }),
  });

  if (error) throw error;
  return { success: true, data };
}

// ─────────────────────────────────────────────────────────────────────────────
// Email HTML — clean, minimal, human. No gradients, no emoji, no heavy CSS.
// Looks like a real person sent it from their email client.
// ─────────────────────────────────────────────────────────────────────────────

function buildShareEmailHtml({
  recipientEmail,
  displayName,
  documentName,
  shareLink,
  customMessage,
  expiresAt,
  logoUrl,
}: {
  recipientEmail: string;
  displayName: string;
  documentName: string;
  shareLink: string;
  customMessage?: string | null;
  expiresAt?: Date | null;
  logoUrl?: string | null;
}) {
  const expiryLine = expiresAt
    ? `<p style="font-size:13px; color:#6b7280; margin:0 0 16px;">
        Note: This link expires on ${new Date(expiresAt).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}.
      </p>`
    : "";

  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${displayName}" style="max-height:36px; max-width:120px; display:block; margin-bottom:28px;" />`
    : "";

  const messageBlock = customMessage
    ? `<p style="font-size:15px; color:#374151; margin:0 0 20px; line-height:1.6;">${customMessage}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${documentName}</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <!-- Logo (only if provided) -->
          ${logoUrl ? `
          <tr>
            <td style="padding-bottom:28px;">
              ${logoBlock}
            </td>
          </tr>` : ""}

          <!-- Greeting -->
          <tr>
            <td>
              <p style="font-size:15px; color:#374151; margin:0 0 16px; line-height:1.6;">
                Hi,
              </p>
              <p style="font-size:15px; color:#374151; margin:0 0 20px; line-height:1.6;">
                ${displayName} shared a document with you.
              </p>

              <!-- Custom message if provided -->
              ${messageBlock}

              <!-- Document name — clean card, no emoji -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="border:1px solid #e5e7eb; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0; font-size:13px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; font-weight:500;">Document</p>
                    <p style="margin:6px 0 0; font-size:16px; color:#111827; font-weight:600; word-break:break-word;">${documentName}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA — plain button, not gradient -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-radius:6px; background:#111827;">
                    <a href="${shareLink}"
                      style="display:inline-block; padding:12px 28px; font-size:15px; font-weight:500; color:#ffffff; text-decoration:none; border-radius:6px; letter-spacing:0.01em;">
                      View Document
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry note -->
              ${expiryLine}

              <!-- Plain text link fallback -->
              <p style="font-size:13px; color:#9ca3af; margin:0 0 4px;">
                Or copy this link into your browser:
              </p>
              <p style="font-size:13px; color:#6b7280; word-break:break-all; margin:0 0 32px;">
                <a href="${shareLink}" style="color:#4f46e5; text-decoration:none;">${shareLink}</a>
              </p>

              <!-- Divider -->
              <hr style="border:none; border-top:1px solid #f3f4f6; margin:0 0 24px;" />

              <!-- Footer — minimal, no branding overload -->
              <p style="font-size:12px; color:#9ca3af; margin:0; line-height:1.6;">
                You received this because ${displayName} shared a document with you
                via <a href="https://docmetrics.io" style="color:#9ca3af; text-decoration:none;">DocMetrics</a>.
                If you weren't expecting this, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main sender — tries Gmail → Outlook → Resend in order.
// A failure at any step never crashes the share response.
// Each provider is fully isolated.
// ─────────────────────────────────────────────────────────────────────────────

export async function sendShareEmailViaGmailOrResend({
  userId,
  recipientEmail,
  senderName,
  documentName,
  shareLink,
  customMessage,
  expiresAt,
  sharedByName,
  logoUrl,
}: {
  userId: string;
  recipientEmail: string;
  senderName: string;
  documentName: string;
  shareLink: string;
  customMessage?: string | null;
  expiresAt?: Date | null;
  sharedByName?: string | null;
  logoUrl?: string | null;
}) {
  const displayName = sharedByName || senderName;
  const db = await dbPromise;
  const subject = documentName; // ✅ Clean subject — just the doc name
  const htmlBody = buildShareEmailHtml({
    recipientEmail,
    displayName,
    documentName,
    shareLink,
    customMessage,
    expiresAt,
    logoUrl,
  });

  console.log(`📧 [EMAIL] Sending to ${recipientEmail}...`);

  // ── STEP 1: Try Gmail ─────────────────────────────────────────────────────
  try {
    const gmailToken = await getValidGmailToken(userId);

    const gmailIntegration = await db.collection("integrations").findOne({
      userId,
      provider: "gmail",
      isActive: true,
    });

    const senderEmail = gmailIntegration?.metadata?.email || "me";
    const raw = buildGmailRaw({
      from: `${displayName} <${senderEmail}>`,
      to: recipientEmail,
      subject,
      htmlBody,
    });

    const gmailRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      }
    );

    if (!gmailRes.ok) {
      const err = await gmailRes.json();
      throw new Error(`Gmail API error: ${JSON.stringify(err)}`);
    }

    console.log(`✅ [EMAIL] Sent via Gmail to: ${recipientEmail}`);
    return { success: true, method: "gmail" };

  } catch (gmailError) {
    console.warn(
      `⚠️ [EMAIL] Gmail failed for ${recipientEmail}, trying Outlook...`,
      gmailError instanceof Error ? gmailError.message : gmailError
    );
  }

  // ── STEP 2: Try Outlook ───────────────────────────────────────────────────
  try {
    const outlookToken = await getValidOutlookToken(userId);

    const outlookIntegration = await db.collection("integrations").findOne({
      userId,
      provider: "outlook",
      isActive: true,
    });

    const outlookRes = await fetch(
      "https://graph.microsoft.com/v1.0/me/sendMail",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${outlookToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject,
            body: {
              contentType: "HTML",
              content: htmlBody,
            },
            toRecipients: [{ emailAddress: { address: recipientEmail } }],
            from: {
              emailAddress: {
                address: outlookIntegration?.metadata?.email,
                name: displayName,
              },
            },
          },
          saveToSentItems: true,
        }),
      }
    );

    // Graph API returns 202 with no body on success
    if (!outlookRes.ok) {
      const err = await outlookRes.json();
      throw new Error(`Outlook API error: ${JSON.stringify(err)}`);
    }

    console.log(`✅ [EMAIL] Sent via Outlook to: ${recipientEmail}`);
    return { success: true, method: "outlook" };

  } catch (outlookError) {
    console.warn(
      `⚠️ [EMAIL] Outlook failed for ${recipientEmail}, falling back to Resend...`,
      outlookError instanceof Error ? outlookError.message : outlookError
    );
  }

  // ── STEP 3: Fall back to Resend ───────────────────────────────────────────
  try {
    await sendShareLinkEmail({
      recipientEmail,
      senderName,
      documentName,
      shareLink,
      customMessage,
      expiresAt,
      sharedByName,
      logoUrl,
    });

    console.log(`✅ [EMAIL] Sent via Resend to: ${recipientEmail}`);
    return { success: true, method: "resend" };

  } catch (resendError) {
    // ✅ All three failed — throw so the share route can record the failure
    // in emailResults[], but the share link was already created and returned.
    const msg =
      resendError instanceof Error ? resendError.message : "Unknown error";
    console.error(
      `❌ [EMAIL] All providers failed for ${recipientEmail}: ${msg}`
    );
    throw new Error(`All email providers failed: ${msg}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gmail raw message builder
// ─────────────────────────────────────────────────────────────────────────────

function buildGmailRaw({
  from,
  to,
  subject,
  htmlBody,
}: {
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
}) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    htmlBody,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}