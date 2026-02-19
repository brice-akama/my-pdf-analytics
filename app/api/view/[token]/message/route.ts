import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { message, senderEmail, sessionId } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const db = await dbPromise;

    // Find the share to get document + owner
    const share = await db.collection('shares').findOne({ shareToken: token });
    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const document = await db.collection('documents').findOne({ 
      _id: share.documentId 
    });

    const ownerProfile = await db.collection('profiles').findOne({ 
      user_id: share.userId || document?.userId 
    });

    if (!ownerProfile?.email) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    // Log the message
    await db.collection('viewer_messages').insertOne({
      shareToken: token,
      documentId: share.documentId,
      documentName: document?.originalFilename || 'Unknown',
      ownerUserId: share.userId || document?.userId,
      senderEmail: senderEmail || 'Anonymous',
      message: message.trim(),
      sessionId,
      sentAt: new Date(),
      read: false,
    });

    // Send email to the document owner
    await sendEmail({
      to: ownerProfile.email,
      subject: `New message about "${document?.originalFilename || 'your document'}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">You have a new message</h2>
          <p style="color: #64748b;">Someone viewing your document sent you a message:</p>
          
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
                ${senderEmail || 'Anonymous viewer'}
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
    console.error('Message send error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}