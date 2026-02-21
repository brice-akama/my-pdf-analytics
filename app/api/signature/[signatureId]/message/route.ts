import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const { message, senderEmail, sessionId } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const db = await dbPromise;

    const sigRequest = await db.collection('signature_requests').findOne({ uniqueId: signatureId });
    if (!sigRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const document = await db.collection('documents').findOne({ _id: sigRequest.documentId });

    // Reuse same owner lookup pattern as view message route
    const ownerProfile = await db.collection('profiles').findOne({
      user_id: document?.userId?.toString(),
    });

    if (!ownerProfile?.email) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    // Reuse same collection — viewer_messages — so your dashboard inbox shows both
    await db.collection('viewer_messages').insertOne({
      shareToken: null,
      signatureId,
      documentId: sigRequest.documentId,
      documentName: document?.originalFilename || 'Unknown',
      ownerUserId: document?.userId,
      senderEmail: senderEmail || 'Anonymous',
      senderName: sigRequest.recipient?.name || null,
      message: message.trim(),
      sessionId,
      sentAt: new Date(),
      read: false,
      source: 'signature', // ← lets you filter in dashboard if needed
    });

    // Reuse exact same email template as view message route
    await sendEmail({
      to: ownerProfile.email,
      subject: `New message about "${document?.originalFilename || 'your document'}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">You have a new message</h2>
          <p style="color: #64748b;">A signer on your document sent you a message:</p>
          
          <div style="background: #f8fafc; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #1e293b; margin: 0; font-size: 15px;">"${message.trim()}"</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Document</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 13px; font-weight: 600;">
                ${document?.originalFilename || 'Unknown'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">From</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 13px;">
                ${sigRequest.recipient?.name || ''} ${senderEmail ? `(${senderEmail})` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Sent</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 13px;">
                ${new Date().toLocaleString()}
              </td>
            </tr>
          </table>
          
          ${senderEmail ? `
            <a href="mailto:${senderEmail}" 
               style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #7c3aed, #3b82f6); 
                      color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Reply to ${senderEmail}
            </a>
          ` : ''}
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signature message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}