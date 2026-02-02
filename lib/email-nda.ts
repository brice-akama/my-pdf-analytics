// lib/email-nda.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NdaEmailData {
  ownerName: string;
  ownerEmail: string;
  viewerName: string;
  viewerEmail: string;
  viewerCompany?: string;
  documentTitle: string;
  acceptedAt: Date;
  certificateId: string;
  documentUrl: string;
  ip: string;
}

export async function sendNdaAcceptanceEmail(
  data: NdaEmailData,
  certificatePdf: Buffer
) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'DocMetrics <onboarding@resend.dev>', // ⚠️ Change to your domain
      to: [data.ownerEmail],
      subject: `✅ NDA Accepted: ${data.viewerName} - ${data.documentTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); padding: 40px 30px; text-align: center; }
    .checkmark { background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .content { padding: 40px 30px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #8B5CF6; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .legal-badge { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #a7f3d0; }
    .cert-badge { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #fde68a; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4); }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e9ecef; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="checkmark">✅</div>
      <h1>NDA Accepted!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Legal protection is now active</p>
    </div>
    
    <div class="content">
      <p style="font-size: 18px; color: #1e293b; margin: 0 0 20px;">Hi <strong>${data.ownerName}</strong>,</p>
      
      <p style="font-size: 16px; color: #1e293b; margin: 0 0 30px;">
        <strong style="color: #8B5CF6;">${data.viewerName}</strong> has just accepted your Non-Disclosure Agreement for:
      </p>

      <div class="info-card">
        <p style="margin: 0 0 15px; color: #475569; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📄 DOCUMENT</p>
        <p style="margin: 0 0 20px; color: #1e293b; font-size: 18px; font-weight: 700;">${data.documentTitle}</p>
        
        <p style="margin: 0 0 8px; color: #475569; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">👤 VIEWER DETAILS</p>
        <table cellpadding="0" cellspacing="0" style="font-size: 14px; color: #1e293b; width: 100%;">
          <tr>
            <td style="padding: 4px 0; color: #64748b; width: 100px;">Name:</td>
            <td style="padding: 4px 0; font-weight: 600;">${data.viewerName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Email:</td>
            <td style="padding: 4px 0; font-weight: 600;">${data.viewerEmail}</td>
          </tr>
          ${data.viewerCompany ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Company:</td>
            <td style="padding: 4px 0; font-weight: 600;">${data.viewerCompany}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Time:</td>
            <td style="padding: 4px 0; font-weight: 600;">${data.acceptedAt.toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short',
            })}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">IP Address:</td>
            <td style="padding: 4px 0; font-family: monospace; font-size: 13px;">${data.ip}</td>
          </tr>
        </table>
      </div>

      <div class="legal-badge">
        <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
          <strong style="font-size: 16px;">✅ Legal Protection Active</strong><br/>
          This acceptance has been recorded with:
        </p>
        <ul style="margin: 10px 0 0 20px; padding: 0; color: #065f46; font-size: 13px;">
          <li style="margin: 5px 0;">Timestamp and IP address verification</li>
          <li style="margin: 5px 0;">Digital signature and certificate ID</li>
          <li style="margin: 5px 0;">Full NDA text snapshot</li>
          <li style="margin: 5px 0;">Legally admissible proof of acceptance</li>
        </ul>
      </div>

      <div class="cert-badge">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          <strong style="font-size: 16px;">📎 Certificate Attached</strong><br/>
          The official NDA acceptance certificate is attached to this email for your records.
        </p>
        <p style="margin: 10px 0 0; color: #92400e; font-size: 13px; font-family: monospace; background: rgba(255,255,255,0.5); padding: 8px; border-radius: 6px;">
          Certificate ID: ${data.certificateId}
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.documentUrl}" class="cta-button">📊 View Document Analytics</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 5px;">This is an automated notification from DocMetrics</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} DocMetrics. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: `NDA-Certificate-${data.certificateId}.pdf`,
          content: certificatePdf,
        },
      ],
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log('✅ NDA acceptance email sent via Resend to:', data.ownerEmail);
    return { success: true, data: emailData };

  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}