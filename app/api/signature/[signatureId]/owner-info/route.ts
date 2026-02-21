import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    const sigRequest = await db.collection('signature_requests').findOne({ uniqueId: signatureId });
    if (!sigRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const document = await db.collection('documents').findOne({ _id: sigRequest.documentId });
    console.log('🔍 Owner lookup:', {
  rawUserId: document?.userId,
  type: typeof document?.userId,
  asString: document?.userId?.toString(),
});
    const ownerProfile = await db.collection('profiles').findOne({
  $or: [
    { user_id: document.userId?.toString() },
    { user_id: document.userId },
  ]
});

    return NextResponse.json({ email: ownerProfile?.email || null });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}