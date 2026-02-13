import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { versionId, changeLog } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID required' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);
    const versionObjectId = new ObjectId(versionId);

    // ✅ Verify document access
    const document = await db.collection('documents').findOne({
      _id: documentId,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || user.id;

    const hasAccess = 
      document.userId === user.id || 
      document.organizationId === organizationId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ✅ Update the note
    const result = await db.collection('documentVersions').updateOne(
      { _id: versionObjectId, documentId: documentId },
      {
        $set: {
          changeLog: changeLog || null,
          noteUpdatedAt: new Date(),
          noteUpdatedBy: user.id
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Note updated successfully'
    });

  } catch (error) {
    console.error('❌ Update note error:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}
