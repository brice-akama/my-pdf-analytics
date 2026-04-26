import { Resend } from 'resend';
import { sendEmail } from './email';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'DocMetrics <noreply@docmetrics.io>'
const NEWSLETTER_INBOX = 'hello@docmetrics.io';  
const SUPPORT_INBOX = 'support@docmetrics.io'
 
const CONTACT_INBOX = 'support@docmetrics.io';
function shell(content: string, previewText: string): string {
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
  .title { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .meta { font-size: 13px; color: #64748b; margin-bottom: 28px; }
  .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .table tr:last-child td { border-bottom: none; }
  .table .lbl { font-size: 12px; color: #94a3b8; font-weight: 500; width: 38%; }
  .table .val { font-size: 13px; color: #0f172a; font-weight: 600; }
  .msg { background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
  .cta { display: block; text-align: center; margin: 28px 0 4px; }
  .cta a { display: inline-block; padding: 12px 32px; background: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; }
  .fallback { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 12px; word-break: break-all; }
  .fallback a { color: #64748b; }
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
    <div class="body">${content}</div>
    <div class="foot">
      <p>
        This message was sent on behalf of ${'\u0020'}<strong>DocMetrics</strong>.<br>
        If you were not expecting this, you can safely ignore it.
      </p>
    </div>
  </div>
</div>
</body>
</html>`
}
 
// ════════════════════════════════════════════════════════════════
// sendSignatureRequestEmail
// Sent to the person who needs to sign.
// Subject is intentionally plain — avoids DocuSign phishing filters.
// ════════════════════════════════════════════════════════════════
 
export async function sendSignatureRequestEmail({
  recipientName,
  recipientEmail,
  originalFilename,
  signingLink,
  senderName,
  message,
  dueDate,
}: {
  recipientName: string
  recipientEmail: string
  originalFilename: string
  signingLink: string
  senderName: string
  message?: string
  dueDate?: string
}) {
  const dueDateFormatted = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null
 
  // Plain subject — avoids "signature request" phishing trigger
  const subject = `${senderName} shared a document for your review`
  const previewText = `${senderName} is requesting your signature on "${originalFilename}"`
 
  const messageBlock = message
    ? `<div class="msg">${message}</div>`
    : ''
 
  const dueDateRow = dueDateFormatted
    ? `<tr>
        <td class="lbl">Due by</td>
        <td class="val">${dueDateFormatted}</td>
      </tr>`
    : ''
 
  const content = `
    <p class="title">Document for your signature</p>
    <p class="meta">${senderName} is requesting your signature on the document below.</p>
 
    ${messageBlock}
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${originalFilename}</td>
      </tr>
      <tr>
        <td class="lbl">Requested by</td>
        <td class="val">${senderName}</td>
      </tr>
      <tr>
        <td class="lbl">Recipient</td>
        <td class="val">${recipientName}</td>
      </tr>
      ${dueDateRow}
    </table>
 
    <div class="cta"><a href="${signingLink}">Review and sign</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${signingLink}">${signingLink}</a>
    </p>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [recipientEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendSignatureRequestEmail error:', error)
    throw error
  }
 
  console.log('Signature request sent to:', recipientEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendDocumentSignedNotification
// Sent to the document owner each time a recipient signs.
// ════════════════════════════════════════════════════════════════
 
export async function sendDocumentSignedNotification({
  ownerEmail,
  ownerName,
  signerName,
  signerEmail,
  originalFilename,
  signedCount,
  totalRecipients,
}: {
  ownerEmail: string
  ownerName: string
  signerName: string
  signerEmail: string
  originalFilename: string
  signedCount: number
  totalRecipients: number
}) {
  const isComplete = signedCount === totalRecipients
  const progressPercent = Math.round((signedCount / totalRecipients) * 100)
  const signedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
 
  const subject = `${signerName} signed "${originalFilename}"`
  const previewText = `${signedCount} of ${totalRecipients} signature${totalRecipients !== 1 ? 's' : ''} collected`
 
  const content = `
    <p class="title">Signature received</p>
    <p class="meta">${signerName} has signed your document.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${originalFilename}</td>
      </tr>
      <tr>
        <td class="lbl">Signed by</td>
        <td class="val">${signerName}</td>
      </tr>
      <tr>
        <td class="lbl">Email</td>
        <td class="val">${signerEmail}</td>
      </tr>
      <tr>
        <td class="lbl">Signed at</td>
        <td class="val">${signedDate}</td>
      </tr>
    </table>
 
    <div class="bar-track">
      <div class="bar-fill" style="width:${progressPercent}%"></div>
    </div>
    <p class="progress-label">${signedCount} of ${totalRecipients} signature${totalRecipients !== 1 ? 's' : ''} collected</p>
 
    ${!isComplete
      ? `<div class="notice">You will receive another email once all parties have signed.</div>`
      : ''}
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [ownerEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendDocumentSignedNotification error:', error)
    throw error
  }
 
  console.log('Owner signed notification sent to:', ownerEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendSignerConfirmationEmail
// Sent to the signer after they complete signing.
// Attaches the signed PDF if available.
// ════════════════════════════════════════════════════════════════
 
export async function sendSignerConfirmationEmail({
  signerEmail,
  signerName,
  originalFilename,
  signedPdfUrl,
}: {
  signerEmail: string
  signerName: string
  originalFilename: string
  signedPdfUrl?: string
}) {
  let attachments: any[] = []
 
  if (signedPdfUrl) {
    try {
      const res = await fetch(signedPdfUrl)
      const buffer = await res.arrayBuffer()
      attachments = [{
        filename: originalFilename.replace(/\.pdf$/i, '') + '_signed.pdf',
        content: Buffer.from(buffer),
        contentType: 'application/pdf',
      }]
    } catch (err) {
      console.error('Failed to attach signed PDF:', err)
    }
  }
 
  const signedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
 
  const subject = `Your signed copy of "${originalFilename}"`
  const previewText = signedPdfUrl
    ? `Your signed copy of "${originalFilename}" is attached`
    : `Your signature on "${originalFilename}" has been recorded`
 
  const attachmentNote = signedPdfUrl
    ? `<div class="notice">Your signed copy with a certificate of completion and full audit trail is attached. Save it for your records.</div>`
    : `<div class="notice">Once all parties have signed, you will automatically receive the fully executed copy.</div>`
 
  const content = `
    <p class="title">Signature complete</p>
    <p class="meta">Your signature on "${originalFilename}" has been recorded.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${originalFilename}</td>
      </tr>
      <tr>
        <td class="lbl">Signed by</td>
        <td class="val">${signerName}</td>
      </tr>
      <tr>
        <td class="lbl">Signed at</td>
        <td class="val">${signedDate}</td>
      </tr>
    </table>
 
    ${attachmentNote}
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [signerEmail],
    subject,
    attachments,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendSignerConfirmationEmail error:', error)
    throw error
  }
 
  console.log('Signer confirmation sent to:', signerEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendAllSignaturesCompleteEmail
// Sent to all parties once every recipient has signed.
// ════════════════════════════════════════════════════════════════
 
export async function sendAllSignaturesCompleteEmail({
  recipientEmail,
  recipientName,
  originalFilename,
  downloadLink,
  allSigners,
}: {
  recipientEmail: string
  recipientName: string
  originalFilename: string
  downloadLink: string
  allSigners: { name: string; email: string; signedAt: Date }[]
}) {
  const completedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
 
  const subject = `All signatures collected — "${originalFilename}"`
  const previewText = `All parties have signed "${originalFilename}"`
 
  const signersHtml = allSigners.map(signer => `
    <div class="signer-row">
      <div class="signer-name">${signer.name}</div>
      <div class="signer-sub">
        ${signer.email} &middot;
        Signed ${new Date(signer.signedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  `).join('')
 
  const content = `
    <p class="title">Document complete</p>
    <p class="meta">All parties have signed "${originalFilename}".</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${originalFilename}</td>
      </tr>
      <tr>
        <td class="lbl">Completed</td>
        <td class="val">${completedDate}</td>
      </tr>
    </table>
 
    <p class="section-label">Signatories</p>
    <div class="signers">${signersHtml}</div>
 
    <div class="cta" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
  <a href="${downloadLink}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#ffffff!important;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
    Download signed PDF
  </a>
  <a href="${downloadLink.replace('/api/signature/', '/signed/').replace('/download', '')}" style="display:inline-block;padding:12px 24px;background:#ffffff;color:#0f172a!important;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;border:1px solid #e2e8f0;">
    View signed document
  </a>
</div>
<p class="fallback">
  Download: <a href="${downloadLink}">${downloadLink}</a>
</p>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [recipientEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendAllSignaturesCompleteEmail error:', error)
    throw error
  }
 
  console.log('All signatures complete email sent to:', recipientEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendSignatureReminderEmail
// Sent to a recipient who has not yet signed.
// ════════════════════════════════════════════════════════════════
 
export async function sendSignatureReminderEmail({
  recipientName,
  recipientEmail,
  originalFilename,
  signingLink,
  senderName,
  daysLeft,
}: {
  recipientName: string
  recipientEmail: string
  originalFilename: string
  signingLink: string
  senderName: string
  daysLeft?: number
}) {
  // Plain subject — "Reminder: Please sign" matches phishing patterns
  const subject = `${senderName} is waiting for your signature on "${originalFilename}"`
  const previewText = daysLeft
    ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining to sign`
    : `Your signature is pending on "${originalFilename}"`
 
  const dueDateRow = daysLeft
    ? `<tr>
        <td class="lbl">Due in</td>
        <td class="val">${daysLeft} day${daysLeft > 1 ? 's' : ''}</td>
      </tr>`
    : ''
 
  const content = `
    <p class="title">Signature pending</p>
    <p class="meta">${senderName} is waiting for your signature on the document below.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${originalFilename}</td>
      </tr>
      <tr>
        <td class="lbl">Requested by</td>
        <td class="val">${senderName}</td>
      </tr>
      ${dueDateRow}
    </table>
 
    <div class="cta"><a href="${signingLink}">Review and sign</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${signingLink}">${signingLink}</a>
    </p>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [recipientEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendSignatureReminderEmail error:', error)
    throw error
  }
 
  console.log('Signature reminder sent to:', recipientEmail)
  return { success: true }
}


// ===================================
// SIGNATURE REQUEST CANCELLED EMAIL
// =================================


export async function sendSignatureRequestCancelledEmail({
  recipientEmail,
  recipientName,
  originalFilename,
  ownerName,
  reason,
  wasVoided,
}: {
  recipientEmail: string
  recipientName: string
  originalFilename: string
  ownerName: string
  reason: string
  wasVoided: boolean
}) {
  const subject = `Signature request cancelled — "${originalFilename}"`
  const previewText = `${ownerName} has cancelled the signature request for "${originalFilename}"`
 
  const content = `
    <p class="title">Signature request cancelled</p>
    <p class="meta">${ownerName} has cancelled the signature request for the document below.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${originalFilename}</td>
      </tr>
      <tr>
        <td class="lbl">Cancelled by</td>
        <td class="val">${ownerName}</td>
      </tr>
      <tr>
        <td class="lbl">Reason</td>
        <td class="val">${reason || 'No reason provided'}</td>
      </tr>
    </table>
 
    <div class="notice">
      Your signing link is no longer valid. No further action is required.
      If you have questions, contact ${ownerName} directly.
    </div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [recipientEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendSignatureRequestCancelledEmail error:', error)
    throw error
  }
 
  console.log('Cancellation email sent to:', recipientEmail)
  return { success: true }
}

// ===================================
// CC NOTIFICATION EMAILS
// ===================================

/**
 * Sends an immediate CC notification when a document is sent for signature
 */
export async function sendCCNotificationEmail({
  ccName,
  ccEmail,
  documentName,
  senderName,
  viewLink,
}: {
  ccName: string
  ccEmail: string
  documentName: string
  senderName: string
  viewLink: string
}) {
  const subject = `${senderName} copied you on a document`
  const previewText = `You have been copied on "${documentName}" sent by ${senderName}`
 
  const content = `
    <p class="title">You have been copied</p>
    <p class="meta">${senderName} copied you on a signature request. No action is required from you.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${documentName}</td>
      </tr>
      <tr>
        <td class="lbl">Sent by</td>
        <td class="val">${senderName}</td>
      </tr>
      <tr>
        <td class="lbl">Your role</td>
        <td class="val">Copy only — no signature required</td>
      </tr>
    </table>
 
    <p style="font-size:13px;color:#475569;margin-bottom:24px;line-height:1.6;">
      You will receive the fully signed copy once all parties have signed.
    </p>
 
    <div class="cta"><a href="${viewLink}">View document</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${viewLink}">${viewLink}</a>
    </p>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [ccEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendCCNotificationEmail error:', error)
    throw error
  }
 
  console.log('CC notification sent to:', ccEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendCCCompletionEmail
// Sent to CC recipients when all signatures have been collected.
// ════════════════════════════════════════════════════════════════
 
export async function sendCCCompletionEmail({
  ccName,
  ccEmail,
  originalFilename,
  downloadLink,
  allSigners,
}: {
  ccName: string
  ccEmail: string
  originalFilename: string
  downloadLink: string
  allSigners: Array<{ name: string; email: string; signedAt: Date }>
}) {
  const subject = `All signatures collected — ${originalFilename}`
  const previewText = `The signing process for "${originalFilename}" is complete`
 
  const signersHtml = allSigners.map(signer => `
    <div class="signer-row">
      <div class="signer-name">${signer.name}</div>
      <div class="signer-sub">
        ${signer.email} &middot;
        Signed ${new Date(signer.signedAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  `).join('')
 
  const content = `
    <p class="title">Document complete</p>
    <p class="meta">All parties have signed "${originalFilename}".</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${originalFilename}</td>
      </tr>
      <tr>
        <td class="lbl">Completed</td>
        <td class="val">${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      </tr>
    </table>
 
    <p class="section-label">Signatories</p>
    <div class="signers">${signersHtml}</div>
 
    <div class="cta"><a href="${downloadLink}">Download signed document</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${downloadLink}">${downloadLink}</a>
    </p>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [ccEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendCCCompletionEmail error:', error)
    throw error
  }
 
  console.log('CC completion email sent to:', ccEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendSignatureDeclinedNotification
// Sent to the document owner when a recipient declines to sign.
// ════════════════════════════════════════════════════════════════
 
export async function sendSignatureDeclinedNotification({
  ownerEmail,
  ownerName,
  declinerName,
  declinerEmail,
  documentName,
  reason,
  statusLink,
}: {
  ownerEmail: string
  ownerName: string
  declinerName: string
  declinerEmail: string
  documentName: string
  reason: string
  statusLink: string
}) {
  const subject = `${declinerName} declined to sign "${documentName}"`
  const previewText = `${declinerName} has declined the signature request for "${documentName}"`
 
  const content = `
    <p class="title">Signature declined</p>
    <p class="meta">${declinerName} has declined to sign the document below.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${documentName}</td>
      </tr>
      <tr>
        <td class="lbl">Declined by</td>
        <td class="val">${declinerName}</td>
      </tr>
      <tr>
        <td class="lbl">Email</td>
        <td class="val">${declinerEmail}</td>
      </tr>
      <tr>
        <td class="lbl">Declined at</td>
        <td class="val">${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      </tr>
    </table>
 
    <p class="section-label">Reason provided</p>
    <div class="reason">${reason || 'No reason provided'}</div>
 
    <p class="section-label">What happens next</p>
    <table class="table" style="margin-bottom:28px;">
      <tr>
        <td style="font-size:13px;color:#475569;padding:6px 0;border-bottom:1px solid #f1f5f9;">
          This signature request has been cancelled.
        </td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#475569;padding:6px 0;border-bottom:1px solid #f1f5f9;">
          Other recipients have been notified.
        </td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#475569;padding:6px 0;">
          No further signatures can be collected on this request.
        </td>
      </tr>
    </table>
 
    <div class="cta"><a href="${statusLink}">View document status</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${statusLink}">${statusLink}</a>
    </p>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [ownerEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendSignatureDeclinedNotification error:', error)
    throw error
  }
 
  console.log('Decline notification sent to:', ownerEmail)
  return { success: true }
}
// ════════════════════════════════════════════════════════════════
// sendExpirationWarningEmail
// Sent to a signer when their signing link is about to expire.
// Subject is plain — avoids urgency-word spam triggers.
// ════════════════════════════════════════════════════════════════
 
export async function sendExpirationWarningEmail({
  recipientName,
  recipientEmail,
  originalFilename,
  signingLink,
  senderName,
  expiresAt,
  daysLeft,
}: {
  recipientName: string
  recipientEmail: string
  originalFilename: string
  signingLink: string
  senderName: string
  expiresAt: string
  daysLeft: number
}) {
  const expirationDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
 
  // Plain subject — "FINAL WARNING", "URGENT" and emoji are spam triggers
  const subject = daysLeft === 1
    ? `Your signing link for "${originalFilename}" expires tomorrow`
    : `Your signing link for "${originalFilename}" expires in ${daysLeft} days`
 
  const previewText = `The link sent by ${senderName} expires on ${expirationDate}`
 
  const content = `
    <p class="title">Signing link expiring soon</p>
    <p class="meta">${senderName} is waiting for your signature on the document below.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${originalFilename}</td>
      </tr>
      <tr>
        <td class="lbl">Requested by</td>
        <td class="val">${senderName}</td>
      </tr>
      <tr>
        <td class="lbl">Link expires</td>
        <td class="val">${expirationDate}</td>
      </tr>
      <tr>
        <td class="lbl">Days remaining</td>
        <td class="val">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</td>
      </tr>
    </table>
 
    <p style="font-size:13px;color:#475569;margin-bottom:28px;line-height:1.6;">
      After the expiration date, this link will no longer be valid. 
      If you miss the deadline, contact ${senderName} to request a new link.
    </p>
 
    <div class="cta"><a href="${signingLink}">Review and sign</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${signingLink}">${signingLink}</a>
    </p>
  `
 
  return sendEmail({
    to: recipientEmail,
    subject,
    html: shell(content, previewText),
  })
}
 
// ════════════════════════════════════════════════════════════════
// sendEnvelopeEmail
// Sent to a recipient when they have a multi-document signing package.
// ════════════════════════════════════════════════════════════════
 
export async function sendEnvelopeEmail({
  recipientName,
  recipientEmail,
  documentCount,
  documentNames,
  signingLink,
  senderName,
  message,
  dueDate,
}: {
  recipientName: string
  recipientEmail: string
  documentCount: number
  documentNames: string[]
  signingLink: string
  senderName: string
  message?: string
  dueDate?: string
}) {
  const dueDateFormatted = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null
 
  // Plain subject — emoji and "Require Your Signature" pattern matches phishing filters
  const subject = `${senderName} sent you ${documentCount} document${documentCount > 1 ? 's' : ''} to sign`
  const previewText = `${documentCount} document${documentCount > 1 ? 's' : ''} from ${senderName} require your signature`
 
  const messageBlock = message
    ? `<div class="msg">${message}<br><span style="font-size:12px;color:#94a3b8;margin-top:4px;display:block;">— ${senderName}</span></div>`
    : ''
 
  const dueDateRow = dueDateFormatted
    ? `<tr>
        <td class="lbl">Due by</td>
        <td class="val">${dueDateFormatted}</td>
      </tr>`
    : ''
 
  const docListHtml = documentNames.map((name, i) => `
    <div class="doc-row">
      <span class="doc-num">${i + 1}</span>
      <span class="doc-name">${name}</span>
    </div>
  `).join('')
 
  const content = `
    <p class="title">Documents for your signature</p>
    <p class="meta">${senderName} has sent you a signing package. You can review and sign all documents in one session.</p>
 
    ${messageBlock}
 
    <table class="table">
      <tr>
        <td class="lbl">Sent by</td>
        <td class="val">${senderName}</td>
      </tr>
      <tr>
        <td class="lbl">Documents</td>
        <td class="val">${documentCount}</td>
      </tr>
      ${dueDateRow}
    </table>
 
    <p class="section-label">Documents in this package</p>
    <div class="doc-list">${docListHtml}</div>
 
    <div class="cta"><a href="${signingLink}">Review and sign</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${signingLink}">${signingLink}</a>
    </p>
  `
 
  return sendEmail({
    to: recipientEmail,
    subject,
    html: shell(content, previewText),
  })
}
 
// ════════════════════════════════════════════════════════════════
// sendEnvelopeCompletedEmail
// Sent to the document owner when all recipients in an envelope
// have completed signing.
// ════════════════════════════════════════════════════════════════
 
export async function sendEnvelopeCompletedEmail({
  ownerEmail,
  recipients,
  documentCount,
}: {
  ownerEmail: string
  recipients: any[]
  documentCount: number
}) {
  const allCompleted = recipients.every(r => r.status === 'completed')
  if (!allCompleted) return
 
  const subject = `All ${documentCount} document${documentCount > 1 ? 's' : ''} signed`
  const previewText = `Your signing package is complete — all ${recipients.length} recipient${recipients.length > 1 ? 's' : ''} have signed`
 
  const signersHtml = recipients.map(r => `
    <div class="signer-row">
      <div class="signer-name">${r.name}</div>
      <div class="signer-sub">
        ${r.email}
        ${r.completedAt
          ? ` &middot; ${new Date(r.completedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : ''}
      </div>
    </div>
  `).join('')
 
  const content = `
    <p class="title">Signing package complete</p>
    <p class="meta">All recipients have signed. ${documentCount} document${documentCount > 1 ? 's' : ''} fully executed.</p>
 
    <div class="stats">
      <div class="stat">
        <span class="stat-n">${documentCount}</span>
        <span class="stat-l">Documents</span>
      </div>
      <div class="stat">
        <span class="stat-n">${recipients.length}</span>
        <span class="stat-l">Signers</span>
      </div>
    </div>
 
    <p class="section-label">Completed by</p>
    <div class="signers">${signersHtml}</div>
 
    <div class="cta">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard">View dashboard</a>
    </div>
  `
 
  return sendEmail({
    to: ownerEmail,
    subject,
    html: shell(content, previewText),
  })
}

// ════════════════════════════════════════════════════════════════
// sendEnvelopeReminderEmail
// Sent to a recipient who has not yet signed their package.
// ════════════════════════════════════════════════════════════════
 
export async function sendEnvelopeReminderEmail({
  recipientName,
  recipientEmail,
  documentCount,
  documentNames,
  signingLink,
  senderName,
  dueDate,
}: {
  recipientName: string
  recipientEmail: string
  documentCount: number
  documentNames: string[]
  signingLink: string
  senderName: string
  dueDate?: string
}) {
  const dueDateFormatted = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null
 
  const subject = `Reminder: ${documentCount} document${documentCount > 1 ? 's' : ''} from ${senderName} await your signature`
  const previewText = `${senderName} is waiting for your signature on ${documentCount} document${documentCount > 1 ? 's' : ''}`
 
  const dueDateRow = dueDateFormatted
    ? `<tr>
        <td class="lbl">Due by</td>
        <td class="val">${dueDateFormatted}</td>
      </tr>`
    : ''
 
  const docListHtml = documentNames.map((name, i) => `
    <div class="doc-row">
      <span class="doc-num">${i + 1}</span>
      <span class="doc-name">${name}</span>
    </div>
  `).join('')
 
  const content = `
    <p class="title">Signature reminder</p>
    <p class="meta">${senderName} is waiting for your signature on the documents below.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Sent by</td>
        <td class="val">${senderName}</td>
      </tr>
      <tr>
        <td class="lbl">Documents</td>
        <td class="val">${documentCount}</td>
      </tr>
      ${dueDateRow}
    </table>
 
    <p class="section-label">Pending documents</p>
    <div class="doc-list">${docListHtml}</div>
 
    <div class="cta"><a href="${signingLink}">Review and sign</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${signingLink}">${signingLink}</a>
    </p>
  `
 
  return sendEmail({
    to: recipientEmail,
    subject,
    html: shell(content, previewText),
  })
}
 
// ════════════════════════════════════════════════════════════════
// sendEnvelopeProgressEmail
// Sent to a recipient after they sign one document in a package,
// showing how many remain.
// ════════════════════════════════════════════════════════════════
 
export async function sendEnvelopeProgressEmail({
  recipientName,
  recipientEmail,
  completedCount,
  totalCount,
  remainingDocuments,
  signingLink,
}: {
  recipientName: string
  recipientEmail: string
  completedCount: number
  totalCount: number
  remainingDocuments: string[]
  signingLink: string
}) {
  const progressPercent = Math.round((completedCount / totalCount) * 100)
 
  const subject = `${completedCount} of ${totalCount} documents signed — ${remainingDocuments.length} remaining`
  const previewText = `${remainingDocuments.length} document${remainingDocuments.length !== 1 ? 's' : ''} still need your signature`
 
  const remainingHtml = remainingDocuments.map((name, i) => `
    <div class="doc-row">
      <span class="doc-num">${i + 1}</span>
      <span class="doc-name">${name}</span>
    </div>
  `).join('')
 
  const content = `
    <p class="title">Signing in progress</p>
    <p class="meta">${completedCount} of ${totalCount} documents signed. ${remainingDocuments.length} still need your signature.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Signed</td>
        <td class="val">${completedCount} of ${totalCount}</td>
      </tr>
      <tr>
        <td class="lbl">Remaining</td>
        <td class="val">${remainingDocuments.length}</td>
      </tr>
    </table>
 
    <div class="bar-track">
      <div class="bar-fill" style="width:${progressPercent}%"></div>
    </div>
    <p class="progress-label">${progressPercent}% complete</p>
 
    <p class="section-label" style="margin-top:20px;">Still to sign</p>
    <div class="doc-list">${remainingHtml}</div>
 
    <div class="cta"><a href="${signingLink}">Continue signing</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${signingLink}">${signingLink}</a>
    </p>
  `
 
  return sendEmail({
    to: recipientEmail,
    subject,
    html: shell(content, previewText),
  })
}
 
// ════════════════════════════════════════════════════════════════
// sendSpaceInvitation
// Sent when an owner invites someone to a space.
// ════════════════════════════════════════════════════════════════
 
export async function sendSpaceInvitation({
  toEmail,
  spaceName,
  inviterName,
  role,
  inviteToken,
}: {
  toEmail: string
  spaceName: string
  inviterName: string
  role: string
  inviteToken: string
}) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
 
  const subject = `${inviterName} invited you to "${spaceName}"`
  const previewText = `You have been invited to access the "${spaceName}" data room`
 
  const content = `
    <p class="title">You have been invited</p>
    <p class="meta">${inviterName} has invited you to access a data room on DocMetrics.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Data room</td>
        <td class="val">${spaceName}</td>
      </tr>
      <tr>
        <td class="lbl">Invited by</td>
        <td class="val">${inviterName}</td>
      </tr>
      <tr>
        <td class="lbl">Your role</td>
        <td class="val">${roleLabel}</td>
      </tr>
    </table>
 
    <div class="cta"><a href="${inviteUrl}">Accept invitation</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${inviteUrl}">${inviteUrl}</a>
    </p>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendSpaceInvitation error:', error)
    throw error
  }
 
  console.log('Space invitation sent to:', toEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendMemberRoleChangedEmail
// Sent when a member's role in a space is updated.
// ════════════════════════════════════════════════════════════════
 
export async function sendMemberRoleChangedEmail({
  toEmail,
  spaceName,
  oldRole,
  newRole,
  changedBy,
}: {
  toEmail: string
  spaceName: string
  oldRole: string
  newRole: string
  changedBy: string
}) {
  const subject = `Your role in "${spaceName}" has been updated`
  const previewText = `${changedBy} changed your role from ${oldRole} to ${newRole}`
 
  const content = `
    <p class="title">Role updated</p>
    <p class="meta">Your permissions in "${spaceName}" have changed.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Data room</td>
        <td class="val">${spaceName}</td>
      </tr>
      <tr>
        <td class="lbl">Previous role</td>
        <td class="val">${oldRole}</td>
      </tr>
      <tr>
        <td class="lbl">New role</td>
        <td class="val">${newRole}</td>
      </tr>
      <tr>
        <td class="lbl">Updated by</td>
        <td class="val">${changedBy}</td>
      </tr>
    </table>
 
    <div class="cta">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/spaces">View spaces</a>
    </div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [toEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendMemberRoleChangedEmail error:', error)
    throw error
  }
 
  console.log('Role change email sent to:', toEmail)
  return { success: true }
}
// ════════════════════════════════════════════════════════════════
// sendMemberRemovedEmail
// Sent when a member's access to a space is revoked.
// ════════════════════════════════════════════════════════════════
 
export async function sendMemberRemovedEmail({
  toEmail,
  spaceName,
  removedBy,
}: {
  toEmail: string
  spaceName: string
  removedBy: string
}) {
  const subject = `Your access to "${spaceName}" has been removed`
  const previewText = `${removedBy} has removed your access to "${spaceName}"`
 
  const content = `
    <p class="title">Access removed</p>
    <p class="meta">Your access to the data room below has been revoked.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Data room</td>
        <td class="val">${spaceName}</td>
      </tr>
      <tr>
        <td class="lbl">Removed by</td>
        <td class="val">${removedBy}</td>
      </tr>
    </table>
 
    <p style="font-size:13px;color:#475569;line-height:1.6;">
      You no longer have access to documents in this space.
      If you believe this was done in error, contact ${removedBy} directly.
    </p>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [toEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendMemberRemovedEmail error:', error)
    throw error
  }
 
  console.log('Removal email sent to:', toEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendWelcomeEmail
// Sent when a new user creates an account.
// ════════════════════════════════════════════════════════════════
 
export async function sendWelcomeEmail({
  recipientName,
  recipientEmail,
}: {
  recipientName: string
  recipientEmail: string
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://docmetrics.io'}/dashboard`
 
  const subject = 'Welcome to DocMetrics'
  const previewText = 'Your account is ready. Here is how to get started.'
 
  const content = `
    <p class="title">Welcome, ${recipientName}</p>
    <p class="meta">Your DocMetrics account is ready. Here is a quick overview of what you can do.</p>
 
    <p class="section-label">What DocMetrics does</p>
    <div class="feature-list">
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
    </div>
 
    <p class="section-label">Getting started</p>
    <div class="steps">
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
    </div>
 
    <div class="cta"><a href="${dashboardUrl}">Go to dashboard</a></div>
 
    <p style="font-size:13px;color:#475569;margin-top:24px;line-height:1.6;">
      Questions? Reply to this email or reach us at
      <a href="mailto:support@docmetrics.io" style="color:#0f172a;font-weight:600;">support@docmetrics.io</a>
    </p>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [recipientEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendWelcomeEmail error:', error)
    throw error
  }
 
  console.log('Welcome email sent to:', recipientEmail)
  return { success: true }
}

// ════════════════════════════════════════════════════════════════
// sendPasswordResetEmail
// Sent to a user who requested a password reset.
// ════════════════════════════════════════════════════════════════
 
export async function sendPasswordResetEmail({
  recipientName,
  recipientEmail,
  resetCode,
}: {
  recipientName: string
  recipientEmail: string
  resetCode: string
}) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://docmetrics.io'}/reset-password/verify`
 
  const subject = 'Your DocMetrics password reset code'
  const previewText = 'Use the code in this email to reset your password. It expires in 15 minutes.'
 
  const content = `
    <p class="title">Password reset</p>
    <p class="meta">
      We received a request to reset the password for your account.
      Use the code below to continue. If you did not request this, you can ignore this email.
    </p>
 
    <div class="code-box">
      <span class="code">${resetCode}</span>
      <span class="code-expiry">Expires in 15 minutes</span>
    </div>
 
    <p class="section-label">How to reset your password</p>
    <div class="steps">
      <div class="step-row">
        <span class="step-num">1</span>
        <span class="step-text">Click the button below or visit the reset page.</span>
      </div>
      <div class="step-row">
        <span class="step-num">2</span>
        <span class="step-text">Enter your email address.</span>
      </div>
      <div class="step-row">
        <span class="step-num">3</span>
        <span class="step-text">Enter the code shown above.</span>
      </div>
      <div class="step-row">
        <span class="step-num">4</span>
        <span class="step-text">Create your new password.</span>
      </div>
    </div>
 
    <div class="cta"><a href="${resetUrl}">Reset password</a></div>
 
    <div class="notice" style="margin-top:24px;">
      Do not share this code with anyone. DocMetrics will never ask for your reset code.
      If you did not request a password reset, contact
      <a href="mailto:${SUPPORT_INBOX}" style="color:#0f172a;font-weight:600;">${SUPPORT_INBOX}</a>
    </div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [recipientEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendPasswordResetEmail error:', error)
    throw error
  }
 
  console.log('Password reset email sent to:', recipientEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendSupportRequestEmail
// Internal email landing in support@docmetrics.io when a user
// submits a support request.
// ════════════════════════════════════════════════════════════════
 
export async function sendSupportRequestEmail({
  userName,
  userEmail,
  subject,
  message,
  userCompany,
}: {
  userName: string
  userEmail: string
  subject: string
  message: string
  userCompany?: string
}) {
  const previewText = `Support request from ${userName}${userCompany ? ` at ${userCompany}` : ''}`
 
  const content = `
    <p class="title">Support request</p>
    <p class="meta">${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
 
    <table class="table">
      <tr>
        <td class="lbl">From</td>
        <td class="val">${userName}</td>
      </tr>
      <tr>
        <td class="lbl">Email</td>
        <td class="val"><a href="mailto:${userEmail}" style="color:#0f172a;">${userEmail}</a></td>
      </tr>
      ${userCompany ? `<tr>
        <td class="lbl">Company</td>
        <td class="val">${userCompany}</td>
      </tr>` : ''}
      <tr>
        <td class="lbl">Subject</td>
        <td class="val">${subject}</td>
      </tr>
    </table>
 
    <p class="section-label">Message</p>
    <div class="message-body">${message}</div>
 
    <div class="cta"><a href="mailto:${userEmail}?subject=Re: ${subject}">Reply to ${userName}</a></div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [SUPPORT_INBOX],
    replyTo: userEmail,
    subject: `Support: ${subject} — ${userName}`,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendSupportRequestEmail error:', error)
    throw error
  }
 
  console.log('Support email sent')
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendDemoBookingEmail
// Internal email landing in support@docmetrics.io when someone
// requests a demo.
// ════════════════════════════════════════════════════════════════
 
export async function sendDemoBookingEmail({
  userName,
  userEmail,
  userCompany,
  phoneNumber,
  teamSize,
  preferredDate,
  message,
}: {
  userName: string
  userEmail: string
  userCompany?: string
  phoneNumber?: string
  teamSize?: string
  preferredDate?: string
  message?: string
}) {
  const previewText = `Demo request from ${userName}${userCompany ? ` at ${userCompany}` : ''}`
 
  const optionalRows = [
    userCompany   && `<tr><td class="lbl">Company</td><td class="val">${userCompany}</td></tr>`,
    phoneNumber   && `<tr><td class="lbl">Phone</td><td class="val">${phoneNumber}</td></tr>`,
    teamSize      && `<tr><td class="lbl">Team size</td><td class="val">${teamSize}</td></tr>`,
    preferredDate && `<tr><td class="lbl">Preferred time</td><td class="val">${preferredDate}</td></tr>`,
  ].filter(Boolean).join('')
 
  const messageBlock = message
    ? `<p class="section-label">Notes</p>
       <div class="message-body">${message}</div>`
    : ''
 
  const content = `
    <p class="title">Demo request</p>
    <p class="meta">${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Name</td>
        <td class="val">${userName}</td>
      </tr>
      <tr>
        <td class="lbl">Email</td>
        <td class="val"><a href="mailto:${userEmail}" style="color:#0f172a;">${userEmail}</a></td>
      </tr>
      ${optionalRows}
    </table>
 
    ${messageBlock}
 
    <div class="cta"><a href="mailto:${userEmail}">Reply to ${userName}</a></div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [SUPPORT_INBOX],
    replyTo: userEmail,
    subject: `Demo request: ${userName}${userCompany ? ` — ${userCompany}` : ''}`,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendDemoBookingEmail error:', error)
    throw error
  }
 
  console.log('Demo booking email sent')
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendFeedbackEmail
// Internal email landing in support@docmetrics.io when a user
// submits product feedback.
// ════════════════════════════════════════════════════════════════
 
export async function sendFeedbackEmail({
  userEmail,
  feedback,
}: {
  userEmail: string
  feedback: string
}) {
  const previewText = `Feedback from ${userEmail}`
 
  const content = `
    <p class="title">User feedback</p>
    <p class="meta">${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
 
    <table class="table">
      <tr>
        <td class="lbl">From</td>
        <td class="val"><a href="mailto:${userEmail}" style="color:#0f172a;">${userEmail}</a></td>
      </tr>
    </table>
 
    <p class="section-label">Feedback</p>
    <div class="message-body">${feedback}</div>
 
    <div class="cta"><a href="mailto:${userEmail}">Reply to ${userEmail}</a></div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [SUPPORT_INBOX],
    replyTo: userEmail,
    subject: `Feedback from ${userEmail}`,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendFeedbackEmail error:', error)
    throw error
  }
 
  console.log('Feedback email sent')
  return { success: true }
}

// ════════════════════════════════════════════════════════════════
// sendCCBulkSummaryEmail
// Sent to CC recipients when a bulk send goes out.
// ════════════════════════════════════════════════════════════════
 
export async function sendCCBulkSummaryEmail({
  ccName,
  ccEmail,
  senderName,
  documentName,
  batchId,
  recipients,
  origin,
}: {
  ccName: string
  ccEmail: string
  senderName: string
  documentName: string
  batchId: string
  recipients: Array<{ name: string; email: string; signingLink: string; ccViewLink: string }>
  origin: string
}) {
  const subject = `Bulk send summary — ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''} sent "${documentName}"`
  const previewText = `${senderName} sent "${documentName}" to ${recipients.length} recipients. You were copied.`
 
  const recipientRows = recipients.map((r, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td>${r.name}</td>
      <td>${r.email}</td>
      <td class="link"><a href="${r.ccViewLink}">View</a></td>
    </tr>
  `).join('')
 
  const content = `
    <p class="title">Bulk send summary</p>
    <p class="meta">You were copied on a bulk send by ${senderName}. No action is required.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${documentName}</td>
      </tr>
      <tr>
        <td class="lbl">Sent by</td>
        <td class="val">${senderName}</td>
      </tr>
      <tr>
        <td class="lbl">Recipients</td>
        <td class="val">${recipients.length}</td>
      </tr>
      <tr>
        <td class="lbl">Sent on</td>
        <td class="val">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      </tr>
    </table>
 
    <p class="section-label">Recipients</p>
    <table class="recipients">
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Email</th>
          <th>Document</th>
        </tr>
      </thead>
      <tbody>${recipientRows}</tbody>
    </table>
 
    <div class="notice">
      You will receive a separate notification when each recipient signs.
      You are view-only on these documents.
    </div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [ccEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendCCBulkSummaryEmail error:', error)
    throw error
  }
 
  console.log('CC bulk summary sent to:', ccEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendCCSignatureUpdateEmail
// Sent to CC recipients each time one recipient signs.
// ════════════════════════════════════════════════════════════════
 
export async function sendCCSignatureUpdateEmail({
  ccName,
  ccEmail,
  signerName,
  signerEmail,
  documentName,
  totalSigned,
  totalRecipients,
  ccViewLink,
}: {
  ccName: string
  ccEmail: string
  signerName: string
  signerEmail: string
  documentName: string
  totalSigned: number
  totalRecipients: number
  ccViewLink: string
}) {
  const allDone = totalSigned === totalRecipients
  const progressPercent = Math.round((totalSigned / totalRecipients) * 100)
 
  const subject = `${signerName} signed "${documentName}" — ${totalSigned}/${totalRecipients}`
  const previewText = allDone
    ? `All signatures collected on "${documentName}"`
    : `${totalRecipients - totalSigned} signature${totalRecipients - totalSigned !== 1 ? 's' : ''} remaining on "${documentName}"`
 
  const content = `
    <p class="title">Signature received</p>
    <p class="meta">${signerName} has signed "${documentName}".</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${documentName}</td>
      </tr>
      <tr>
        <td class="lbl">Signed by</td>
        <td class="val">${signerName}</td>
      </tr>
      <tr>
        <td class="lbl">Email</td>
        <td class="val">${signerEmail}</td>
      </tr>
      <tr>
        <td class="lbl">Progress</td>
        <td class="val">${totalSigned} of ${totalRecipients} signed</td>
      </tr>
    </table>
 
    <div class="bar-track">
      <div class="bar-fill" style="width:${progressPercent}%"></div>
    </div>
    <p class="progress-label">
      ${allDone
        ? 'All signatures collected.'
        : `${totalRecipients - totalSigned} signature${totalRecipients - totalSigned !== 1 ? 's' : ''} remaining.`}
    </p>
 
    <div class="cta"><a href="${ccViewLink}">View document</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${ccViewLink}">${ccViewLink}</a>
    </p>
 
    <div class="notice" style="margin-top:20px;">
      You are receiving this because you were copied on this document. No action is required.
    </div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [ccEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendCCSignatureUpdateEmail error:', error)
    throw error
  }
 
  console.log('CC signature update sent to:', ccEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendSpaceViewNotification
// Sent to the space owner when a visitor accesses their data room.
// ════════════════════════════════════════════════════════════════
 
export async function sendSpaceViewNotification({
  ownerEmail,
  spaceName,
  visitorEmail,
  spaceId,
}: {
  ownerEmail: string
  spaceName: string
  visitorEmail: string
  spaceId: string
}) {
  const spaceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/spaces/${spaceId}`
 
  const subject = `${visitorEmail} viewed "${spaceName}"`
  const previewText = `${visitorEmail} accessed your data room`
 
  const content = `
    <p class="title">Data room viewed</p>
    <p class="meta">${visitorEmail} accessed your data room.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Data room</td>
        <td class="val">${spaceName}</td>
      </tr>
      <tr>
        <td class="lbl">Visitor</td>
        <td class="val">${visitorEmail}</td>
      </tr>
      <tr>
        <td class="lbl">Time</td>
        <td class="val">${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      </tr>
    </table>
 
    <div class="cta"><a href="${spaceUrl}">View data room</a></div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [ownerEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendSpaceViewNotification error:', error)
    throw error
  }
 
  console.log('Space view notification sent to:', ownerEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendNdaSignedNotification
// Sent to the space owner when a visitor signs the NDA.
// ════════════════════════════════════════════════════════════════
 
export async function sendNdaSignedNotification({
  ownerEmail,
  spaceName,
  signerEmail,
  signerName,
  spaceId,
  signedAt,
}: {
  ownerEmail: string
  spaceName: string
  signerEmail: string
  signerName?: string
  spaceId: string
  signedAt: Date
}) {
  const spaceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/spaces/${spaceId}`
  const displayName = signerName ? `${signerName} (${signerEmail})` : signerEmail
 
  const subject = `NDA signed — ${signerEmail} can now access "${spaceName}"`
  const previewText = `${displayName} signed the NDA for "${spaceName}"`
 
  const content = `
    <p class="title">NDA signed</p>
    <p class="meta">${displayName} has signed the NDA and now has access to the data room.</p>
 
    <table class="table">
      <tr>
        <td class="lbl">Signer</td>
        <td class="val">${displayName}</td>
      </tr>
      <tr>
        <td class="lbl">Data room</td>
        <td class="val">${spaceName}</td>
      </tr>
      <tr>
        <td class="lbl">Signed at</td>
        <td class="val">${signedAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
      </tr>
    </table>
 
    <div class="notice">
      The signer's email, timestamp, and IP address have been recorded.
    </div>
 
    <div class="cta"><a href="${spaceUrl}">View data room</a></div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [ownerEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendNdaSignedNotification error:', error)
    throw error
  }
 
  console.log('NDA signed notification sent to:', ownerEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendSpaceInviteEmail
// Sent when an owner invites someone to a data room with a role.
// ════════════════════════════════════════════════════════════════
 
export async function sendSpaceInviteEmail({
  recipientEmail,
  senderName,
  spaceName,
  role,
  inviteLink,
  message,
}: {
  recipientEmail: string
  senderName: string
  spaceName: string
  role: 'viewer' | 'editor' | 'admin'
  inviteLink: string
  message?: string
}) {
  const roleLabel = role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : 'Viewer'
  const roleDesc = role === 'admin'
    ? 'Full access to manage this data room.'
    : role === 'editor'
    ? 'Can upload, edit, and manage documents.'
    : 'Can view and download documents.'
 
  const subject = `${senderName} invited you to "${spaceName}"`
  const previewText = `You have been invited to access the "${spaceName}" data room`
 
  const messageBlock = message
    ? `<div class="msg">${message}</div>`
    : ''
 
  const content = `
    <p class="title">You have been invited</p>
    <p class="meta">${senderName} has invited you to access a data room on DocMetrics.</p>
 
    ${messageBlock}
 
    <table class="table">
      <tr>
        <td class="lbl">Data room</td>
        <td class="val">${spaceName}</td>
      </tr>
      <tr>
        <td class="lbl">Invited by</td>
        <td class="val">${senderName}</td>
      </tr>
      <tr>
        <td class="lbl">Your role</td>
        <td class="val">${roleLabel} — ${roleDesc}</td>
      </tr>
    </table>
 
    <div class="cta"><a href="${inviteLink}">Accept invitation</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${inviteLink}">${inviteLink}</a>
    </p>
 
    <div class="notice" style="margin-top:20px;">
      This link is personal to you. Do not share it with others.
    </div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [recipientEmail],
    subject,
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendSpaceInviteEmail error:', error)
    throw error
  }
 
  console.log('Space invite sent to:', recipientEmail)
  return { success: true }
}
 
// ════════════════════════════════════════════════════════════════
// sendCertificateEmail
// Sent with the signed certificate PDF attached.
// ════════════════════════════════════════════════════════════════
 
export async function sendCertificateEmail({
  recipientEmail,
  recipientName,
  signerName,
  signerEmail,
  originalFilename,
  signedAt,
  certificatePdfBuffer,
}: {
  recipientEmail: string
  recipientName: string
  signerName: string
  signerEmail: string
  originalFilename: string
  signedAt: Date
  certificatePdfBuffer: Buffer
}) {
  const signedDateFormatted = new Date(signedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
 
  const subject = `Certificate of completion — "${originalFilename}"`
  const previewText = `${signerName} signed "${originalFilename}" on ${signedDateFormatted}. Certificate attached.`
 
  const content = `
    <p class="title">Certificate of completion</p>
    <p class="meta">
      ${signerName} signed "${originalFilename}" on ${signedDateFormatted}.
      The certificate of completion is attached to this email as a PDF.
    </p>
 
    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${originalFilename}</td>
      </tr>
      <tr>
        <td class="lbl">Signed by</td>
        <td class="val">${signerName}</td>
      </tr>
      <tr>
        <td class="lbl">Email</td>
        <td class="val">${signerEmail}</td>
      </tr>
      <tr>
        <td class="lbl">Date signed</td>
        <td class="val">${signedDateFormatted}</td>
      </tr>
    </table>
 
    <div class="notice">
      The attached certificate includes the full audit trail, IP address, timestamps,
      and document fingerprint.
    </div>
  `
 
  const { error } = await resend.emails.send({
    from: FROM,
    to: [recipientEmail],
    subject,
    attachments: [
      {
        filename: `Certificate_${originalFilename.replace('.pdf', '')}_${signerName.replace(/\s+/g, '_')}.pdf`,
        content: certificatePdfBuffer,
      },
    ],
    html: shell(content, previewText),
  })
 
  if (error) {
    console.error('sendCertificateEmail error:', error)
    return { success: false, error }
  }
 
  console.log('Certificate email sent to:', recipientEmail)
  return { success: true }
}

// ── CONTACT FORM EMAIL ─────────────────────────────────────────
export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const previewText = `Contact form message from ${name}`
 
  const content = `
    <p class="title">Contact form submission</p>
    <p class="meta">${new Date().toUTCString()}</p>
 
    <table class="table">
      <tr>
        <td class="lbl">From</td>
        <td class="val">${name}</td>
      </tr>
      <tr>
        <td class="lbl">Email</td>
        <td class="val"><a href="mailto:${email}" style="color:#0f172a;">${email}</a></td>
      </tr>
      <tr>
        <td class="lbl">Subject</td>
        <td class="val">${subject}</td>
      </tr>
    </table>
 
    <p class="section-label">Message</p>
    <div class="message-body">${message}</div>
 
    <div class="cta">
      <a href="mailto:${email}?subject=Re: ${subject}">Reply to ${name}</a>
    </div>
  `
 
  await resend.emails.send({
    from: FROM,
    to: CONTACT_INBOX,
    replyTo: email,
    subject: `[Contact] ${subject} — ${name}`,
    html: shell(content, previewText),
  })
}

// ===================================
// SEND NEWSLETTER EMAIL
// ===================================



// ── NEWSLETTER: Email sent to the SUBSCRIBER ─────────────────
export async function sendNewsletterWelcomeEmail({
  email,
}: {
  email: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: email,                    // goes to the subscriber
    subject: "Welcome to DocMetrics Insights",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                  max-width: 560px; margin: 0 auto; color: #1e293b;">

        <!-- Header -->
        <div style="padding: 48px 0 32px;">
          <p style="margin: 0; font-size: 20px; font-weight: 700; 
                    letter-spacing: -0.5px; color: #0284c7;">
            DocMetrics
          </p>
        </div>

        <!-- Body -->
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; 
                    padding: 40px; background: #ffffff;">
          
          <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; 
                     color: #0f172a; line-height: 1.3;">
            You are on the list.
          </h1>

          <p style="margin: 0 0 16px; font-size: 15px; color: #475569; 
                    line-height: 1.7;">
            Thank you for subscribing to DocMetrics Insights. You will receive 
            practical guides on document sharing, analytics, and closing deals — 
            delivered straight to your inbox.
          </p>

          <p style="margin: 0 0 32px; font-size: 15px; color: #475569; 
                    line-height: 1.7;">
            Here is what to expect from us:
          </p>

          <!-- List -->
          <div style="margin-bottom: 32px;">
            ${[
              "Practical guides on document analytics",
              "Tips for closing deals faster",
              "Product updates and new features",
              "Industry insights on document sharing",
            ].map(item => `
              <div style="display: flex; align-items: flex-start; 
                          gap: 12px; margin-bottom: 12px;">
                <div style="width: 6px; height: 6px; border-radius: 50%; 
                            background: #0284c7; margin-top: 8px; 
                            flex-shrink: 0;"></div>
                <p style="margin: 0; font-size: 14px; color: #475569; 
                          line-height: 1.6;">${item}</p>
              </div>
            `).join("")}
          </div>

          <!-- CTA -->
          <div style="background: #f0f9ff; border-radius: 8px; 
                      padding: 24px; margin-bottom: 32px; text-align: center;">
            <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
              Ready to see what DocMetrics can do for your team?
            </p>
            <a href="https://docmetrics.io/signup"
               style="display: inline-block; background: #0284c7; color: #ffffff;
                      font-size: 14px; font-weight: 600; padding: 12px 28px;
                      border-radius: 8px; text-decoration: none;">
              Start for free
            </a>
          </div>

          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.7;">
            If you have any questions, reply to this email or reach us at 
            <a href="mailto:support@docmetrics.io" 
               style="color: #0284c7; text-decoration: none;">
              support@docmetrics.io
            </a>
          </p>

        </div>

        <!-- Footer -->
        <div style="padding: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8;">
            You are receiving this because you subscribed at docmetrics.io
          </p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            © ${new Date().getFullYear()} DocMetrics · 
            <a href="mailto:support@docmetrics.io?subject=Unsubscribe" 
               style="color: #94a3b8;">
              Unsubscribe
            </a>
          </p>
        </div>

      </div>
    `,
  });
}

// ── NEWSLETTER: Notification sent to YOU (the company) ────────
export async function sendNewsletterNotificationEmail({
  email,
}: {
  email: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: NEWSLETTER_INBOX,         // lands in your hello@ inbox
    subject: `New subscriber — ${email}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; 
                  margin: 0 auto; color: #1e293b;">
        <div style="background: #0284c7; padding: 20px 28px; 
                    border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: #ffffff; font-size: 16px; 
                     font-weight: 600;">
            New Newsletter Subscriber
          </h1>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; 
                    border-radius: 0 0 8px 8px; padding: 24px 28px;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #94a3b8; 
                    font-weight: 600; text-transform: uppercase; 
                    letter-spacing: 0.05em;">
            Subscriber Email
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; font-weight: 500; 
                    color: #0284c7;">
            ${email}
          </p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            Subscribed on ${new Date().toUTCString()}
          </p>
        </div>
      </div>
    `,
  });
}


// ════════════════════════════════════════════════════════════════
// sendCCOpenedNotificationEmail
// Sent to the document owner the FIRST TIME a CC recipient opens
// the document. Not sent on subsequent opens — only the first.
//
// Triggered by: app/api/cc/[uniqueId]/track/route.ts
// Condition:    event === 'opened' && isFirstOpen === true
//
// Matches the same pattern as sendDocumentSignedNotification —
// owner gets one email per notable CC activity event.
// ════════════════════════════════════════════════════════════════

export async function sendCCOpenedNotificationEmail({
  ownerEmail,
  ownerName,
  ccName,
  ccEmail,
  documentName,
  device,
  analyticsLink,
}: {
  ownerEmail: string
  ownerName: string
  ccName: string
  ccEmail: string
  documentName: string
  device?: string | null
  analyticsLink: string
}) {
  const openedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const subject = `${ccName || ccEmail} viewed "${documentName}"`
  const previewText = `Your CC recipient ${ccName || ccEmail} just opened the document`

  const deviceRow = device
    ? `<tr>
        <td class="lbl">Device</td>
        <td class="val">${device.charAt(0).toUpperCase() + device.slice(1)}</td>
      </tr>`
    : ''

  const content = `
    <p class="title">CC recipient viewed your document</p>
    <p class="meta">${ccName || ccEmail} opened "${documentName}" for the first time.</p>

    <table class="table">
      <tr>
        <td class="lbl">Document</td>
        <td class="val">${documentName}</td>
      </tr>
      <tr>
        <td class="lbl">Viewed by</td>
        <td class="val">${ccName || ccEmail}</td>
      </tr>
      <tr>
        <td class="lbl">Email</td>
        <td class="val">${ccEmail}</td>
      </tr>
      <tr>
        <td class="lbl">Opened at</td>
        <td class="val">${openedAt}</td>
      </tr>
      ${deviceRow}
      <tr>
        <td class="lbl">Role</td>
        <td class="val">CC recipient — view only</td>
      </tr>
    </table>

    <div class="cta"><a href="${analyticsLink}">View CC analytics</a></div>
    <p class="fallback">
      If the button does not work, copy this link into your browser:<br>
      <a href="${analyticsLink}">${analyticsLink}</a>
    </p>
  `

  const { error } = await resend.emails.send({
    from: FROM,
    to: [ownerEmail],
    subject,
    html: shell(content, previewText),
  })

  if (error) {
    console.error('sendCCOpenedNotificationEmail error:', error)
    throw error
  }

  console.log('CC opened notification sent to:', ownerEmail)
  return { success: true }
}