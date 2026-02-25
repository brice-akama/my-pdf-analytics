// app/api/spaces/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ── GET: fetch all comments for a space (owner view) ──────────────────────────
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

    // Verify user has access to this space
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(params.id) });
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

    const isOwner = space.userId === user.id;
    const isMember = space.members?.some((m: any) => m.email === user.email);
    if (!isOwner && !isMember) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId'); // optional filter

    const query: any = { spaceId: params.id };
    if (documentId) query.documentId = documentId;

    const comments = await db.collection('portal_comments')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const transformed = comments.map((c: any) => ({
      id: c._id.toString(),
      documentId: c.documentId,
      documentName: c.documentName,
      email: c.email,
      message: c.message,
      reply: c.reply || null,
      repliedAt: c.repliedAt || null,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ success: true, comments: transformed });
  } catch (error) {
    console.error('❌ Get space comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// ── PATCH: owner replies to a comment ─────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(params.id) });
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

    const isOwner = space.userId === user.id;
    const isAdmin = space.members?.some((m: any) => m.email === user.email && ['admin', 'owner'].includes(m.role));
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Only owners/admins can reply' }, { status: 403 });

    const { commentId, reply } = await request.json();
    if (!commentId || !reply?.trim()) {
      return NextResponse.json({ error: 'commentId and reply are required' }, { status: 400 });
    }

    await db.collection('portal_comments').updateOne(
      { _id: new ObjectId(commentId), spaceId: params.id },
      { $set: { reply: reply.trim(), repliedAt: new Date(), updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Reply comment error:', error);
    return NextResponse.json({ error: 'Failed to reply' }, { status: 500 });
  }
}