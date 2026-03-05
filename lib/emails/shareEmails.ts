// lib/emails/shareEmails.ts
import { Resend } from "resend";
import { dbPromise } from "@/app/api/lib/mongodb";
import { getValidGmailToken } from "@/lib/integrations/gmail";
import { getValidOutlookToken } from "@/lib/integrations/outlook";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendShareLinkEmail({
  recipientEmail,
  senderName,
  documentName,
  shareLink,
  customMessage,
  expiresAt,
  sharedByName, // ⭐ Custom branding
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
  const displayName = sharedByName || senderName; // ⭐ Use custom name if provided
  
  const { data, error } = await resend.emails.send({
    from: "DocMetrics <noreply@docmetrics.io>",
    to: [recipientEmail],
    subject: `${displayName} shared "${documentName}" with you`,
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

// ─── HTML Email Template ─────────────────────────────────────────────────────

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
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .message-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; border-radius: 4px; margin: 20px 0; font-style: italic; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .expiry-warning { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 20px 0; color: #dc2626; font-size: 14px; }
        .footer { background: #f8f9fa; padding: 25px; text-align: center; font-size: 13px; color: #6c757d; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
  ${logoUrl ? `
    <div style="margin-bottom:20px;">
      <img src="${logoUrl}" alt="${displayName}" style="max-width:150px; max-height:60px; display:block; margin:0 auto;" />
    </div>
  ` : `
    <h1 style="margin:0; font-size:28px;">📄 Document Shared</h1>
  `}
  <p style="margin:10px 0 0; opacity:0.9;">You have a new document to view</p>
</div>
        <div class="content">
          <p style="font-size:17px;">Hi there,</p>
          <p><strong>${displayName}</strong> has shared a document with you:</p>
          
          <div style="background:#f8f9fa; border-radius:8px; padding:20px; margin:20px 0; text-align:center;">
            <div style="font-size:40px; margin-bottom:10px;">📄</div>
            <div style="font-weight:700; font-size:18px; color:#1f2937;">${documentName}</div>
          </div>
          
          ${customMessage ? `
            <div class="message-box">
              <strong>Message from ${displayName}:</strong>
              <p style="margin:8px 0 0;">"${customMessage}"</p>
            </div>
          ` : ''}
          
          <div style="text-align:center;">
            <a href="${shareLink}" class="cta-button">View Document</a>
          </div>
          
          ${expiresAt ? `
            <div class="expiry-warning">
              ⚠️ <strong>Expires:</strong> ${new Date(expiresAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          ` : ''}
          
          <p style="font-size:13px; color:#6b7280; margin-top:20px;">
            Or copy this link:<br/>
            <a href="${shareLink}" style="color:#667eea; word-break:break-all;">${shareLink}</a>
          </p>
        </div>
        <div class="footer">
          <p>You received this because ${displayName} shared a document with you.</p>
          <p>© ${new Date().getFullYear()} DocMetrics. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── Send via Gmail or Resend ─────────────────────────────────────────────────



 

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
  const subject = `${displayName} shared "${documentName}" with you`;
  const htmlBody = buildShareEmailHtml({
    recipientEmail,
    displayName,
    documentName,
    shareLink,
    customMessage,
    expiresAt,
    logoUrl,
  });

  console.log('📧 [EMAIL] Starting email send process...');
  console.log('📧 [EMAIL] Recipient:', recipientEmail);

  // ── STEP 1: Try Gmail ──────────────────────────────────────────
  try {
    const gmailToken = await getValidGmailToken(userId);

    const gmailIntegration = await db.collection("integrations").findOne({
      userId,
      provider: "gmail",
      isActive: true,
    });

    const senderEmail = gmailIntegration?.metadata?.email || "me";
    const raw = buildGmailRaw({ from: senderEmail, to: recipientEmail, subject, htmlBody });

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
      throw new Error(`Gmail send failed: ${JSON.stringify(err)}`);
    }

    console.log(`✅ [EMAIL] Sent via Gmail to: ${recipientEmail}`);
    return { success: true, method: 'gmail' };

  } catch (gmailError) {
    console.log('⚠️ [EMAIL] Gmail failed, trying Outlook...', gmailError);
  }

  // ── STEP 2: Try Outlook ───────────────────────────────────────
  try {
    const outlookToken = await getValidOutlookToken(userId)

    const outlookIntegration = await db.collection("integrations").findOne({
      userId,
      provider: "outlook",
      isActive: true,
    })

    const recipientList = [{ emailAddress: { address: recipientEmail } }]

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
            toRecipients: recipientList,
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
    )

    // Graph API returns 202 with no body on success
    if (!outlookRes.ok) {
      const err = await outlookRes.json()
      throw new Error(`Outlook send failed: ${JSON.stringify(err)}`)
    }

    console.log(`✅ [EMAIL] Sent via Outlook to: ${recipientEmail}`)
    return { success: true, method: 'outlook' }

  } catch (outlookError) {
    console.log('⚠️ [EMAIL] Outlook failed, falling back to Resend...', outlookError)
  }

  // ── STEP 3: Fall back to Resend ───────────────────────────────
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
    })

    console.log(`✅ [EMAIL] Sent via Resend to: ${recipientEmail}`)
    return { success: true, method: 'resend' }

  } catch (resendError) {
    console.error(`❌ [EMAIL] All three methods failed for ${recipientEmail}`)
    throw new Error('Failed to send email via Gmail, Outlook, and Resend')
  }
}



// ─── Helper Functions ─────────────────────────────────────────────────────────

function buildGmailRaw({ from, to, subject, htmlBody }: {
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
}) {
  const raw = `From: ${from}\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/html; charset=utf-8\n\n${htmlBody}`;
  return Buffer.from(raw).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}