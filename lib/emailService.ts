import { Resend } from 'resend';
import { sendEmail } from './email';

const resend = new Resend(process.env.RESEND_API_KEY);

// ===================================
// SIGNATURE REQUEST EMAIL
// ===================================
export async function sendSignatureRequestEmail({
  recipientName,
  recipientEmail,
  originalFilename,
  signingLink,
  senderName,
  message,
  dueDate,
}: {
  recipientName: string;
  recipientEmail: string;
  originalFilename: string;
  signingLink: string;
  senderName: string;
  message?: string;
  dueDate?: string;
}) {
  try {
    const dueDateFormatted = dueDate
      ? new Date(dueDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;

    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>', // ⚠️ Change this to your verified domain
      to: [recipientEmail],
      subject: `${senderName} has requested your signature on "${originalFilename}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
            }
            .message-box {
              background: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .document-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .document-name {
              font-weight: 600;
              font-size: 16px;
              color: #667eea;
              margin-bottom: 10px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              text-align: center;
            }
            .cta-button:hover {
              opacity: 0.9;
            }
            .deadline {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px 20px;
              border-radius: 4px;
              margin: 20px 0;
              color: #856404;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
            .security-note {
              margin-top: 20px;
              padding: 15px;
              background: #e7f3ff;
              border-radius: 4px;
              font-size: 13px;
              color: #004085;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Signature Request</h1>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${recipientName},</p>
              
              <p>
                <strong>${senderName}</strong> has requested your signature on the following document:
              </p>
              
              <div class="document-info">
                <div class="document-name">📄 ${originalFilename}</div>
                <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">
                  Click the button below to review and sign this document
                </p>
              </div>
              
              ${
                message
                  ? `
              <div class="message-box">
                <strong>Message from ${senderName}:</strong>
                <p style="margin: 10px 0 0 0;">${message}</p>
              </div>
              `
                  : ''
              }
              
              ${
                dueDateFormatted
                  ? `
              <div class="deadline">
                ⏰ <strong>Due Date:</strong> Please sign by ${dueDateFormatted}
              </div>
              `
                  : ''
              }
              
              <center>
                <a href="${signingLink}" class="cta-button">
                  Review & Sign Document
                </a>
              </center>
              
              <div class="security-note">
                🔒 <strong>Secure Signing:</strong> This link is unique to you and expires after signing. 
                Your signature will be legally binding and timestamped.
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
                If you have any questions about this document, please contact ${senderName} directly.
              </p>
            </div>
            
            <div class="footer">
              <p>
                This is an automated message from DocuShare.<br>
                If you didn't expect this email, you can safely ignore it.
              </p>
              <p style="margin-top: 15px; font-size: 12px;">
                © ${new Date().getFullYear()} DocuShare. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send signature request email:', error);
      throw error;
    }

    console.log('✅ Signature request email sent to:', recipientEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}

// ===================================
// DOCUMENT SIGNED NOTIFICATION
// ===================================
export async function sendDocumentSignedNotification({
  ownerEmail,
  ownerName,
  signerName,
  signerEmail,
  originalFilename,
  statusLink,
}: {
  ownerEmail: string;
  ownerName: string;
  signerName: string;
  signerEmail: string;
  originalFilename: string;
  statusLink: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
    from: 'DocMetrics <noreply@docmetrics.io>',
      to: [ownerEmail],
      subject: `✅ ${signerName} signed "${originalFilename}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .checkmark {
              font-size: 60px;
              margin-bottom: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .signature-info {
              background: #f0fdf4;
              border-left: 4px solid #10b981;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="checkmark">✅</div>
              <h1 style="margin: 0; font-size: 28px;">Document Signed!</h1>
            </div>
            
            <div class="content">
              <p>Hi ${ownerName},</p>
              
              <p>Good news! <strong>${signerName}</strong> has just signed your document.</p>
              
              <div class="signature-info">
                <div style="margin-bottom: 15px;">
                  <strong>📄 Document:</strong> ${originalFilename}
                </div>
                <div style="margin-bottom: 15px;">
                  <strong>✍️ Signed by:</strong> ${signerName} (${signerEmail})
                </div>
                <div>
                  <strong>⏰ Signed at:</strong> ${new Date().toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              
              <center>
                <a href="${statusLink}" class="cta-button">
                  View Signature Status
                </a>
              </center>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
                You'll receive another notification once all recipients have signed.
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} DocuShare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send signed notification:', error);
      throw error;
    }

    console.log('✅ Signed notification sent to:', ownerEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}

// ===================================
// ALL SIGNATURES COMPLETE EMAIL
// ===================================
export async function sendAllSignaturesCompleteEmail({
  recipientEmail,
  recipientName,
  originalFilename,
  downloadLink,
  allSigners,
}: {
  recipientEmail: string;
  recipientName: string;
   originalFilename: string;
  downloadLink: string;
  allSigners: { name: string; email: string; signedAt: Date }[];
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [recipientEmail],
      subject: `🎉 All signatures collected for "${originalFilename}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .celebration {
              font-size: 60px;
              margin-bottom: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .complete-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .signers-list {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .signer-item {
              padding: 10px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .signer-item:last-child {
              border-bottom: none;
            }
            .download-button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="celebration">🎉</div>
              <h1 style="margin: 0; font-size: 28px;">Document Fully Signed!</h1>
            </div>
            
            <div class="content">
              <p>Hi ${recipientName},</p>
              
              <p>
                Congratulations! All parties have signed <strong>"${originalFilename}"</strong>. 
                The document is now legally binding and complete.
              </p>
              
              <div class="complete-box">
                <strong>✅ Status:</strong> All signatures collected<br>
                <strong>📄 Document:</strong> ${originalFilename}<br>
                <strong>⏰ Completed:</strong> ${new Date().toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              
              <div class="signers-list">
                <strong>Signatures collected from:</strong>
                ${allSigners
                  .map(
                    (signer) => `
                  <div class="signer-item">
                    <div style="font-weight: 600; color: #10b981;">✓ ${signer.name}</div>
                    <div style="font-size: 13px; color: #6c757d;">
                      ${signer.email} • 
                      Signed ${new Date(signer.signedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
              
             <center>
  <a href="${downloadLink}" class="download-button">
    📥 View & Download Signed Document
  </a>
</center>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
                Keep this signed document for your records. All signatures are timestamped and legally binding.
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} DocuShare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send completion email:', error);
      throw error;
    }

    console.log('✅ Completion email sent to:', recipientEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}

// ===================================
// REMINDER EMAIL (if not signed yet)
// ===================================
export async function sendSignatureReminderEmail({
  recipientName,
  recipientEmail,
   originalFilename,
  signingLink,
  senderName,
  daysLeft,
}: {
  recipientName: string;
  recipientEmail: string;
   originalFilename: string;
  signingLink: string;
  senderName: string;
  daysLeft?: number;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [recipientEmail],
      subject: `⏰ Reminder: Please sign "${originalFilename}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .content {
              padding: 40px 30px;
            }
            .reminder-box {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">⏰ Signature Reminder</h1>
            </div>
            
            <div class="content">
              <p>Hi ${recipientName},</p>
              
              <p>
                This is a friendly reminder that <strong>${senderName}</strong> is waiting for your signature on:
              </p>
              
              <div class="reminder-box">
                <strong>📄 Document:</strong> ${originalFilename}
                ${daysLeft ? `<br><strong>⏰ Due in:</strong> ${daysLeft} day${daysLeft > 1 ? 's' : ''}` : ''}
              </div>
              
              <p>Please take a moment to review and sign the document.</p>
              
              <center>
                <a href="${signingLink}" class="cta-button">
                  Sign Now
                </a>
              </center>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
                If you have any questions, please contact ${senderName} directly.
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} DocuShare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send reminder email:', error);
      throw error;
    }

    console.log('✅ Reminder email sent to:', recipientEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}
// ===================================
// SIGNATURE REQUEST CANCELLED EMAIL
// ===================================


export async function sendSignatureRequestCancelledEmail({
  recipientEmail,
  recipientName,
  originalFilename,
  ownerName,
  reason,
  wasVoided,
}: {
  recipientEmail: string;
  recipientName: string;
  originalFilename: string;
  ownerName: string;
  reason: string;
  wasVoided: boolean;
}) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">❌ Signature Request Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>

            <div class="alert-box">
              <p style="margin: 0; font-weight: bold;">The signature request for "${originalFilename}" has been cancelled by ${ownerName}.</p>
            </div>

            <p><strong>Reason:</strong> ${reason}</p>

            <p>You no longer need to take any action on this document. The signing link you received is no longer valid.</p>

            <p>If you have questions, please contact ${ownerName} directly.</p>

            <div class="footer">
              <p>This is an automated email from our signature service.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
     from: 'DocMetrics <noreply@docmetrics.io>',
      to: [recipientEmail],
      subject: `Signature Request Cancelled - ${originalFilename}`,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Failed to send cancellation email:', error);
      throw error;
    }

    console.log('✅ Cancellation email sent to:', recipientEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
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
  ccName: string;
  ccEmail: string;
  documentName: string;
  senderName: string;
  viewLink: string;
}) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .info-box { background: #e0e7ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 30px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; padding: 20px; background: #f8f9fa; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">📋 Document Copy (CC)</h1>
        </div>
        <div class="content">
          <p>Hi ${ccName},</p>
          <p>You've been copied on a signature request for:</p>

          <div class="info-box">
            <p style="margin: 0; font-weight: bold;">${documentName}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #475569;">Sent by ${senderName}</p>
          </div>

          <p><strong>Note:</strong> You are receiving a copy for your records. You are not required to sign this document.</p>

          <p>The document is currently being signed by the required parties. You'll receive the final signed version once complete.</p>

          <a href="${viewLink}" class="button">View Document</a>

          <div class="footer">
            <p>This is an informational email. No action is required from you.</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} DocuShare. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
     from: 'DocMetrics <noreply@docmetrics.io>',
      to: [ccEmail],
      subject: `CC: ${documentName} - Signature Request`,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Failed to send CC notification email:', error);
      throw error;
    }

    console.log('✅ CC notification email sent to:', ccEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}

/**
 * Sends a completion notification to CC recipients when all signatures are collected
 */
export async function sendCCCompletionEmail({
  ccName,
  ccEmail,
  originalFilename,
  downloadLink,
  allSigners,
}: {
  ccName: string;
  ccEmail: string;
  originalFilename: string;
  downloadLink: string;
  allSigners: Array<{ name: string; email: string; signedAt: Date }>;
}) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .signers-list { background: white; border: 1px solid #e5e7eb; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .signer-item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .signer-item:last-child { border-bottom: none; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; padding: 20px; background: #f8f9fa; border-top: 1px solid #e9ecef; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">✅ Document Fully Signed</h1>
        </div>
        <div class="content">
          <p>Hi ${ccName},</p>

          <div class="success-box">
            <p style="margin: 0; font-weight: bold; color: #065f46;">All Signatures Collected!</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #047857;">${originalFilename}</p>
          </div>

          <p>The following parties have signed the document:</p>

          <div class="signers-list">
            ${allSigners
              .map(
                (signer) => `
                <div class="signer-item">
                  <strong>${signer.name}</strong><br/>
                  <span style="font-size: 13px; color: #6b7280;">${signer.email}</span><br/>
                  <span style="font-size: 12px; color: #9ca3af;">Signed: ${new Date(
                    signer.signedAt
                  ).toLocaleString()}</span>
                </div>
              `
              )
              .join("")}
          </div>

          <p>Download the final signed document:</p>

          <a href="${downloadLink}" class="button">Download Signed Document</a>

          <div class="footer">
            <p>You received this email because you were CC'd on this signature request.</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} DocuShare. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [ccEmail],
      subject: `✅ Completed: ${originalFilename}`,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Failed to send CC completion email:', error);
      throw error;
    }

    console.log('✅ CC completion email sent to:', ccEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}


// ===================================
// SIGNATURE DECLINED NOTIFICATION
// ===================================

export async function sendSignatureDeclinedNotification({
  ownerEmail,
  ownerName,
  declinerName,
  declinerEmail,
  documentName,
  reason,
  statusLink,
}: {
  ownerEmail: string;
  ownerName: string;
  declinerName: string;
  declinerEmail: string;
  documentName: string;
  reason: string;
  statusLink: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [ownerEmail],
      subject: `🚫 ${declinerName} declined to sign "${documentName}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .icon {
              font-size: 60px;
              margin-bottom: 10px;
            }
            .content {
              padding: 40px 30px;
            }
            .decline-info {
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .reason-box {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 6px;
              margin: 15px 0;
              font-style: italic;
              color: #4b5563;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
            .next-steps {
              background: #eff6ff;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🚫</div>
              <h1 style="margin: 0; font-size: 28px;">Signature Declined</h1>
            </div>
            
            <div class="content">
              <p>Hi ${ownerName},</p>
              
              <p>
                <strong>${declinerName}</strong> has declined to sign the following document:
              </p>
              
              <div class="decline-info">
                <div style="margin-bottom: 15px;">
                  <strong>📄 Document:</strong> ${documentName}
                </div>
                <div style="margin-bottom: 15px;">
                  <strong>🚫 Declined by:</strong> ${declinerName} (${declinerEmail})
                </div>
                <div>
                  <strong>⏰ Declined at:</strong> ${new Date().toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div>
                <strong>Reason provided:</strong>
                <div class="reason-box">
                  "${reason}"
                </div>
              </div>
              
              <div class="next-steps">
                <strong>📌 What happens next:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This signature request has been cancelled</li>
                  <li>Other recipients have been notified</li>
                  <li>No further signatures can be collected</li>
                  <li>You may want to contact ${declinerName} to discuss their concerns</li>
                </ul>
              </div>
              
              <center>
                <a href="${statusLink}" class="cta-button">
                  View Document Status
                </a>
              </center>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
                If you need to proceed with this document, you may create a new signature request after addressing the concerns raised.
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} DocuShare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send decline notification:', error);
      throw error;
    }

    console.log('✅ Decline notification sent to:', ownerEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}

// ===================================
// EXPIRATION WARNING EMAIL
// ===================================

export async function sendExpirationWarningEmail({
  recipientName,
  recipientEmail,
  originalFilename,
  signingLink,
  senderName,
  expiresAt,
  daysLeft,
}: {
  recipientName: string;
  recipientEmail: string;
  originalFilename: string;
  signingLink: string;
  senderName: string;
  expiresAt: string;
  daysLeft: number;
}) {
  const urgencyColor = daysLeft === 1 ? '#dc2626' : daysLeft === 2 ? '#ea580c' : '#f59e0b';
  const urgencyBg = daysLeft === 1 ? '#fef2f2' : daysLeft === 2 ? '#fff7ed' : '#fffbeb';
  const urgencyEmoji = daysLeft === 1 ? '🚨' : daysLeft === 2 ? '⚠️' : '⏰';
  const urgencyText = daysLeft === 1 ? 'FINAL WARNING' : daysLeft === 2 ? 'URGENT' : 'REMINDER';

  const expirationDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return sendEmail({
    to: recipientEmail,
    subject: `${urgencyEmoji} ${urgencyText}: Signing Link Expires in ${daysLeft} Day${daysLeft > 1 ? 's' : ''}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid ${urgencyColor}; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${urgencyEmoji} ${urgencyText}</h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            Your signing link expires in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hi <strong>${recipientName}</strong>,
          </p>

          <div style="background: ${urgencyBg}; border: 2px solid ${urgencyColor}; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${urgencyColor}; text-align: center;">
              ⏰ Time is running out!
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151; text-align: center;">
              Your signing link for <strong>${originalFilename}</strong> will expire on:
            </p>
            <p style="margin: 10px 0 0 0; font-size: 16px; font-weight: bold; color: ${urgencyColor}; text-align: center;">
              ${expirationDate}
            </p>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin: 20px 0;">
            This document was sent by <strong>${senderName}</strong>. After the expiration date, this link will no longer work and you won't be able to sign.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signingLink}" 
               style="display: inline-block; background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
              ${urgencyEmoji} Sign Now - Don't Wait!
            </a>
          </div>

          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 20px;">
            If the button doesn't work, copy and paste this link:<br/>
            <span style="color: #6b7280; word-break: break-all;">${signingLink}</span>
          </p>

          ${daysLeft === 1 ? `
          <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 6px; padding: 15px; margin-top: 25px; text-align: center;">
            <p style="font-size: 14px; color: #991b1b; margin: 0; font-weight: bold;">
              🚨 LAST CHANCE: This is your final reminder. Sign within 24 hours or this link will expire forever!
            </p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            This is an automated expiration warning. Please sign the document before ${expirationDate}.
          </p>
        </div>
      </div>
    `,
  });
}

// ============================================
// ENVELOPE EMAIL TEMPLATES
// ============================================

/**
 * Send initial envelope notification to recipient
 */
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
  recipientName: string;
  recipientEmail: string;
  documentCount: number;
  documentNames: string[];
  signingLink: string;
  senderName: string;
  message?: string;
  dueDate?: string;
}) {
  const dueDateText = dueDate
    ? `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>⏰ Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>`
    : '';

  const messageText = message
    ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #374151; font-style: italic;">
          "${message}"
        </p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
          - ${senderName}
        </p>
      </div>`
    : '';

  return sendEmail({
    to: recipientEmail,
    subject: `📦 Signing Package: ${documentCount} Document${documentCount > 1 ? 's' : ''} Require Your Signature`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 30px; text-align: center;">
          <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Signing Package Ready</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
            ${documentCount} document${documentCount > 1 ? 's' : ''} • One signing session
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hi <strong>${recipientName}</strong>,
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
            <strong>${senderName}</strong> has sent you a signing package containing <strong>${documentCount} document${documentCount > 1 ? 's' : ''}</strong>. You can review and sign all documents in one convenient session.
          </p>

          ${messageText}

          <!-- Document List -->
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
              📄 Documents in this package:
            </h3>
            <div style="space-y: 10px;">
              ${documentNames.map((name, index) => `
                <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #7c3aed;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: #ede9fe; color: #7c3aed; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">
                      ${index + 1}
                    </span>
                    <span style="font-size: 14px; color: #111827; font-weight: 500;">
                      ${name}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          ${dueDateText}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signingLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);">
              📝 Review & Sign Package
            </a>
          </div>

          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 20px;">
            If the button doesn't work, copy and paste this link:<br/>
            <span style="color: #6b7280; word-break: break-all; font-size: 11px;">${signingLink}</span>
          </p>

          <!-- Info Boxes -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 15px; margin-top: 25px;">
            <p style="font-size: 13px; color: #1e40af; margin: 0;">
              <strong>✨ What's a signing package?</strong><br/>
              Instead of signing ${documentCount} separate documents, you'll sign them all in one streamlined session. It's faster and easier!
            </p>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; margin-top: 15px;">
            <p style="font-size: 13px; color: #166534; margin: 0;">
              <strong>🔒 Secure & Legal:</strong><br/>
              Your signatures are encrypted and legally binding. A complete audit trail is maintained for all documents.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            This signing package was sent by ${senderName}
          </p>
          <p style="font-size: 11px; color: #d1d5db; margin: 10px 0 0 0;">
            Powered by DocSend E-Signature
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Send envelope completion notification
 */
export async function sendEnvelopeCompletedEmail({
  ownerEmail,
  recipients,
  documentCount,
}: {
  ownerEmail: string;
  recipients: any[];
  documentCount: number;
}) {
  const allCompleted = recipients.every(r => r.status === 'completed');

  if (!allCompleted) {
    return; // Don't send until all recipients complete
  }

  return sendEmail({
    to: ownerEmail,
    subject: `✅ Envelope Completed - All ${documentCount} Documents Signed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
          <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Envelope Completed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
            All signatures collected
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Great news! Your signing package has been completed by all recipients.
          </p>

          <!-- Stats Box -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #059669; margin-bottom: 5px;">
                  ${documentCount}
                </div>
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                  Documents
                </div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #059669; margin-bottom: 5px;">
                  ${recipients.length}
                </div>
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                  Signers
                </div>
              </div>
            </div>
          </div>

          <!-- Recipients List -->
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
              ✓ Completed by:
            </h3>
            ${recipients.map((r, index) => `
              <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
                <div style="background: #d1fae5; color: #065f46; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: #111827; font-size: 14px;">${r.name}</div>
                  <div style="font-size: 12px; color: #6b7280;">${r.email}</div>
                </div>
                <div style="font-size: 11px; color: #6b7280;">
                  ${r.completedAt ? new Date(r.completedAt).toLocaleString() : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/SignatureDashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              📊 View Dashboard
            </a>
          </div>

          <!-- Info Box -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 15px; margin-top: 25px;">
            <p style="font-size: 13px; color: #1e40af; margin: 0;">
              <strong>📥 What's Next?</strong><br/>
              • Signed PDFs are available for download<br/>
              • Complete audit trail has been generated<br/>
              • All parties have received their copies
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Powered by DocSend E-Signature
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Send reminder for incomplete envelope
 */
export async function sendEnvelopeReminderEmail({
  recipientName,
  recipientEmail,
  documentCount,
  documentNames,
  signingLink,
  senderName,
  dueDate,
}: {
  recipientName: string;
  recipientEmail: string;
  documentCount: number;
  documentNames: string[];
  signingLink: string;
  senderName: string;
  dueDate?: string;
}) {
  const dueDateText = dueDate
    ? `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>⏰ Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>`
    : '';

  return sendEmail({
    to: recipientEmail,
    subject: `⏰ Reminder: ${documentCount} Documents Awaiting Your Signature`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #f59e0b; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Signature Reminder</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
            Your signing package is waiting
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hi <strong>${recipientName}</strong>,
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
            This is a friendly reminder that you have a signing package from <strong>${senderName}</strong> containing <strong>${documentCount} document${documentCount > 1 ? 's' : ''}</strong> that require your signature.
          </p>

          <!-- Document List -->
          <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #92400e; font-weight: 600;">
              📄 Pending Documents:
            </h3>
            ${documentNames.map((name, index) => `
              <div style="background: white; padding: 10px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #f59e0b;">
                <span style="font-size: 13px; color: #111827;">
                  ${index + 1}. ${name}
                </span>
              </div>
            `).join('')}
          </div>

          ${dueDateText}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signingLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">
              📝 Sign Now
            </a>
          </div>

          <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 20px;">
            If the button doesn't work, copy and paste this link:<br/>
            <span style="color: #6b7280; word-break: break-all; font-size: 11px;">${signingLink}</span>
          </p>

          <!-- Info Box -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 15px; margin-top: 25px;">
            <p style="font-size: 13px; color: #1e40af; margin: 0;">
              💡 <strong>Quick Reminder:</strong> You can sign all ${documentCount} documents in one session. It usually takes less than 5 minutes!
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            This is an automated reminder from ${senderName}
          </p>
        </div>
      </div>
    `,
  });
}


 // Notify recipient that one document in envelope was signed
 
export async function sendEnvelopeProgressEmail({
  recipientName,
  recipientEmail,
  completedCount,
  totalCount,
  remainingDocuments,
  signingLink,
}: {
  recipientName: string;
  recipientEmail: string;
  completedCount: number;
  totalCount: number;
  remainingDocuments: string[];
  signingLink: string;
}) {
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return sendEmail({
    to: recipientEmail,
    subject: `📊 Progress Update: ${completedCount}/${totalCount} Documents Signed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Almost There!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
            ${completedCount} of ${totalCount} documents signed
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hi <strong>${recipientName}</strong>,
          </p>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
            Great progress! You've signed ${completedCount} out of ${totalCount} documents. 
            ${remainingDocuments.length === 1 ? 'Just one more to go!' : `${remainingDocuments.length} more to go!`}
          </p>

          <!-- Progress Bar -->
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-size: 14px; color: #6b7280;">Progress</span>
              <span style="font-size: 14px; font-weight: 600; color: #3b82f6;">${progressPercent}%</span>
            </div>
            <div style="background: #e5e7eb; height: 12px; border-radius: 6px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
            </div>
          </div>

          <!-- Remaining Documents -->
          <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #92400e; font-weight: 600;">
              📋 Still need your signature:
            </h3>
            ${remainingDocuments.map((name, index) => `
              <div style="background: white; padding: 10px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #fbbf24;">
                <span style="font-size: 13px; color: #111827;">
                  ${index + 1}. ${name}
                </span>
              </div>
            `).join('')}
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signingLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ✍️ Continue Signing
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            You're so close to completing this package!
          </p>
        </div>
      </div>
    `,
  });
}

// ===================================
// SPACE INVITATION EMAIL
// ===================================
export async function sendSpaceInvitation({
  toEmail,
  spaceName,
  inviterName,
  role,
  inviteToken
}: {
  toEmail: string;
  spaceName: string;
  inviterName: string;
  role: string;
  inviteToken: string;
}) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`;

  await resend.emails.send({
    from: 'DocMetrics <noreply@docmetrics.io>',
    to: toEmail,
    subject: `You've been invited to ${spaceName}`,
    html: `
      <h2>You've been invited!</h2>
      <p>${inviterName} has invited you to collaborate on <strong>${spaceName}</strong></p>
      <p>Your role: <strong>${role}</strong></p>
      <a href="${inviteUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">
        Accept Invitation
      </a>
      <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
        Or copy this link: ${inviteUrl}
      </p>
    `
  });
}


// ===================================
// MEMBER ROLE CHANGED EMAIL
// ===================================
export async function sendMemberRoleChangedEmail({
  toEmail,
  spaceName,
  oldRole,
  newRole,
  changedBy
}: {
  toEmail: string;
  spaceName: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [toEmail],
      subject: `Your role in "${spaceName}" has been updated`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; }
            .role-change { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🔄 Role Updated</h1>
            </div>
            <div class="content">
              <p>Your permissions in <strong>${spaceName}</strong> have been updated.</p>
              <div class="role-change">
                <p style="margin: 0;"><strong>Previous Role:</strong> ${oldRole}</p>
                <p style="margin: 10px 0 0 0;"><strong>New Role:</strong> ${newRole}</p>
              </div>
              <p style="font-size: 14px; color: #6b7280;">Updated by: ${changedBy}</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/spaces" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
                View Space
              </a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DocuShare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) throw error;
    console.log('✅ Role change email sent to:', toEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}

// ===================================
// MEMBER REMOVED EMAIL
// ===================================
export async function sendMemberRemovedEmail({
  toEmail,
  spaceName,
  removedBy
}: {
  toEmail: string;
  spaceName: string;
  removedBy: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [toEmail],
      subject: `Access removed from "${spaceName}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; }
            .info-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">❌ Access Removed</h1>
            </div>
            <div class="content">
              <p>Your access to <strong>${spaceName}</strong> has been removed.</p>
              <div class="info-box">
                <p style="margin: 0;">You no longer have access to documents in this space.</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Removed by: ${removedBy}</p>
              </div>
              <p style="font-size: 14px; color: #6b7280;">If you believe this was done in error, please contact ${removedBy}.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DocuShare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) throw error;
    console.log('✅ Removal email sent to:', toEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}


// ===================================
// WELCOME EMAIL FOR NEW SIGNUPS
// ===================================
export async function sendWelcomeEmail({
  recipientName,
  recipientEmail,
}: {
  recipientName: string;
  recipientEmail: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [recipientEmail],
      subject: 'Welcome to DocMetrics - Your Document Workflow Starts Here',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background-color: #f9fafb;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 50px 30px;
              text-align: center;
              color: white;
            }
            .logo {
              font-size: 48px;
              margin-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .header p {
              margin: 12px 0 0 0;
              font-size: 16px;
              opacity: 0.95;
            }
            .content {
              padding: 45px 35px;
            }
            .greeting {
              font-size: 20px;
              color: #111827;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .intro-text {
              font-size: 16px;
              color: #4b5563;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            .feature-grid {
              display: grid;
              gap: 20px;
              margin: 35px 0;
            }
            .feature-card {
              background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
              border-left: 4px solid #667eea;
              padding: 24px;
              border-radius: 10px;
              transition: transform 0.2s;
            }
            .feature-icon {
              font-size: 32px;
              margin-bottom: 12px;
            }
            .feature-title {
              font-size: 18px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 8px;
            }
            .feature-desc {
              font-size: 14px;
              color: #6b7280;
              line-height: 1.6;
            }
            .cta-section {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-radius: 12px;
              padding: 30px;
              margin: 35px 0;
              text-align: center;
            }
            .cta-title {
              font-size: 20px;
              font-weight: 700;
              color: #78350f;
              margin-bottom: 15px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 16px;
              margin: 15px 0;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
              transition: transform 0.2s;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .stats-box {
              background: #f0fdf4;
              border: 2px solid #bbf7d0;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              text-align: center;
            }
            .stat-item {
              padding: 15px;
            }
            .stat-number {
              font-size: 28px;
              font-weight: 800;
              color: #059669;
              display: block;
            }
            .stat-label {
              font-size: 12px;
              color: #047857;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 5px;
            }
            .tips-section {
              background: #eff6ff;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
            }
            .tips-title {
              font-size: 18px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 15px;
            }
            .tip-item {
              display: flex;
              align-items: start;
              margin-bottom: 12px;
              padding: 10px;
              background: white;
              border-radius: 6px;
            }
            .tip-number {
              background: #3b82f6;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 12px;
              margin-right: 12px;
              flex-shrink: 0;
            }
            .tip-text {
              font-size: 14px;
              color: #1f2937;
              line-height: 1.5;
            }
            .support-box {
              background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
              border-left: 4px solid #ef4444;
              padding: 20px;
              border-radius: 10px;
              margin: 30px 0;
            }
            .support-title {
              font-size: 16px;
              font-weight: 700;
              color: #991b1b;
              margin-bottom: 10px;
            }
            .support-text {
              font-size: 14px;
              color: #7f1d1d;
              margin-bottom: 12px;
            }
            .support-email {
              color: #dc2626;
              font-weight: 600;
              text-decoration: none;
            }
            .footer {
              background: #f9fafb;
              padding: 35px 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer-text {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 15px;
            }
            .social-links {
              margin: 20px 0;
            }
            .social-link {
              display: inline-block;
              margin: 0 10px;
              color: #6b7280;
              text-decoration: none;
              font-size: 13px;
            }
            .footer-small {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo">📊</div>
              <h1>Welcome to DocMetrics</h1>
              <p>Where document sharing meets digital signatures</p>
            </div>
            
            <!-- Content -->
            <div class="content">
              <p class="greeting">Hi ${recipientName}! 👋</p>
              
              <p class="intro-text">
                We're thrilled to have you on board! DocMetrics combines the power of secure document sharing 
                with seamless e-signature capabilities, giving you complete control over your document workflow.
              </p>

              <!-- Feature Grid -->
              <div class="feature-grid">
                <div class="feature-card">
                  <div class="feature-icon">📤</div>
                  <div class="feature-title">Smart Document Sharing</div>
                  <div class="feature-desc">
                    Share documents securely with custom permissions, expiration dates, and detailed analytics. 
                    Know exactly who viewed your documents and when.
                  </div>
                </div>

                <div class="feature-card">
                  <div class="feature-icon">✍️</div>
                  <div class="feature-title">E-Signature Made Simple</div>
                  <div class="feature-desc">
                    Send documents for signature, track status in real-time, and get legally binding signatures 
                    in minutes. No printing, no scanning.
                  </div>
                </div>

                <div class="feature-card">
                  <div class="feature-icon">📈</div>
                  <div class="feature-title">Powerful Analytics</div>
                  <div class="feature-desc">
                    Gain insights into document engagement. Track views, downloads, time spent, and recipient 
                    behavior to optimize your workflow.
                  </div>
                </div>
              </div>

              <!-- CTA Section -->
              <div class="cta-section">
                <div class="cta-title">🚀 Ready to Get Started?</div>
                <p style="color: #92400e; font-size: 15px; margin-bottom: 10px;">
                  Upload your first document and experience the power of DocMetrics
                </p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://docmetrics.io'}/dashboard" class="cta-button">
                  Go to Dashboard
                </a>
              </div>

              <!-- Quick Start Tips -->
              <div class="tips-section">
                <div class="tips-title">💡 Quick Start Guide</div>
                <div class="tip-item">
                  <div class="tip-number">1</div>
                  <div class="tip-text">
                    <strong>Upload a document</strong> - Drag and drop any PDF or use our upload button
                  </div>
                </div>
                <div class="tip-item">
                  <div class="tip-number">2</div>
                  <div class="tip-text">
                    <strong>Share or request signatures</strong> - Choose whether to share for viewing or send for signing
                  </div>
                </div>
                <div class="tip-item">
                  <div class="tip-number">3</div>
                  <div class="tip-text">
                    <strong>Track everything</strong> - Monitor views, downloads, and signature progress in real-time
                  </div>
                </div>
                <div class="tip-item">
                  <div class="tip-number">4</div>
                  <div class="tip-text">
                    <strong>Collaborate seamlessly</strong> - Invite team members and manage permissions from your dashboard
                  </div>
                </div>
              </div>

              <!-- Stats Box -->
              <div class="stats-box">
                <div style="text-align: center; margin-bottom: 20px;">
                  <strong style="color: #047857; font-size: 16px;">Join thousands of professionals who trust DocMetrics</strong>
                </div>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-number">500K+</span>
                    <span class="stat-label">Documents Shared</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">250K+</span>
                    <span class="stat-label">Signatures Collected</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">99.9%</span>
                    <span class="stat-label">Uptime</span>
                  </div>
                </div>
              </div>

              <!-- Support Box -->
              <div class="support-box">
                <div class="support-title">🆘 Need Help?</div>
                <p class="support-text">
                  Our support team is here to help you succeed. Whether you have questions about features, 
                  need technical assistance, or want to share feedback, we're just an email away.
                </p>
                <p style="margin: 0;">
                  <strong>📧 Email us:</strong> 
                  <a href="mailto:support@docmetrics.io" class="support-email">support@docmetrics.io</a>
                </p>
              </div>

              <p style="font-size: 15px; color: #4b5563; margin-top: 35px; line-height: 1.7;">
                Thanks for choosing DocMetrics. We're committed to making your document workflow more efficient, 
                secure, and insightful. Let's build something great together!
              </p>

              <p style="font-size: 15px; color: #1f2937; margin-top: 25px; font-weight: 600;">
                Best regards,<br>
                The DocMetrics Team
              </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="footer-text">
                You're receiving this email because you created an account at DocMetrics.
              </p>
              <div class="social-links">
                <a href="#" class="social-link">Twitter</a> • 
                <a href="#" class="social-link">LinkedIn</a> • 
                <a href="#" class="social-link">Documentation</a>
              </div>
              <p class="footer-small">
                © ${new Date().getFullYear()} DocMetrics. All rights reserved.<br>
                <a href="#" style="color: #9ca3af; text-decoration: none;">Privacy Policy</a> • 
                <a href="#" style="color: #9ca3af; text-decoration: none;">Terms of Service</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send welcome email:', error);
      throw error;
    }

    console.log('✅ Welcome email sent to:', recipientEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Welcome email service error:', error);
    throw error;
  }
}




// ===================================
// PASSWORD RESET EMAIL
// ===================================
export async function sendPasswordResetEmail({
  recipientName,
  recipientEmail,
  resetCode,
}: {
  recipientName: string;
  recipientEmail: string;
  resetCode: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [recipientEmail],
      subject: 'Reset Your DocMetrics Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background-color: #f9fafb;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .lock-icon {
              font-size: 56px;
              margin-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 45px 35px;
            }
            .greeting {
              font-size: 20px;
              color: #111827;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .intro-text {
              font-size: 16px;
              color: #4b5563;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            .code-container {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 3px dashed #f59e0b;
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .code-label {
              font-size: 14px;
              color: #92400e;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 10px;
            }
            .reset-code {
              font-size: 42px;
              font-weight: 800;
              color: #92400e;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
              margin: 15px 0;
              display: block;
            }
            .code-expires {
              font-size: 13px;
              color: #b45309;
              margin-top: 15px;
            }
            .warning-box {
              background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
              border-left: 4px solid #ef4444;
              padding: 20px;
              border-radius: 10px;
              margin: 30px 0;
            }
            .warning-title {
              font-size: 16px;
              font-weight: 700;
              color: #991b1b;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
            }
            .warning-text {
              font-size: 14px;
              color: #7f1d1d;
              line-height: 1.6;
            }
            .info-box {
              background: #eff6ff;
              border-radius: 12px;
              padding: 20px;
              margin: 25px 0;
            }
            .info-item {
              display: flex;
              align-items: start;
              margin-bottom: 12px;
              font-size: 14px;
              color: #1e40af;
            }
            .info-icon {
              margin-right: 10px;
              font-size: 18px;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer-text {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 10px;
            }
            .footer-small {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="lock-icon">🔐</div>
              <h1>Password Reset Request</h1>
            </div>
            
            <!-- Content -->
            <div class="content">
              <p class="greeting">Hi ${recipientName || 'there'}! 👋</p>
              
              <p class="intro-text">
                We received a request to reset your DocMetrics password. Use the code below to set a new password.
                If you didn't request this, you can safely ignore this email.
              </p>

              <!-- Reset Code -->
              <div class="code-container">
                <div class="code-label">Your Reset Code</div>
                <span class="reset-code">${resetCode}</span>
                <div class="code-expires">
                  ⏰ This code expires in <strong>15 minutes</strong>
                </div>
              </div>

              <!-- Instructions -->
              <div class="info-box">
                <div class="info-item">
                  <span class="info-icon">1️⃣</span>
                  <span>Go to the password reset page (or click the button below)</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">2️⃣</span>
                  <span>Enter your email address</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">3️⃣</span>
                  <span>Enter the 6-digit code above</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">4️⃣</span>
                  <span>Create your new password</span>
                </div>
              </div>

              <!-- CTA Button -->
              <div class="button-container">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://docmetrics.io'}/reset-password/verify" class="cta-button">
                  Reset Password Now
                </a>
              </div>

              <!-- Security Warning -->
              <div class="warning-box">
                <div class="warning-title">
                  <span style="margin-right: 8px;">⚠️</span>
                  Security Notice
                </div>
                <p class="warning-text">
                  <strong>Never share this code with anyone.</strong> DocMetrics staff will never ask for your 
                  reset code. If you didn't request this password reset, please contact our support team immediately 
                  at <a href="mailto:support@docmetrics.io" style="color: #dc2626; font-weight: 600;">support@docmetrics.io</a>
                </p>
              </div>

              <p style="font-size: 15px; color: #4b5563; margin-top: 30px; line-height: 1.7;">
                After resetting your password, you'll be able to sign in with both Google and your new password.
              </p>

              <p style="font-size: 15px; color: #1f2937; margin-top: 25px; font-weight: 600;">
                Best regards,<br>
                The DocMetrics Security Team
              </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="footer-text">
                You're receiving this email because someone requested a password reset for your DocMetrics account.
              </p>
              <p class="footer-small">
                © ${new Date().getFullYear()} DocMetrics. All rights reserved.<br>
                If you have questions, contact us at 
                <a href="mailto:support@docmetrics.io" style="color: #9ca3af; text-decoration: none;">support@docmetrics.io</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }

    console.log('✅ Password reset email sent to:', recipientEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Password reset email service error:', error);
    throw error;
  }
}

// ===================================
// SUPPORT REQUEST EMAIL
// ===================================
export async function sendSupportRequestEmail({
  userName,
  userEmail,
  subject,
  message,
  userCompany,
}: {
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  userCompany?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics Support <noreply@docmetrics.io>',
      to: ['support@docmetrics.io'], // Your support email
      replyTo: userEmail,
      subject: `Support Request: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background-color: #f9fafb;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            }
            .header {
              background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
            }
            .content {
              padding: 40px 35px;
            }
            .section {
              margin-bottom: 25px;
            }
            .label {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .value {
              font-size: 16px;
              color: #111827;
              background: #f9fafb;
              padding: 12px 16px;
              border-radius: 8px;
              border-left: 3px solid #0ea5e9;
            }
            .message-box {
              background: #f0f9ff;
              border: 2px solid #bae6fd;
              border-radius: 12px;
              padding: 20px;
              margin: 25px 0;
            }
            .message-text {
              font-size: 15px;
              color: #075985;
              line-height: 1.7;
              white-space: pre-wrap;
            }
            .footer {
              background: #f9fafb;
              padding: 25px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              font-size: 13px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎧 New Support Request</h1>
            </div>
            
            <div class="content">
              <div class="section">
                <div class="label">From</div>
                <div class="value">${userName}</div>
              </div>

              <div class="section">
                <div class="label">Email</div>
                <div class="value">${userEmail}</div>
              </div>

              ${userCompany ? `
              <div class="section">
                <div class="label">Company</div>
                <div class="value">${userCompany}</div>
              </div>
              ` : ''}

              <div class="section">
                <div class="label">Subject</div>
                <div class="value">${subject}</div>
              </div>

              <div class="message-box">
                <div class="label" style="color: #075985;">Message</div>
                <div class="message-text">${message}</div>
              </div>
            </div>
            
            <div class="footer">
              Sent via DocMetrics Support System<br>
              ${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send support email:', error);
      throw error;
    }

    console.log('✅ Support email sent:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Support email error:', error);
    throw error;
  }
}

// ===================================
// DEMO BOOKING REQUEST EMAIL
// ===================================
export async function sendDemoBookingEmail({
  userName,
  userEmail,
  userCompany,
  phoneNumber,
  teamSize,
  preferredDate,
  message,
}: {
  userName: string;
  userEmail: string;
  userCompany?: string;
  phoneNumber?: string;
  teamSize?: string;
  preferredDate?: string;
  message?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics Demos <noreply@docmetrics.io>',
      to: ['support@docmetrics.io'],
      replyTo: userEmail,
      subject: `Demo Request: ${userName} - ${userCompany || 'Individual'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background-color: #f9fafb;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #a855f7 0%, #0ea5e9 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .header-icon {
              font-size: 48px;
              margin-bottom: 12px;
            }
            .header h1 {
              margin: 0;
              font-size: 26px;
              font-weight: 700;
            }
            .priority-badge {
              display: inline-block;
              background: #fef3c7;
              color: #92400e;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 700;
              margin-top: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .content {
              padding: 40px 35px;
            }
            .info-grid {
              display: grid;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-item {
              background: #f9fafb;
              border-left: 4px solid #a855f7;
              padding: 16px 20px;
              border-radius: 8px;
            }
            .info-label {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              margin-bottom: 6px;
            }
            .info-value {
              font-size: 16px;
              color: #111827;
              font-weight: 500;
            }
            .message-section {
              background: linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%);
              border: 2px solid #e9d5ff;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
            }
            .message-text {
              font-size: 15px;
              color: #581c87;
              line-height: 1.7;
              white-space: pre-wrap;
            }
            .action-box {
              background: #eff6ff;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 15px;
              margin-top: 10px;
            }
            .footer {
              background: #f9fafb;
              padding: 25px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              font-size: 13px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-icon">🎥</div>
              <h1>New Demo Request</h1>
              <div class="priority-badge">⚡ High Priority</div>
            </div>
            
            <div class="content">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Contact Name</div>
                  <div class="info-value">${userName}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${userEmail}</div>
                </div>

                ${userCompany ? `
                <div class="info-item">
                  <div class="info-label">Company</div>
                  <div class="info-value">${userCompany}</div>
                </div>
                ` : ''}

                ${phoneNumber ? `
                <div class="info-item">
                  <div class="info-label">Phone Number</div>
                  <div class="info-value">${phoneNumber}</div>
                </div>
                ` : ''}

                ${teamSize ? `
                <div class="info-item">
                  <div class="info-label">Team Size</div>
                  <div class="info-value">${teamSize}</div>
                </div>
                ` : ''}

                ${preferredDate ? `
                <div class="info-item">
                  <div class="info-label">Preferred Date/Time</div>
                  <div class="info-value">${preferredDate}</div>
                </div>
                ` : ''}
              </div>

              ${message ? `
              <div class="message-section">
                <div class="info-label" style="color: #581c87; margin-bottom: 12px;">Additional Notes</div>
                <div class="message-text">${message}</div>
              </div>
              ` : ''}

              <div class="action-box">
                <p style="margin: 0 0 15px; color: #1e40af; font-weight: 600;">
                  📅 Schedule This Demo
                </p>
                <a href="mailto:${userEmail}" class="cta-button">
                  Reply to ${userName}
                </a>
              </div>
            </div>
            
            <div class="footer">
              Sent via DocMetrics Demo System<br>
              ${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send demo email:', error);
      throw error;
    }

    console.log('✅ Demo booking email sent:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Demo booking email error:', error);
    throw error;
  }
}



// ===================================
// FEEDBACK SUBMISSION EMAIL (SIMPLIFIED)
// ===================================
export async function sendFeedbackEmail({
  userEmail,
  feedback,
}: {
  userEmail: string;
  feedback: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics Feedback <noreply@docmetrics.io>',
      to: ['support@docmetrics.io'],
      replyTo: userEmail,
      subject: `Feedback from ${userEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background-color: #f9fafb;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .header-icon {
              font-size: 48px;
              margin-bottom: 12px;
            }
            .header h1 {
              margin: 0;
              font-size: 26px;
              font-weight: 700;
            }
            .content {
              padding: 40px 35px;
            }
            .info-item {
              background: #f9fafb;
              border-left: 4px solid #10b981;
              padding: 16px 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .info-label {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              margin-bottom: 6px;
            }
            .info-value {
              font-size: 16px;
              color: #111827;
              font-weight: 500;
            }
            .feedback-box {
              background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%);
              border: 2px solid #a7f3d0;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
            }
            .feedback-text {
              font-size: 15px;
              color: #065f46;
              line-height: 1.7;
              white-space: pre-wrap;
            }
            .footer {
              background: #f9fafb;
              padding: 25px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              font-size: 13px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-icon">💬</div>
              <h1>New User Feedback</h1>
            </div>
            
            <div class="content">
              <div class="info-item">
                <div class="info-label">From</div>
                <div class="info-value">${userEmail}</div>
              </div>

              <div class="feedback-box">
                <div class="info-label" style="color: #065f46; margin-bottom: 12px;">💡 Feedback</div>
                <div class="feedback-text">${feedback}</div>
              </div>
            </div>
            
            <div class="footer">
              Sent via DocMetrics Feedback System<br>
              ${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send feedback email:', error);
      throw error;
    }

    console.log('✅ Feedback email sent:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Feedback email error:', error);
    throw error;
  }
}


// ===================================
// BULK SEND CC SUMMARY EMAIL
// ===================================
export async function sendCCBulkSummaryEmail({
  ccName,
  ccEmail,
  senderName,
  documentName,
  batchId,
  recipients,
  origin,
}: {
  ccName: string;
  ccEmail: string;
  senderName: string;
  documentName: string;
  batchId: string;
  recipients: Array<{ name: string; email: string; signingLink: string; ccViewLink: string }>;
  origin: string;
}) {
  const recipientRows = recipients
    .map(
      (r, i) => `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 12px 16px; font-size: 14px; color: #111827; font-weight: 500;">
          <span style="background: #ede9fe; color: #7c3aed; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; margin-right: 8px;">${i + 1}</span>
          ${r.name}
        </td>
        <td style="padding: 12px 16px; font-size: 13px; color: #6b7280;">${r.email}</td>
        <td style="padding: 12px 16px;">
          <a href="${r.ccViewLink}" style="display: inline-block; background: #ede9fe; color: #7c3aed; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none;">
            View Doc
          </a>
        </td>
      </tr>
    `
    )
    .join('');

  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [ccEmail],
      subject: `CC: Bulk send summary — ${recipients.length} recipients sent "${documentName}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 36px 30px; text-align: center; color: white; }
            .content { padding: 35px 30px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 25px 0; }
            .meta-card { background: #f9fafb; border-radius: 8px; padding: 14px 18px; border-left: 3px solid #667eea; }
            .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; font-weight: 600; margin-bottom: 4px; }
            .meta-value { font-size: 15px; font-weight: 600; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            thead tr { background: #f9fafb; }
            thead th { padding: 10px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600; }
            .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 22px;">📋 Bulk Send Summary (CC)</h1>
              <p style="margin: 10px 0 0; opacity: 0.9; font-size: 15px;">
                You were CC'd on this bulk send by <strong>${senderName}</strong>
              </p>
            </div>

            <div class="content">
              <p style="font-size: 15px; color: #374151;">Hi ${ccName},</p>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 25px;">
                <strong>${senderName}</strong> has sent <strong>"${documentName}"</strong> to <strong>${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}</strong> for signature. 
                You are copied on this send for your records. Use the links below to view each recipient's copy of the document.
              </p>

              <div class="meta-grid">
                <div class="meta-card">
                  <div class="meta-label">Document</div>
                  <div class="meta-value">${documentName}</div>
                </div>
                <div class="meta-card">
                  <div class="meta-label">Total Recipients</div>
                  <div class="meta-value">${recipients.length}</div>
                </div>
                <div class="meta-card">
                  <div class="meta-label">Sent By</div>
                  <div class="meta-value">${senderName}</div>
                </div>
                <div class="meta-card">
                  <div class="meta-label">Sent On</div>
                  <div class="meta-value">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
              </div>

              <h3 style="font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 0;">Recipients & Document Links</h3>
              <p style="font-size: 13px; color: #9ca3af; margin-top: 4px;">Click "View Doc" to see each recipient's individual document copy.</p>

              <table>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Email</th>
                    <th>Document</th>
                  </tr>
                </thead>
                <tbody>
                  ${recipientRows}
                </tbody>
              </table>

              <div style="margin-top: 28px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px;">
                <p style="margin: 0; font-size: 13px; color: #1e40af;">
                  <strong>ℹ️ Note:</strong> You will receive a separate notification email when each recipient signs their document. 
                  You are view-only on these documents — no action is required from you.
                </p>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0;">You received this because you were CC'd on a bulk send from ${senderName}.</p>
              <p style="margin: 8px 0 0;">© ${new Date().getFullYear()} DocMetrics. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send CC bulk summary email:', error);
      throw error;
    }

    console.log('✅ CC bulk summary email sent to:', ccEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ CC bulk summary email error:', error);
    throw error;
  }
}



// ===================================
// CC PER-SIGNATURE NOTIFICATION
// ===================================
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
  ccName: string;
  ccEmail: string;
  signerName: string;
  signerEmail: string;
  documentName: string;
  totalSigned: number;
  totalRecipients: number;
  ccViewLink: string;
}) {
  const allDone = totalSigned === totalRecipients;

  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [ccEmail],
      subject: `${signerName} signed "${documentName}" (${totalSigned}/${totalRecipients} complete)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 580px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 30px; text-align: center; color: white; }
            .content { padding: 32px 30px; }
            .signer-card { background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
            .progress-bar-bg { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin: 8px 0; }
            .progress-bar-fill { background: #10b981; height: 100%; border-radius: 4px; }
            .cta-button { display: inline-block; background: #7c3aed; color: white; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 20px; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 20px;">✍️ New Signature Received</h1>
              <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">${documentName}</p>
            </div>
            <div class="content">
              <p style="font-size: 15px; color: #374151;">Hi ${ccName},</p>

              <div class="signer-card">
                <p style="margin: 0; font-weight: 700; color: #065f46; font-size: 15px;">✅ ${signerName} just signed</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">${signerEmail}</p>
              </div>

              <div style="margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="font-size: 13px; font-weight: 600; color: #374151;">Signing Progress</span>
                  <span style="font-size: 13px; color: #6b7280;">${totalSigned} of ${totalRecipients} signed</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${Math.round((totalSigned / totalRecipients) * 100)}%;"></div>
                </div>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 6px;">
                  ${allDone ? '🎉 All signatures collected — document is complete!' : `${totalRecipients - totalSigned} signature${totalRecipients - totalSigned !== 1 ? 's' : ''} remaining`}
                </p>
              </div>

              <center>
                <a href="${ccViewLink}" class="cta-button">View Document</a>
              </center>

              <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
                You are receiving this because you were CC'd on this document. No action is required from you.
              </p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} DocMetrics. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    console.log('✅ CC signature update email sent to:', ccEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ CC signature update email error:', error);
    throw error;
  }
}