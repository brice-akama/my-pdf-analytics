import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    
    // Generate unique signature token
    const signatureToken = crypto.randomBytes(32).toString('hex');
    
    const db = await dbPromise;
    
    // Get document info
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(params.id),
      userId: user.id
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Create signature request
    const signatureRequest = {
      documentId: new ObjectId(params.id),
      userId: user.id,
      documentName: document.filename,
      signatureToken,
      recipient: {
        email: requestData.recipientEmail,
        name: requestData.recipientName,
      },
      message: requestData.message || '',
      dueDate: requestData.dueDate ? new Date(requestData.dueDate) : null,
      status: 'pending', // pending, viewed, signed, declined
      createdAt: new Date(),
      viewedAt: null,
      signedAt: null,
    };

    await db.collection('signature_requests').insertOne(signatureRequest);

    // TODO: Send email to recipient
    // In production, you'd use a service like SendGrid or AWS SES
    console.log('📧 Signature request email would be sent to:', requestData.recipientEmail);
    console.log('Signature link:', `${process.env.NEXT_PUBLIC_BASE_URL}/sign/${signatureToken}`);

    return NextResponse.json({
      success: true,
      message: 'Signature request sent successfully',
      signatureToken,
    });

  } catch (error) {
    console.error('Create signature request error:', error);
    return NextResponse.json({ error: 'Failed to send signature request' }, { status: 500 });
  }
}