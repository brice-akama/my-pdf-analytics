// app/api/envelope/[uniqueId]/message/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { sendEmail } from '@/lib/email';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;
    const { message, senderEmail } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const db = await dbPromise;

    // Find the envelope by recipient uniqueId
    // The uniqueId format is: env_xxx_recipient_0
    const envelope = await db.collection('envelopes').findOne({
      'recipients.uniqueId': uniqueId,
    });

    if (!envelope) {
      return NextResponse.json({ error: 'Envelope not found' }, { status: 404 });
    }

    // Find the specific recipient
    const recipient = envelope.recipients.find((r: any) => r.uniqueId === uniqueId);

    // Get owner profile (same pattern as signature message route)
    const ownerProfile = await db.collection('profiles').findOne({
      user_id: envelope.ownerId?.toString(),
    });

    // Fallback to ownerEmail on envelope if profile not found
    const ownerEmail = ownerProfile?.email || envelope.ownerEmail;

    if (!ownerEmail) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    // Store in same viewer_messages collection so dashboard inbox shows all messages
    await db.collection('viewer_messages').insertOne({
      shareToken: null,
      signatureId: null,
      envelopeId: envelope.envelopeId,
      envelopeUniqueId: uniqueId,
      documentId: envelope.documents?.[0]?.documentId || null,
      documentName: envelope.documents?.map((d: any) => d.filename).join(', ') || 'Envelope',
      ownerUserId: envelope.ownerId,
      senderEmail: senderEmail || 'Anonymous',
      senderName: recipient?.name || null,
      message: message.trim(),
      sentAt: new Date(),
      read: false,
      source: 'envelope',
    });

    // Same email template as signature message route
    const docNames = envelope.documents?.map((d: any) => d.filename).join(', ') || 'your envelope';

    await sendEmail({
      to: ownerEmail,
      subject: `New message about "${docNames}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">You have a new message</h2>
          <p style="color: #64748b;">A signer on your envelope sent you a message:</p>

          <div style="background: #f8fafc; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #1e293b; margin: 0; font-size: 15px;">"${message.trim()}"</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Envelope</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 13px; font-weight: 600;">${docNames}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">From</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 13px;">
                ${recipient?.name || ''} ${senderEmail ? `(${senderEmail})` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Sent</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 13px;">${new Date().toLocaleString()}</td>
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
    console.error('Envelope message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}