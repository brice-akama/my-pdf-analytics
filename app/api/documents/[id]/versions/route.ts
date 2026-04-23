//app/api/documents/[id]/versions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { checkAccess } from '@/lib/checkAccess';
import { hasFeature } from '@/lib/planLimits';
import { ObjectId } from 'mongodb';

// ── Shared plan gate response ─────────────────────────────────────
function versionHistoryGated(plan: string) {
  return NextResponse.json(
    {
      error:   'VERSION_HISTORY_UNAVAILABLE',
      message: 'Version history is available on Pro and Business plans.',
      plan,
    },
    { status: 403 }
  )
}

// ── GET - Fetch all versions ──────────────────────────────────────
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const access = await checkAccess(request)
    if (!access.ok) return access.response

    if (!hasFeature(access.plan, 'versionHistory')) {
      return versionHistoryGated(access.plan)
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

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

    const versions = await db
      .collection('documentVersions')
      .find({ documentId })
      .sort({ createdAt: -1 })
      .toArray();

    const versionsWithUsers = await Promise.all(
      versions.map(async (version) => {
        const uploader  = await db.collection('profiles').findOne({ user_id: version.uploadedBy });
        const avatarUrl = uploader?.avatarUrl || uploader?.avatar_url || uploader?.profile_image || null;

        return {
          _id:                  version._id.toString(),
          version:              version.version,
          filename:             version.filename,
          size:                 version.size,
          numPages:             version.numPages,
          cloudinaryPdfUrl:     version.cloudinaryPdfUrl,
          cloudinaryOriginalUrl: version.cloudinaryOriginalUrl,
          createdAt:            version.createdAt,
          uploadedBy:           version.uploadedBy,
          uploaderName:         uploader?.full_name || uploader?.name || 'Unknown',
          uploaderEmail:        uploader?.email || version.uploadedBy,
          uploaderAvatar:       avatarUrl,
          changeLog:            version.changeLog || null,
          expiryDate:           version.expiryDate || null,
          expiryReason:         version.expiryReason || null,
          analytics: {
            views:     version.tracking?.views     || 0,
            downloads: version.tracking?.downloads || 0,
          },
        };
      })
    );

    const currentUploader  = await db.collection('profiles').findOne({ user_id: document.userId });
    const currentAvatarUrl = currentUploader?.avatarUrl || currentUploader?.avatar_url || currentUploader?.profile_image || null;

    const currentVersion = {
      _id:                  document._id.toString(),
      version:              document.version || versions.length + 1,
      filename:             document.originalFilename || document.filename,
      size:                 document.size,
      numPages:             document.numPages,
      cloudinaryPdfUrl:     document.cloudinaryPdfUrl,
      cloudinaryOriginalUrl: document.cloudinaryOriginalUrl,
      createdAt:            document.updatedAt || document.createdAt,
      uploadedBy:           document.userId,
      uploaderName:         currentUploader?.full_name || currentUploader?.name || 'Unknown',
      uploaderEmail:        currentUploader?.email || document.userId,
      uploaderAvatar:       currentAvatarUrl,
      isCurrent:            true,
      expiryDate:           document.expiryDate  || null,
      expiryReason:         document.expiryReason || null,
      analytics: {
        views:     document.tracking?.views     || 0,
        downloads: document.tracking?.downloads || 0,
      },
    };

    return NextResponse.json({
      success: true,
      currentVersion,
      versions: versionsWithUsers,
      totalVersions: versions.length + 1,
      document: {
        _id:            document._id.toString(),
        filename:       document.originalFilename || document.filename,
        organizationId: document.organizationId,
      },
    });

  } catch (error) {
    console.error('❌ Fetch versions error:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

// ── POST - Restore a specific version ────────────────────────────
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const access = await checkAccess(request)
    if (!access.ok) return access.response

    if (!hasFeature(access.plan, 'versionHistory')) {
      return versionHistoryGated(access.plan)
    }

    const body = await request.json();
    const { versionId, changeLog } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID required' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId      = new ObjectId(id);
    const versionObjectId = new ObjectId(versionId);

    const currentDocument = await db.collection('documents').findOne({ _id: documentId });
    if (!currentDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const profile        = await db.collection('profiles').findOne({ user_id: access.userId });
    const organizationId = profile?.organization_id || access.userId;

    const hasAccess =
      currentDocument.userId === access.userId ||
      currentDocument.organizationId === organizationId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const versionToRestore = await db.collection('documentVersions').findOne({
      _id: versionObjectId,
      documentId,
    });

    if (!versionToRestore) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Save current as snapshot before restoring
    await db.collection('documentVersions').insertOne({
      documentId,
      version:              currentDocument.version || 1,
      filename:             currentDocument.originalFilename || currentDocument.filename,
      originalFormat:       currentDocument.originalFormat,
      mimeType:             currentDocument.mimeType,
      size:                 currentDocument.size,
      pdfSize:              currentDocument.pdfSize,
      numPages:             currentDocument.numPages,
      cloudinaryPdfUrl:     currentDocument.cloudinaryPdfUrl,
      cloudinaryOriginalUrl: currentDocument.cloudinaryOriginalUrl,
      extractedText:        currentDocument.extractedText,
      analytics:            currentDocument.analytics,
      tracking:             currentDocument.tracking,
      uploadedBy:           currentDocument.userId,
      createdAt:            new Date(),
      changeLog:            `Auto-saved before restoring version ${versionToRestore.version}`,
    });

    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $set: {
          version:              (currentDocument.version || 1) + 1,
          originalFilename:     versionToRestore.filename,
          originalFormat:       versionToRestore.originalFormat,
          mimeType:             versionToRestore.mimeType,
          size:                 versionToRestore.size,
          pdfSize:              versionToRestore.pdfSize,
          numPages:             versionToRestore.numPages,
          cloudinaryPdfUrl:     versionToRestore.cloudinaryPdfUrl,
          cloudinaryOriginalUrl: versionToRestore.cloudinaryOriginalUrl,
          extractedText:        versionToRestore.extractedText,
          analytics:            versionToRestore.analytics,
          updatedAt:            new Date(),
          lastRestoredFrom:     versionToRestore.version,
          lastRestoredBy:       access.userId,
          lastRestoredAt:       new Date(),
        }
      }
    );

    await db.collection('analytics_logs').insertOne({
      documentId: id,
      action:          'version_restored',
      userId:          access.userId,
      restoredVersion: versionToRestore.version,
      changeLog:       changeLog || `Restored version ${versionToRestore.version}`,
      timestamp:       new Date(),
    });

    return NextResponse.json({
      success:       true,
      message:       `Version ${versionToRestore.version} restored successfully`,
      newVersion:    (currentDocument.version || 1) + 1,
      restoredFrom:  versionToRestore.version,
    });

  } catch (error) {
    console.error('❌ Restore version error:', error);
    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
  }
}

// ── DELETE - Delete a specific version ───────────────────────────
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const access = await checkAccess(request)
    if (!access.ok) return access.response

    if (!hasFeature(access.plan, 'versionHistory')) {
      return versionHistoryGated(access.plan)
    }

    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');

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

    const result = await db.collection('documentVersions').deleteOne({
      _id: versionObjectId,
      documentId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    await db.collection('analytics_logs').insertOne({
      documentId: id,
      action:           'version_deleted',
      userId:           access.userId,
      deletedVersionId: versionId,
      timestamp:        new Date(),
    });

    return NextResponse.json({ success: true, message: 'Version deleted successfully' });

  } catch (error) {
    console.error('❌ Delete version error:', error);
    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 });
  }
}