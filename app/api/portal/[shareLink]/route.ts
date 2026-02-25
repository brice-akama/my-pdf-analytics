// app/api/portal/[shareLink]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

export async function GET(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const shareLink = params.shareLink;
    console.log('🔍 Portal access:', shareLink);

    const db = await dbPromise;

    const space = await db.collection('spaces').findOne({
      'publicAccess.shareLink': shareLink,
      'publicAccess.enabled': true
    });

    if (!space) {
      return NextResponse.json({ success: false, error: 'Invalid or expired link' }, { status: 404 });
    }

    if (space.publicAccess.expiresAt && new Date(space.publicAccess.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'This link has expired' }, { status: 403 });
    }

    if (space.publicAccess.viewLimit && space.publicAccess.currentViews >= space.publicAccess.viewLimit) {
      return NextResponse.json({ success: false, error: 'This link has reached its view limit' }, { status: 403 });
    }

    const spaceId = space._id.toString();

    // ✅ Fix: space_folders collection, spaceId as STRING (matches how they're saved)
    const foldersRaw = await db.collection('space_folders')
      .find({ spaceId: spaceId })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    console.log(`📁 Found ${foldersRaw.length} folders in space_folders`);

    // ✅ Fix: relaxed document query — no belongsToSpace or organizationId filter
    const documents = await db.collection('documents')
      .find({
        $or: [
          { spaceId: spaceId },
          { spaceId: space._id }
        ],
        archived: { $ne: true }
      })
      .toArray();

    console.log(`📄 Found ${documents.length} documents`);

    // ✅ Fix: handle both `folder` and `folderId` fields (upload saves as `folder`)
    const folderCountMap: Record<string, number> = {};

    const transformedDocs = documents.map(doc => {
      const folderId = doc.folderId?.toString() || doc.folder?.toString() || null;
      if (folderId) folderCountMap[folderId] = (folderCountMap[folderId] || 0) + 1;
      return {
        id: doc._id.toString(),
        name: doc.originalFilename || doc.name || 'Untitled',
        type: (doc.originalFormat || doc.mimeType || 'PDF').toUpperCase(),
        size: doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '',
        cloudinaryPdfUrl: doc.cloudinaryPdfUrl || null,
        folderId
      };
    });

    const folders = foldersRaw.map(f => ({
      id: f._id.toString(),
      name: f.name,
      parentId: f.parentFolderId?.toString() || null,
      index: f.index ?? null,
      documentCount: folderCountMap[f._id.toString()] || 0
    }));

    console.log(`✅ Portal loaded: ${transformedDocs.length} documents, ${folders.length} folders`);
    console.log('📁 Folder IDs:', folders.map(f => f.id));
    console.log('📄 Doc folderIds:', transformedDocs.map(d => d.folderId));

    return NextResponse.json({
      success: true,
      space: {
        name: space.name,
        description: space.description || '',
        allowDownloads: space.allowDownloads ?? true,
        ndaRequired: space.ndaSettings?.enabled ?? false,
        ndaDocumentUrl: space.ndaSettings?.documentUrl || null,
        branding: space.branding || {
          primaryColor: '#6366f1',
          welcomeMessage: 'Welcome to our secure document portal',
          companyName: null,
          logoUrl: null,
        },
        documents: transformedDocs,
        folders
      },
      requiresEmail: space.publicAccess.requireEmail,
      requiresPassword: space.publicAccess.requirePassword
    });

  } catch (error) {
    console.error('❌ Portal error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load portal' }, { status: 500 });
  }
}