// app/api/portal/[shareLink]/unread/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

// Same helper used by comments/route.ts — supports both old (object) and
// new (array) publicAccess formats.
async function getSpace(db: any, shareLink: string) {
  return db.collection('spaces').findOne({
    $or: [
      { publicAccess: { $elemMatch: { shareLink, enabled: true } } },
      { publicAccess: { $elemMatch: { shareLink } } },
      { 'publicAccess.shareLink': shareLink },
    ]
  });
}

// ── GET: which documents have a reply this visitor hasn't seen yet ──────────
export async function GET(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { shareLink } = params;

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ success: true, unreadDocumentIds: [] });
    }

    const db = await dbPromise;
    const space = await getSpace(db, shareLink);
    if (!space) {
      return NextResponse.json({ success: false, error: 'Invalid link' }, { status: 404 });
    }
    const spaceId = space._id.toString();

    // Every comment thread belonging to this visitor that has a reply
    const repliedComments = await db.collection('portal_comments')
      .find({ spaceId, email, reply: { $ne: null } })
      .project({ documentId: 1, repliedAt: 1 })
      .toArray();

    if (repliedComments.length === 0) {
      return NextResponse.json({ success: true, unreadDocumentIds: [] });
    }

    // This visitor's last-seen timestamp per document (if any)
    const reads = await db.collection('portal_comment_reads')
      .find({ spaceId, email })
      .project({ documentId: 1, lastSeenAt: 1 })
      .toArray();

    const lastSeenMap = new Map<string, Date>(
      reads.map((r: any) => [r.documentId, new Date(r.lastSeenAt)])
    );

    const unread = new Set<string>();
    for (const c of repliedComments) {
      const lastSeen = lastSeenMap.get(c.documentId);
      if (!lastSeen || new Date(c.repliedAt) > lastSeen) {
        unread.add(c.documentId);
      }
    }

    return NextResponse.json({ success: true, unreadDocumentIds: Array.from(unread) });

  } catch (error) {
    console.error('❌ GET unread error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}