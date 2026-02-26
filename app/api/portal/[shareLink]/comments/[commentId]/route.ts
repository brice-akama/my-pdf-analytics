// app/api/portal/[shareLink]/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ── Helper: find space supporting BOTH old and new publicAccess format ────────
async function getSpaceForOwner(db: any, shareLink: string, userId: string) {
  return db.collection('spaces').findOne({
    $and: [
      {
        $or: [
          { publicAccess: { $elemMatch: { shareLink } } },          // array format
          { 'publicAccess.shareLink': shareLink },                   // object format
        ]
      },
      {
        $or: [
          { userId },
          { createdBy: userId },
          { members: { $elemMatch: { userId, role: { $in: ['owner', 'admin'] } } } }
        ]
      }
    ]
  });
}

// ── PATCH: owner replies to a comment ────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  context: { params: { shareLink: string; commentId: string } | Promise<{ shareLink: string; commentId: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { shareLink, commentId } = params;

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const space = await getSpaceForOwner(db, shareLink, user.id);

    if (!space) {
      return NextResponse.json({ success: false, error: 'Not authorized to reply' }, { status: 403 });
    }

    const { reply } = await request.json();
    if (!reply?.trim()) {
      return NextResponse.json({ success: false, error: 'Reply cannot be empty' }, { status: 400 });
    }

    const result = await db.collection('portal_comments').updateOne(
      { _id: new ObjectId(commentId), spaceId: space._id.toString() },
      { $set: { reply: reply.trim(), repliedAt: new Date(), updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Reply sent' });

  } catch (error) {
    console.error('❌ Reply comment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reply' }, { status: 500 });
  }
}

// ── DELETE: owner deletes a comment ──────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  context: { params: { shareLink: string; commentId: string } | Promise<{ shareLink: string; commentId: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { shareLink, commentId } = params;

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const space = await getSpaceForOwner(db, shareLink, user.id);

    if (!space) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    await db.collection('portal_comments').deleteOne({
      _id: new ObjectId(commentId),
      spaceId: space._id.toString()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}