import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { checkAccess } from '@/lib/checkAccess';
import { ObjectId } from 'mongodb';

// ── POST — create a follow up cadence when a document is shared ──
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const body = await request.json();
    const { viewerEmail, shareToken, documentName } = body;

    if (!viewerEmail || !shareToken) {
      return NextResponse.json({ success: false });
    }

    const db = await dbPromise;

    // Check if cadence already exists for this viewer and document
    const existing = await db.collection('follow_up_cadences').findOne({
      documentId: id,
      viewerEmail,
      completed: { $ne: true },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: 'Cadence already active' });
    }

    const now = new Date();

    await db.collection('follow_up_cadences').insertOne({
      documentId: id,
      userId: access.userId,
      viewerEmail,
      shareToken,
      documentName: documentName || 'Your document',
      createdAt: now,
      sharedAt: now,
      completed: false,
      stepsFired: [],
      // Schedule: day 2, day 5 wait signal, day 7 direct question
      nextFireAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      currentStep: 1,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FollowUpCadence] POST error:', error);
    return NextResponse.json({ success: true });
  }
}

// ── DELETE — mark cadence complete when deal closes or user dismisses ──
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const { searchParams } = new URL(request.url);
    const viewerEmail = searchParams.get('viewerEmail');

    if (!viewerEmail) return NextResponse.json({ success: false });

    const db = await dbPromise;
    await db.collection('follow_up_cadences').updateOne(
      { documentId: id, viewerEmail, userId: access.userId },
      { $set: { completed: true, completedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FollowUpCadence] DELETE error:', error);
    return NextResponse.json({ success: true });
  }
}