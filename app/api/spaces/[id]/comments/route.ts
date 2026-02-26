// app/api/spaces/[id]/comments/route.ts
// Owner-side: fetch ALL comments for this space, grouped with link attribution
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ── GET: owner fetches all comments for their space ───────────────────────────
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;

    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

    const comments = await db.collection('portal_comments')
      .find({ spaceId })
      .sort({ createdAt: -1 })
      .toArray();

    // Get all share link labels for attribution
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) });
    const linkMap: Record<string, string> = {};
    if (space?.publicAccess) {
      const links = Array.isArray(space.publicAccess)
        ? space.publicAccess
        : [space.publicAccess];
      links.forEach((l: any) => {
        if (l.shareLink) {
          linkMap[l.shareLink] = l.label || `Link ${l.shareLink.slice(0, 8)}…`;
        }
      });
    }

    const transformed = comments.map((c: any) => ({
      id: c._id.toString(),
      documentId: c.documentId,
      documentName: c.documentName,
      email: c.email,

      // ── Attribution: owner sees WHICH link this investor used ─────────────
      shareLink: c.shareLink || null,
      linkLabel: c.linkLabel || (c.shareLink ? linkMap[c.shareLink] : null) || 'Direct',

      message: c.message,
      reply: c.reply || null,
      repliedAt: c.repliedAt || null,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ success: true, comments: transformed });

  } catch (error) {
    console.error('❌ Get space comments error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// ── PATCH: owner replies to a comment (from spaces page Q&A tab) ──────────────
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;

    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { commentId, reply } = await request.json();

    if (!commentId || !reply?.trim()) {
      return NextResponse.json({ error: 'commentId and reply are required' }, { status: 400 });
    }

    const db = await dbPromise;

    // Verify space ownership before allowing reply
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId),
      $or: [
        { userId: user.id },
        { createdBy: user.id },
        { members: { $elemMatch: { email: user.email, role: { $in: ['owner', 'admin'] } } } }
      ]
    });

    if (!space) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await db.collection('portal_comments').updateOne(
      { _id: new ObjectId(commentId), spaceId },
      { $set: { reply: reply.trim(), repliedAt: new Date(), updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Reply sent' });

  } catch (error) {
    console.error('❌ Reply error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reply' }, { status: 500 });
  }
}