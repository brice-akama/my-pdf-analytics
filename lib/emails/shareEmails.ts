// lib/emails/shareEmails.ts
import { Resend } from "resend"
import { dbPromise } from "@/app/api/lib/mongodb"
import { getValidGmailToken } from "@/lib/integrations/gmail"
import { getValidOutlookToken } from "@/lib/integrations/outlook"

const resend = new Resend(process.env.RESEND_API_KEY)

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ShareEmailParams {
  recipientEmail: string
  senderName: string
  documentName: string
  shareLink: string
  senderEmail: string
  customMessage?: string | null
  expiresAt?: Date | null
  sharedByName?: string | null
  logoUrl?: string | null
}

interface SendResult {
  success: boolean
  method: "gmail" | "outlook" | "resend"
}

// ─────────────────────────────────────────────────────────────────────────────
// Email HTML
// ─────────────────────────────────────────────────────────────────────────────

function buildShareEmailHtml({
  displayName,
  documentName,
  shareLink,
  customMessage,
  expiresAt,
  logoUrl,
}: {
  displayName: string
  documentName: string
  shareLink: string
  customMessage?: string | null
  expiresAt?: Date | null
  logoUrl?: string | null
}): string {
  const expiryLine = expiresAt
    ? `<p style="font-size:13px;color:#6b7280;margin:0 0 16px;">
        This link expires on ${new Date(expiresAt).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}.
      </p>`
    : ""

  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${displayName}" style="max-height:36px;max-width:120px;display:block;margin-bottom:28px;" />`
    : ""

  const messageBlock = customMessage
    ? `<p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.6;">${customMessage}</p>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${documentName}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          ${logoUrl ? `<tr><td style="padding-bottom:28px;">${logoBlock}</td></tr>` : ""}

          <tr>
            <td>
              <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.6;">Hi,</p>

              <p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.6;">
                ${displayName} shared a document with you.
              </p>

              ${messageBlock}

              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;font-weight:500;">Document</p>
                    <p style="margin:6px 0 0;font-size:16px;color:#111827;font-weight:600;word-break:break-word;">${documentName}</p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-radius:6px;background:#111827;">
                    <a href="${shareLink}"
                      style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:6px;">
                      View Document
                    </a>
                  </td>
                </tr>
              </table>

              ${expiryLine}

              <p style="font-size:13px;color:#9ca3af;margin:0 0 4px;">
                Or copy this link into your browser:
              </p>
              <p style="font-size:13px;color:#6b7280;word-break:break-all;margin:0 0 32px;">
                <a href="${shareLink}" style="color:#4f46e5;text-decoration:none;">${shareLink}</a>
              </p>

              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 24px;" />

              <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
                You received this because ${displayName} shared a document with you
                via <a href="https://docmetrics.io" style="color:#9ca3af;text-decoration:none;">DocMetrics</a>.
                If you were not expecting this, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Resend fallback sender
// ─────────────────────────────────────────────────────────────────────────────

async function sendViaResend(
  params: ShareEmailParams & { displayName: string }
): Promise<void> {
  const {
    recipientEmail,
    senderEmail,
    displayName,
    documentName,
    shareLink,
    customMessage,
    expiresAt,
    logoUrl,
  } = params

  const { error } = await resend.emails.send({
    // FIX: single space between display name and angle bracket (was double space)
    from: `${displayName} <noreply@docmetrics.io>`,
    replyTo: senderEmail,
    to: [recipientEmail],
    // FIX: subject reworded away from "X shared a document" phishing pattern
    subject: `"${documentName}" — shared by ${displayName}`,
    headers: {
      "X-Entity-Ref-ID": `${Date.now()}-${recipientEmail}`,
      "List-Unsubscribe": "<mailto:unsubscribe@docmetrics.io?subject=unsubscribe>",
    },
    html: buildShareEmailHtml({
      displayName,
      documentName,
      shareLink,
      customMessage,
      expiresAt,
      logoUrl,
    }),
  })

  if (error) throw new Error(error.message)
}

// ─────────────────────────────────────────────────────────────────────────────
// Gmail raw message builder
// ─────────────────────────────────────────────────────────────────────────────

function buildGmailRaw({
  from,
  replyTo,
  to,
  subject,
  htmlBody,
}: {
  from: string
  replyTo?: string
  to: string
  subject: string
  htmlBody: string
}): string {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
  ]

  if (replyTo) {
    headers.push(`Reply-To: ${replyTo}`)
  }

  const message = [...headers, ``, htmlBody].join("\r\n")

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

// ─────────────────────────────────────────────────────────────────────────────
// Main sender — Gmail -> Outlook -> Resend
// ─────────────────────────────────────────────────────────────────────────────

export async function sendShareEmailViaGmailOrResend({
  userId,
  recipientEmail,
  senderEmail,
  senderName,
  documentName,
  shareLink,
  customMessage,
  expiresAt,
  sharedByName,
  logoUrl,
}: ShareEmailParams & { userId: string }): Promise<SendResult> {
  const displayName = sharedByName || senderName
  const db = await dbPromise
  // FIX: subject reworded away from "X shared a document" phishing pattern
  const subject = `"${documentName}" — shared by ${displayName}`
  const htmlBody = buildShareEmailHtml({
    displayName,
    documentName,
    shareLink,
    customMessage,
    expiresAt,
    logoUrl,
  })

  // ── Gmail ─────────────────────────────────────────────────────────────────
  try {
    const gmailToken = await getValidGmailToken(userId)

    const gmailIntegration = await db.collection("integrations").findOne({
      userId,
      provider: "gmail",
      isActive: true,
    })

    // FIX: renamed from senderEmail to gmailSenderEmail — was shadowing the outer param
    // which caused Resend fallback to receive "me" as the senderEmail
    const gmailSenderEmail = gmailIntegration?.metadata?.email || senderEmail

    const raw = buildGmailRaw({
      // FIX: From now uses the actual authenticated Gmail address
      // Mismatched display name vs sending address was the #1 spam trigger
      from: `${displayName} <${gmailSenderEmail}>`,
      // FIX: replyTo was never passed before even though buildGmailRaw supported it
      replyTo: gmailSenderEmail,
      to: recipientEmail,
      subject,
      htmlBody,
    })

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
    )

    if (!gmailRes.ok) {
      const err = await gmailRes.json()
      throw new Error(`Gmail API error: ${JSON.stringify(err)}`)
    }

    return { success: true, method: "gmail" }
  } catch {
    // Gmail failed — try Outlook
  }

  // ── Outlook ───────────────────────────────────────────────────────────────
  try {
    const outlookToken = await getValidOutlookToken(userId)

    const outlookIntegration = await db.collection("integrations").findOne({
      userId,
      provider: "outlook",
      isActive: true,
    })

    // FIX: renamed to outlookSenderEmail to be explicit and avoid shadowing
    const outlookSenderEmail = outlookIntegration?.metadata?.email || senderEmail

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
                // FIX: uses resolved outlookSenderEmail instead of raw
                // outlookIntegration?.metadata?.email which could be undefined
                address: outlookSenderEmail,
                name: displayName,
              },
            },
          },
          saveToSentItems: true,
        }),
      }
    )

    if (!outlookRes.ok) {
      const err = await outlookRes.json()
      throw new Error(`Outlook API error: ${JSON.stringify(err)}`)
    }

    return { success: true, method: "outlook" }
  } catch {
    // Outlook failed — fall back to Resend
  }

  // ── Resend fallback ───────────────────────────────────────────────────────
  try {
    await sendViaResend({
      recipientEmail,
      senderName,
      documentName,
      // FIX: senderEmail correctly refers to the outer param now (no longer shadowed)
      senderEmail,
      shareLink,
      customMessage,
      expiresAt,
      sharedByName,
      logoUrl,
      displayName,
    })

    return { success: true, method: "resend" }
  } catch (resendError) {
    const msg =
      resendError instanceof Error ? resendError.message : "Unknown error"
    throw new Error(`All email providers failed: ${msg}`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct Resend sender — used when no userId is available
// ─────────────────────────────────────────────────────────────────────────────

export async function sendShareLinkEmail(
  params: ShareEmailParams
): Promise<{ success: boolean }> {
  const displayName = params.sharedByName || params.senderName
  await sendViaResend({ ...params, displayName })
  return { success: true }
}