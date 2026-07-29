// app/api/portal/[shareLink]/comments/mark-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

async function getSpace(db: any, shareLink: string) {
  return db.collection('spaces').findOne({
    $or: [
      { publicAccess: { $elemMatch: { shareLink, enabled: true } } },
      { publicAccess: { $elemMatch: { shareLink } } },
      { 'publicAccess.shareLink': shareLink },
    ]
  });
}

// ── POST: stamp this visitor's last-seen time for a document's thread ───────
export async function POST(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { shareLink } = params;

    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const documentId = body.documentId;

    if (!email || !documentId) {
      return NextResponse.json({ success: false, error: 'email and documentId required' }, { status: 400 });
    }

    const db = await dbPromise;
    const space = await getSpace(db, shareLink);
    if (!space) {
      return NextResponse.json({ success: false, error: 'Invalid link' }, { status: 404 });
    }
    const spaceId = space._id.toString();

    await db.collection('portal_comment_reads').updateOne(
      { spaceId, email, documentId },
      { $set: { spaceId, email, documentId, lastSeenAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Mark read error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}