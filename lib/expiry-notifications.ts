import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ===================================
// 30-DAY EXPIRY WARNING
// ===================================
export async function send30DayExpiryWarning({
  recipientName,
  recipientEmail,
  documentName,
  documentId,
  expiryDate,
  expiryReason,
  daysUntilExpiry,
}: {
  recipientName: string;
  recipientEmail: string;
  documentName: string;
  documentId: string;
  expiryDate: string;
  expiryReason?: string;
  daysUntilExpiry: number;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [recipientEmail],
      subject: `⚠️ Document Expiring in ${daysUntilExpiry} Days - Action Required`,
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
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .warning-icon {
              font-size: 64px;
              margin-bottom: 15px;
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.95;
            }
            .content {
              padding: 40px 35px;
            }
            .greeting {
              font-size: 20px;
              color: #111827;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .alert-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 3px solid #f59e0b;
              border-radius: 12px;
              padding: 25px;
              margin: 25px 0;
              text-align: center;
            }
            .countdown {
              font-size: 48px;
              font-weight: 900;
              color: #92400e;
              margin: 15px 0;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            .countdown-label {
              font-size: 14px;
              color: #b45309;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 600;
            }
            .document-card {
              background: #f9fafb;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              border-radius: 10px;
              margin: 25px 0;
            }
            .doc-label {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .doc-name {
              font-size: 18px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 12px;
            }
            .doc-details {
              font-size: 14px;
              color: #4b5563;
              line-height: 1.8;
            }
            .action-needed {
              background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
              border-left: 4px solid #dc2626;
              padding: 20px;
              border-radius: 10px;
              margin: 25px 0;
            }
            .action-title {
              font-size: 16px;
              font-weight: 700;
              color: #991b1b;
              margin-bottom: 12px;
            }
            .action-list {
              font-size: 14px;
              color: #7f1d1d;
              line-height: 1.8;
              margin: 0;
              padding-left: 20px;
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
              margin: 25px 0;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            .info-box {
              background: #eff6ff;
              border-radius: 12px;
              padding: 20px;
              margin: 25px 0;
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
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="warning-icon">⚠️</div>
              <h1>Document Expiring Soon</h1>
              <p>Action Required</p>
            </div>
            
            <!-- Content -->
            <div class="content">
              <p class="greeting">Hi ${recipientName}! 👋</p>
              
              <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
                This is a friendly reminder that one of your documents is approaching its expiration date.
              </p>

              <!-- Countdown Alert -->
              <div class="alert-box">
                <div class="countdown-label">Expires In</div>
                <div class="countdown">${daysUntilExpiry} Days</div>
                <div style="font-size: 14px; color: #92400e; margin-top: 10px;">
                  📅 Expiry Date: <strong>${new Date(expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                </div>
              </div>

              <!-- Document Info -->
              <div class="document-card">
                <div class="doc-label">Document</div>
                <div class="doc-name">📄 ${documentName}</div>
                <div class="doc-details">
                  <strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}<br>
                  ${expiryReason ? `<strong>Reason:</strong> ${expiryReason}<br>` : ''}
                  <strong>Status:</strong> <span style="color: #f59e0b; font-weight: 600;">⏰ Expiring Soon</span>
                </div>
              </div>

              <!-- Action Required -->
              <div class="action-needed">
                <div class="action-title">🚨 What You Need to Do:</div>
                <ul class="action-list">
                  <li><strong>Upload a new version</strong> with updated terms/dates</li>
                  <li><strong>Extend the expiry date</strong> if document is still valid</li>
                  <li><strong>Archive the document</strong> if no longer needed</li>
                  <li><strong>Notify team members</strong> who may be affected</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://docmetrics.io'}/documents/${documentId}/versions" class="cta-button">
                  Manage This Document
                </a>
              </div>

              <!-- Info Box -->
              <div class="info-box">
                <p style="font-size: 14px; color: #1e40af; margin: 0;">
                  <strong>💡 Pro Tip:</strong> After the expiry date, this document will be blocked from downloads 
                  and signatures to ensure compliance. You'll receive another reminder 7 days before expiration.
                </p>
              </div>

              <p style="font-size: 15px; color: #4b5563; margin-top: 30px; line-height: 1.7;">
                Don't worry - we're here to help you stay compliant and organized. If you have any questions, 
                just reply to this email.
              </p>

              <p style="font-size: 15px; color: #1f2937; margin-top: 25px; font-weight: 600;">
                Best regards,<br>
                The DocMetrics Team
              </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="footer-text">
                You're receiving this because you own documents with expiry dates in DocMetrics.
              </p>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                © ${new Date().getFullYear()} DocMetrics. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send 30-day expiry warning:', error);
      throw error;
    }

    console.log('✅ 30-day expiry warning sent to:', recipientEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ 30-day expiry warning error:', error);
    throw error;
  }
}

// ===================================
// 7-DAY EXPIRY WARNING (URGENT)
// ===================================
export async function send7DayExpiryWarning({
  recipientName,
  recipientEmail,
  documentName,
  documentId,
  expiryDate,
  expiryReason,
  daysUntilExpiry,
}: {
  recipientName: string;
  recipientEmail: string;
  documentName: string;
  documentId: string;
  expiryDate: string;
  expiryReason?: string;
  daysUntilExpiry: number;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [recipientEmail],
      subject: `🚨 URGENT: Document Expires in ${daysUntilExpiry} Days!`,
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
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
              border: 3px solid #dc2626;
            }
            .header {
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .urgent-icon {
              font-size: 72px;
              margin-bottom: 15px;
              animation: shake 0.5s infinite;
            }
            @keyframes shake {
              0%, 100% { transform: rotate(-5deg); }
              50% { transform: rotate(5deg); }
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .urgent-badge {
              display: inline-block;
              background: #fef3c7;
              color: #92400e;
              padding: 8px 20px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 800;
              margin-top: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .content {
              padding: 40px 35px;
            }
            .countdown-box {
              background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
              border: 4px solid #dc2626;
              border-radius: 16px;
              padding: 30px;
              text-align: center;
              margin: 25px 0;
              box-shadow: 0 8px 16px rgba(220, 38, 38, 0.2);
            }
            .countdown {
              font-size: 64px;
              font-weight: 900;
              color: #991b1b;
              margin: 20px 0;
              text-shadow: 3px 3px 6px rgba(0,0,0,0.1);
            }
            .countdown-label {
              font-size: 16px;
              color: #7f1d1d;
              text-transform: uppercase;
              letter-spacing: 2px;
              font-weight: 700;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
              color: white;
              padding: 18px 50px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 700;
              font-size: 18px;
              margin: 30px 0;
              box-shadow: 0 8px 20px rgba(220, 38, 38, 0.4);
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .footer {
              background: #fee2e2;
              padding: 30px;
              text-align: center;
              border-top: 2px solid #dc2626;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="urgent-icon">🚨</div>
              <h1>Urgent Action Required</h1>
              <div class="urgent-badge">⚡ ${daysUntilExpiry} Days Remaining</div>
            </div>
            
            <div class="content">
              <p style="font-size: 20px; font-weight: 700; color: #dc2626; margin-bottom: 20px;">
                Hi ${recipientName}, this is critical! ⏰
              </p>
              
              <p style="font-size: 16px; color: #1f2937; margin-bottom: 25px;">
                Your document <strong>"${documentName}"</strong> is about to expire. 
                After ${daysUntilExpiry} days, it will be <strong>blocked from all downloads and signatures</strong>.
              </p>

              <div class="countdown-box">
                <div class="countdown-label">⏰ Time Remaining</div>
                <div class="countdown">${daysUntilExpiry}</div>
                <div class="countdown-label">Day${daysUntilExpiry !== 1 ? 's' : ''}</div>
                <div style="margin-top: 20px; font-size: 15px; color: #7f1d1d;">
                  Expires: <strong>${new Date(expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                </div>
                ${expiryReason ? `
                  <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px;">
                    <div style="font-size: 12px; color: #991b1b; font-weight: 600; margin-bottom: 5px;">REASON</div>
                    <div style="font-size: 14px; color: #7f1d1d;">${expiryReason}</div>
                  </div>
                ` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://docmetrics.io'}/documents/${documentId}/versions" class="cta-button">
                  Take Action Now →
                </a>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 10px; margin: 30px 0;">
                <p style="font-size: 14px; color: #92400e; margin: 0; line-height: 1.7;">
                  <strong>⚡ Quick Actions:</strong><br>
                  • Upload a new version immediately<br>
                  • Extend the expiry date<br>
                  • Archive if no longer needed
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p style="font-size: 14px; color: #991b1b; font-weight: 600; margin: 0;">
                This is your final warning before expiration.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send 7-day expiry warning:', error);
      throw error;
    }

    console.log('✅ 7-day expiry warning sent to:', recipientEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ 7-day expiry warning error:', error);
    throw error;
  }
}

// ===================================
// DOCUMENT EXPIRED NOTIFICATION
// ===================================
export async function sendDocumentExpiredNotification({
  recipientName,
  recipientEmail,
  documentName,
  documentId,
  expiryDate,
  expiryReason,
}: {
  recipientName: string;
  recipientEmail: string;
  documentName: string;
  documentId: string;
  expiryDate: string;
  expiryReason?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DocMetrics <noreply@docmetrics.io>',
      to: [recipientEmail],
      subject: `🔴 Document Expired: "${documentName}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
              background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .expired-icon {
              font-size: 72px;
              margin-bottom: 15px;
              opacity: 0.5;
            }
            .content {
              padding: 40px 35px;
            }
            .expired-box {
              background: #fee2e2;
              border: 3px solid #dc2626;
              border-radius: 12px;
              padding: 25px;
              margin: 25px 0;
              text-align: center;
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
              margin: 25px 0;
            }
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="expired-icon">🔴</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Document Has Expired</h1>
            </div>
            
            <div class="content">
              <p style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 20px;">
                Hi ${recipientName},
              </p>
              
              <p style="font-size: 16px; color: #4b5563; margin-bottom: 25px;">
                Your document <strong>"${documentName}"</strong> has officially expired and is now blocked 
                from downloads and signatures.
              </p>

              <div class="expired-box">
                <div style="font-size: 18px; font-weight: 700; color: #991b1b; margin-bottom: 15px;">
                  🚫 Document Blocked
                </div>
                <div style="font-size: 14px; color: #7f1d1d;">
                  Expired on: <strong>${new Date(expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                </div>
                ${expiryReason ? `
                  <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px;">
                    <div style="font-size: 12px; color: #991b1b; font-weight: 600; margin-bottom: 5px;">REASON</div>
                    <div style="font-size: 14px; color: #7f1d1d;">${expiryReason}</div>
                  </div>
                ` : ''}
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 10px; margin: 25px 0;">
                <p style="font-size: 14px; color: #92400e; margin: 0; line-height: 1.7;">
                  <strong>📋 Next Steps:</strong><br>
                  • Upload a new version to reactivate<br>
                  • Archive the document if no longer needed<br>
                  • Contact support if you need assistance
                </p>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://docmetrics.io'}/documents/${documentId}/versions" class="cta-button">
                  Manage Document
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p style="font-size: 14px; color: #6b7280; margin: 0;">
                © ${new Date().getFullYear()} DocMetrics. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send expired notification:', error);
      throw error;
    }

    console.log('✅ Expired notification sent to:', recipientEmail);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Expired notification error:', error);
    throw error;
  }
}