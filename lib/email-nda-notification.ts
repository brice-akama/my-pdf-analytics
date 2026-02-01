// lib/email-nda-notification.ts
import { sendEmail } from '@/lib/email';
import { generateNdaCertificate } from '@/lib/nda-certificate';

interface NdaNotificationData {
  ownerEmail: string;
  ownerName: string;
  viewerName: string;
  viewerEmail: string;
  viewerCompany?: string;
  documentTitle: string;
  acceptedAt: Date;
  certificateId: string;
  certificateData: any; // Full certificate data for PDF generation
  documentUrl: string;
}

export async function sendNdaAcceptanceNotification(data: NdaNotificationData) {
  try {
    // Generate certificate PDF
    const certificatePdf = generateNdaCertificate(data.certificateData);

    // Send email with certificate attached
    await sendEmail({
      to: data.ownerEmail,
      subject: `✅ NDA Accepted: ${data.viewerName} - ${data.documentTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="background: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 30px;">✅</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px;">NDA Accepted!</h1>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #1e293b; margin: 0 0 20px;">
              Hi ${data.ownerName},
            </p>

            <p style="font-size: 16px; color: #1e293b; margin: 0 0 20px;">
              <strong>${data.viewerName}</strong> has just accepted your Non-Disclosure Agreement for:
            </p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 25px; border-left: 4px solid #8B5CF6;">
              <p style="margin: 0 0 10px; color: #475569; font-size: 14px;"><strong>Document:</strong></p>
              <p style="margin: 0 0 15px; color: #1e293b; font-size: 16px; font-weight: 600;">${data.documentTitle}</p>
              
              <p style="margin: 0 0 5px; color: #475569; font-size: 14px;"><strong>Viewer Details:</strong></p>
              <p style="margin: 0; color: #1e293b; font-size: 14px;">
                <strong>Name:</strong> ${data.viewerName}<br/>
                <strong>Email:</strong> ${data.viewerEmail}<br/>
                ${data.viewerCompany ? `<strong>Company:</strong> ${data.viewerCompany}<br/>` : ''}
                <strong>Time:</strong> ${data.acceptedAt.toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}
              </p>
            </div>

            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 0 0 25px; border: 1px solid #d1fae5;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                ✅ <strong>Legal Protection Active:</strong> This acceptance has been recorded with timestamp, IP address, and digital signature. The NDA certificate is attached to this email for your records.
              </p>
            </div>

            <div style="text-align: center; margin: 0 0 25px;">
              <a href="${data.documentUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Document Analytics
              </a>
            </div>

            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                <strong>📎 Certificate Attached:</strong> The official NDA acceptance certificate (${data.certificateId}) is attached to this email. Keep this for your legal records.
              </p>
            </div>
          </div>

          <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
            <p style="margin: 0 0 5px;">This is an automated notification from DocMetrics</p>
            <p style="margin: 0;">You can manage notification settings in your account dashboard</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `NDA-Certificate-${data.certificateId}.pdf`,
          content: certificatePdf,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log('✅ NDA acceptance notification sent to:', data.ownerEmail);
    return true;

  } catch (error) {
    console.error('❌ Failed to send NDA notification:', error);
    return false;
  }
}