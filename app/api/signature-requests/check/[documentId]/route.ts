// app/api/signature-requests/check/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    console.log('🔍 [CHECK SIGNATURE] Checking signature requests for document:', documentId);
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Check if signature requests exist for this document
    const signatureRequests = await db.collection('signature_requests')
      .find({ 
        documentId: documentId,
        ownerId: user.id // Only show if user owns the document
      })
      .toArray();

    const hasSentRequest = signatureRequests.length > 0;

    if (!hasSentRequest) {
      console.log('📋 [CHECK SIGNATURE] No signature requests found');
      return NextResponse.json({
        success: true,
        hasSentRequest: false,
        recipients: [],
        signatureFields: [],
      });
    }

    console.log(`✅ [CHECK SIGNATURE] Found ${signatureRequests.length} signature requests`);

    // Get unique recipients and their status
    const recipients = signatureRequests.map(req => ({
      name: req.recipient.name,
      email: req.recipient.email,
      role: req.recipient.role,
      status: req.status,
      signedAt: req.signedAt,
      viewedAt: req.viewedAt,
      recipientIndex: req.recipientIndex,
      uniqueId: req.uniqueId,
    }));

    // Get signature fields from the first request (they should all have the same fields)
    const signatureFields = signatureRequests[0]?.signatureFields || [];

    return NextResponse.json({
      success: true,
      hasSentRequest: true,
      recipients,
      signatureFields,
      viewMode: signatureRequests[0]?.viewMode || 'isolated',
      signingOrder: signatureRequests[0]?.signingOrder || 'any',
    });

  } catch (error) {
    console.error('❌ [CHECK SIGNATURE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check signature requests' },
      { status: 500 }
    );
  }
}