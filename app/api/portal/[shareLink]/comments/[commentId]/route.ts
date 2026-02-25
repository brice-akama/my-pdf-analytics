// app/api/portal/[shareLink]/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ── PATCH: owner replies to a comment ─────────────────────────────────────────
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

    // Verify this user owns the space
    const space = await db.collection('spaces').findOne({
      'publicAccess.shareLink': shareLink,
      userId: user.id
    });

    if (!space) {
      return NextResponse.json({ success: false, error: 'Not authorized to reply' }, { status: 403 });
    }

    const { reply } = await request.json();
    if (!reply?.trim()) {
      return NextResponse.json({ success: false, error: 'Reply cannot be empty' }, { status: 400 });
    }

    await db.collection('portal_comments').updateOne(
      { _id: new ObjectId(commentId), spaceId: space._id.toString() },
      { $set: { reply: reply.trim(), repliedAt: new Date(), updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, message: 'Reply sent' });

  } catch (error) {
    console.error('❌ Reply comment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reply' }, { status: 500 });
  }
}

// ── DELETE: owner deletes a comment ───────────────────────────────────────────
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

    const space = await db.collection('spaces').findOne({
      'publicAccess.shareLink': shareLink,
      userId: user.id
    });

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