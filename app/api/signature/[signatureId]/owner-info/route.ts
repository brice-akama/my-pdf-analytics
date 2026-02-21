import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    const sigRequest = await db.collection('signature_requests').findOne({ uniqueId: signatureId });
    if (!sigRequest) return NextResponse.json({ email: null });

    // ✅ THE FIX: documentId is a string, convert to ObjectId
    let docObjectId: ObjectId;
    try {
      docObjectId = new ObjectId(sigRequest.documentId.toString());
    } catch (e) {
      console.error('❌ Invalid documentId format:', sigRequest.documentId);
      return NextResponse.json({ email: null });
    }

    const document = await db.collection('documents').findOne({ _id: docObjectId });
    console.log('🔍 document found:', !!document);
    console.log('🔍 document keys:', document ? Object.keys(document) : 'NULL');
    console.log('🔍 document userId:', document?.userId, typeof document?.userId);

    if (!document) return NextResponse.json({ email: null });

    // Try profiles collection first
    const userIdStr = document.userId?.toString();
    console.log('🔍 Looking up profile with user_id:', userIdStr);

    const ownerProfile = await db.collection('profiles').findOne({
      $or: [
        { user_id: userIdStr },
        { user_id: document.userId },
        { email: document.ownerEmail },
      ].filter(Boolean)
    });

    console.log('🔍 ownerProfile found:', !!ownerProfile, '| email:', ownerProfile?.email);

    if (ownerProfile?.email) {
      return NextResponse.json({ email: ownerProfile.email });
    }

    // Fallback: try users collection directly
    if (userIdStr) {
      try {
        const ownerUser = await db.collection('users').findOne({
          _id: new ObjectId(userIdStr)
        });
        console.log('🔍 ownerUser found:', !!ownerUser, '| email:', ownerUser?.email);
        if (ownerUser?.email) {
          return NextResponse.json({ email: ownerUser.email });
        }
      } catch (e) {
        console.log('❌ users lookup failed:', e);
      }
    }

    return NextResponse.json({ email: null });
  } catch (error) {
    console.error('owner-info error:', error);
    return NextResponse.json({ error: 'Failed', details: String(error) }, { status: 500 });
  }
}