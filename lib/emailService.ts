import { Resend } from 'resend';

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
      from: 'DocuShare <onboarding@resend.dev>', // ⚠️ Change this to your verified domain
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
      from: 'DocuShare <onboarding@resend.dev>',
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
      from: 'DocuShare <onboarding@resend.dev>',
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
      from: 'DocuShare <onboarding@resend.dev>',
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
}: {
  recipientEmail: string;
  recipientName: string;
  originalFilename: string;
  ownerName: string;
  reason: string;
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
      from: 'DocuShare <onboarding@resend.dev>',
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
      from: 'DocuShare <onboarding@resend.dev>',
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
      from: 'DocuShare <onboarding@resend.dev>',
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
      from: 'DocuShare <onboarding@resend.dev>',
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