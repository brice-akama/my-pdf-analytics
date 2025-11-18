// lib/email.ts
// Email sending utility - supports multiple providers

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// ✅ Option 1: Using Resend (Recommended - Easy & Free)
export async function sendEmail(options: EmailOptions) {
  const provider = process.env.EMAIL_PROVIDER || 'resend';

  switch (provider) {
    case 'resend':
      return sendWithResend(options);
    case 'sendgrid':
      return sendWithSendGrid(options);
    case 'postmark':
      return sendWithPostmark(options);
    case 'console':
      return logToConsole(options);
    default:
      return sendWithResend(options);
  }
}

// 🚀 Resend (Recommended)
async function sendWithResend(options: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY not set, logging email to console');
    return logToConsole(options);
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || process.env.EMAIL_FROM || 'DocMetrics <notifications@docmetrics.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Resend error:', error);
      throw new Error(`Email send failed: ${error.message}`);
    }

    const data = await response.json();
    console.log('✅ Email sent via Resend:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Failed to send email via Resend:', error);
    throw error;
  }
}

// SendGrid implementation
async function sendWithSendGrid(options: EmailOptions) {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ SENDGRID_API_KEY not set');
    return logToConsole(options);
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }],
        }],
        from: { 
          email: options.from || process.env.EMAIL_FROM || 'notifications@docmetrics.com',
          name: 'DocMetrics'
        },
        subject: options.subject,
        content: [{
          type: 'text/html',
          value: options.html,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ SendGrid error:', error);
      throw new Error('Email send failed');
    }

    console.log('✅ Email sent via SendGrid');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send email via SendGrid:', error);
    throw error;
  }
}

// Postmark implementation
async function sendWithPostmark(options: EmailOptions) {
  const apiKey = process.env.POSTMARK_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ POSTMARK_API_KEY not set');
    return logToConsole(options);
  }

  try {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: options.from || process.env.EMAIL_FROM || 'notifications@docmetrics.com',
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Postmark error:', error);
      throw new Error('Email send failed');
    }

    const data = await response.json();
    console.log('✅ Email sent via Postmark:', data.MessageID);
    return data;
  } catch (error) {
    console.error('❌ Failed to send email via Postmark:', error);
    throw error;
  }
}

// Development: Log to console
function logToConsole(options: EmailOptions) {
  console.log('\n📧 ===== EMAIL (Console Mode) =====');
  console.log('To:', options.to);
  console.log('Subject:', options.subject);
  console.log('HTML:', options.html.substring(0, 200) + '...');
  console.log('====================================\n');
  return Promise.resolve({ success: true, mode: 'console' });
}

// ✅ Send bulk emails (for notifications to multiple users)
export async function sendBulkEmails(emails: EmailOptions[]) {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`📧 Bulk email results: ${successful} sent, ${failed} failed`);

  return { successful, failed, results };
}

// ✅ Email templates
export const emailTemplates = {
  documentViewed: (viewerName: string, viewerEmail: string, documentName: string, viewUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Document View Alert</h1>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #1f2937; margin-top: 0;">
          Great news! Someone is viewing your document right now.
        </p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Viewer:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${viewerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${viewerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Document:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${documentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewUrl}" 
             style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); 
                    color: white; 
                    padding: 14px 32px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;
                    font-weight: 600;
                    box-shadow: 0 4px 6px rgba(139, 92, 246, 0.25);">
            📊 View Full Analytics
          </a>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            💡 <strong>Pro Tip:</strong> You can see detailed analytics including time spent, pages viewed, and more in your dashboard.
          </p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
        
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-bottom: 0;">
          You're receiving this because you enabled view notifications.<br/>
          <a href="${viewUrl}" style="color: #8B5CF6; text-decoration: none;">Manage notification settings</a>
        </p>
      </div>
    </div>
  `,

  viewerWelcome: (viewerName: string, documentName: string, customMessage: string, viewUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome!</h1>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #1f2937;">
          Hi ${viewerName},
        </p>
        
        <p style="font-size: 16px; color: #1f2937;">
          You now have access to view <strong>${documentName}</strong>.
        </p>
        
        ${customMessage ? `
          <div style="background: #f0f9ff; padding: 16px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">${customMessage}</p>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${viewUrl}" 
             style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); 
                    color: white; 
                    padding: 14px 32px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;
                    font-weight: 600;
                    box-shadow: 0 4px 6px rgba(139, 92, 246, 0.25);">
            📄 Open Document
          </a>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
        
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-bottom: 0;">
          This document was shared with you securely via DocMetrics
        </p>
      </div>
    </div>
  `,
};