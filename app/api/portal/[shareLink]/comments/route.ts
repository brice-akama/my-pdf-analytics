// app/api/portal/[shareLink]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';

// ── Helper: verify share link is valid ────────────────────────────────────────
async function getSpace(db: any, shareLink: string) {
  return db.collection('spaces').findOne({
    'publicAccess.shareLink': shareLink,
    'publicAccess.enabled': true
  });
}

// ── GET: fetch comments for a document (or all general comments) ──────────────
export async function GET(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { shareLink } = params;

    const db = await dbPromise;
    const space = await getSpace(db, shareLink);
    if (!space) {
      return NextResponse.json({ success: false, error: 'Invalid link' }, { status: 404 });
    }

    const spaceId = space._id.toString();
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    const query: any = { spaceId };
    if (documentId) query.documentId = documentId;

    const comments = await db.collection('portal_comments')
      .find(query)
      .sort({ createdAt: 1 })
      .toArray();

    const transformed = comments.map((c: any) => ({
      id: c._id.toString(),
      documentId: c.documentId,
      documentName: c.documentName,
      author: c.email,
      message: c.message,
      createdAt: c.createdAt,
      reply: c.reply || null,
      repliedAt: c.repliedAt || null,
    }));

    return NextResponse.json({ success: true, comments: transformed });

  } catch (error) {
    console.error('❌ Get comments error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// ── POST: submit a new comment ────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { shareLink } = params;

    const db = await dbPromise;
    const space = await getSpace(db, shareLink);
    if (!space) {
      return NextResponse.json({ success: false, error: 'Invalid link' }, { status: 404 });
    }

    const spaceId = space._id.toString();
    const body = await request.json();
    const { documentId, documentName, message, email } = body;

    if (!message?.trim() || !email?.trim()) {
      return NextResponse.json({ success: false, error: 'Message and email are required' }, { status: 400 });
    }

    const comment = {
      spaceId,
      spaceOwnerId: space.userId,
      documentId: documentId || 'general',
      documentName: documentName || 'General Question',
      email: email.trim().toLowerCase(),
      message: message.trim(),
      reply: null,
      repliedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('portal_comments').insertOne(comment);

    console.log(`💬 New portal comment from ${email} on doc ${documentId} in space ${spaceId}`);

    return NextResponse.json({
      success: true,
      comment: {
        id: result.insertedId.toString(),
        ...comment,
        author: email,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Post comment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to post comment' }, { status: 500 });
  }
}