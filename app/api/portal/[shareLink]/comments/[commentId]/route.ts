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

    // ── Notify buyer that their question has been answered ────────
    // Closes the conversation loop — buyer asked a question inside
    // the portal, rep replied inside DocMetrics, buyer gets an email
    // so they know to go back and read the answer. Silent failure.
    (async () => {
      try {
        const comment = await db.collection('portal_comments').findOne({
          _id: new ObjectId(commentId),
        });
        if (!comment?.visitorEmail || comment.visitorEmail === 'Anonymous') return;

        const spaceName = space.name || 'Your space';

        // Simple transactional email to buyer — not a marketing email,
        // just "your question was answered, here's what they said"
        const { sendDealInsightEmail } =
          await import('@/lib/documentNotifications');
        sendDealInsightEmail({
          ownerEmail: comment.visitorEmail,
          ownerName: null,
          viewerEmail: user.email || 'The team',
          documentName: spaceName,
          documentId: space._id.toString(),
          slowestPage: 1,
          slowestPageTime: 0,
          avgPageTime: 0,
          skippedPages: [],
          totalPages: 1,
          trigger: 'session_end',
          narrative: `Your question in "${spaceName}" has been answered: "${reply.trim().slice(0, 200)}${reply.trim().length > 200 ? '...' : ''}". You can view the full reply by returning to the space.`,
        }).catch(err =>
          console.error('[SpaceComment] Buyer reply notification silent fail:', err)
        );
      } catch (err) {
        console.error('[SpaceComment] Reply notification outer silent fail:', err);
      }
    })();

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