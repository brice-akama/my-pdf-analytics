// app/api/portal/[shareLink]/comments/route.ts
 
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

// ── Helper: find space supporting BOTH old (object) and new (array) publicAccess ──
async function getSpace(db: any, shareLink: string) {
  return db.collection('spaces').findOne({
    $or: [
      { publicAccess: { $elemMatch: { shareLink, enabled: true } } },  // new array
      { publicAccess: { $elemMatch: { shareLink } } },                  // new array, no enabled check
      { 'publicAccess.shareLink': shareLink },                          // old object
    ]
  });
}

// ── GET: fetch comments for a document ───────────────────────────────────────
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
    const documentId   = searchParams.get('documentId');
    const visitorEmail = searchParams.get('email');

    const query: any = { spaceId };

    // Privacy: if email provided, only return that visitor's comments
    // If no email (anonymous), return all comments for this link
    if (visitorEmail && visitorEmail.trim()) {
      query.email = visitorEmail.trim().toLowerCase();
    } else {
      // Scope to this link so anonymous users don't see all links' comments
      query.shareLink = shareLink;
    }

    if (documentId) query.documentId = documentId;

    const comments = await db.collection('portal_comments')
      .find(query)
      .sort({ createdAt: 1 })
      .toArray();

    const transformed = comments.map((c: any) => ({
      id:           c._id.toString(),
      documentId:   c.documentId,
      documentName: c.documentName,
      author:       c.email,
      message:      c.message,
      reply:        c.reply || null,
      repliedAt:    c.repliedAt || null,
      createdAt:    c.createdAt,
    }));

    return NextResponse.json({ success: true, comments: transformed });

  } catch (error) {
    console.error('❌ GET comments error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// ── POST: visitor submits a comment ──────────────────────────────────────────
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

    const body = await request.json();
    const { documentId, documentName, message, email } = body;

    // ── Only require message — email can be empty for anonymous portals ──────
    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const spaceId = space._id.toString();

    // ── Find the label for this link (e.g. "Sequoia – Series A") ────────────
    const publicAccessList = Array.isArray(space.publicAccess)
      ? space.publicAccess
      : space.publicAccess ? [space.publicAccess] : [];

    const thisLink = publicAccessList.find((pa: any) => pa.shareLink === shareLink);
    const linkLabel = thisLink?.label || null;

    const normalizedEmail = email?.trim().toLowerCase() || 'anonymous';

    const newComment = {
      spaceId,
      spaceOwnerId: space.userId || space.ownerId || null,
      shareLink,
      linkLabel,
      documentId:   documentId || 'general',
      documentName: documentName || 'General Question',
      email:        normalizedEmail,
      message:      message.trim(),
      reply:        null,
      repliedAt:    null,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    };

    const result = await db.collection('portal_comments').insertOne(newComment);

    console.log(`💬 Comment from ${normalizedEmail} via "${linkLabel || shareLink}"`);

    return NextResponse.json({
      success: true,
      comment: {
        id:           result.insertedId.toString(),
        documentId:   newComment.documentId,
        documentName: newComment.documentName,
        author:       normalizedEmail,
        message:      newComment.message,
        reply:        null,
        repliedAt:    null,
        createdAt:    newComment.createdAt,
      }
    });

  } catch (error) {
    console.error('❌ POST comment error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}