import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { checkAccess } from '@/lib/checkAccess';
import { hasFeature } from '@/lib/planLimits';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // ── Auth + plan ───────────────────────────────────────────────
    const access = await checkAccess(request)
    if (!access.ok) return access.response

    // ── Version history requires Pro or Business ──────────────────
    if (!hasFeature(access.plan, 'versionHistory')) {
      return NextResponse.json(
        {
          error:   'VERSION_HISTORY_UNAVAILABLE',
          message: 'Version history is available on Pro and Business plans.',
          plan:    access.plan,
        },
        { status: 403 }
      )
    }

    const body = await request.json();
    const { versionId, changeLog } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID required' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId      = new ObjectId(id);
    const versionObjectId = new ObjectId(versionId);

    const document = await db.collection('documents').findOne({ _id: documentId });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const profile        = await db.collection('profiles').findOne({ user_id: access.userId });
    const organizationId = profile?.organization_id || access.userId;

    const hasAccess =
      document.userId === access.userId ||
      document.organizationId === organizationId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await db.collection('documentVersions').updateOne(
      { _id: versionObjectId, documentId },
      {
        $set: {
          changeLog:     changeLog || null,
          noteUpdatedAt: new Date(),
          noteUpdatedBy: access.userId,
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Note updated successfully' });

  } catch (error) {
    console.error('❌ Update note error:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}