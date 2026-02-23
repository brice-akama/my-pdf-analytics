import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;
    const db = await dbPromise;

    // Find envelope by recipient uniqueId
    const envelope = await db.collection('envelopes').findOne({
      'recipients.uniqueId': uniqueId,
    });

    if (!envelope) return NextResponse.json({ email: null });

    const ownerIdStr = envelope.ownerId?.toString();

    // Try profiles first
    const ownerProfile = await db.collection('profiles').findOne({
      $or: [
        { user_id: ownerIdStr },
        { user_id: envelope.ownerId },
        { email: envelope.ownerEmail },
      ].filter(Boolean)
    });

    if (ownerProfile?.email) {
      return NextResponse.json({ email: ownerProfile.email });
    }

    // Fallback: users collection
    if (ownerIdStr) {
      try {
        const ownerUser = await db.collection('users').findOne({
          _id: new ObjectId(ownerIdStr)
        });
        if (ownerUser?.email) return NextResponse.json({ email: ownerUser.email });
      } catch (e) {}
    }

    // Final fallback: ownerEmail stored on envelope directly
    return NextResponse.json({ email: envelope.ownerEmail || null });

  } catch (error) {
    console.error('envelope owner-info error:', error);
    return NextResponse.json({ email: null }, { status: 500 });
  }
}