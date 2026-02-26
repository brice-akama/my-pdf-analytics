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

    // ✅ FIX: Query using $elemMatch since publicAccess is now an array
    const space = await db.collection('spaces').findOne({
      'publicAccess': {
        $elemMatch: { shareLink: shareLink, enabled: true }
      }
    });

    if (!space) {
      return NextResponse.json({ success: false, error: 'Invalid or expired link' }, { status: 404 });
    }

    // ✅ FIX: Find the specific link config from the array
    const linkConfig = Array.isArray(space.publicAccess)
      ? space.publicAccess.find((l: any) => l.shareLink === shareLink && l.enabled !== false)
      : space.publicAccess;

    if (!linkConfig) {
      return NextResponse.json({ success: false, error: 'Invalid or expired link' }, { status: 404 });
    }

    // ✅ FIX: Check expiry and view limit on linkConfig, not space.publicAccess
    if (linkConfig.expiresAt && new Date(linkConfig.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'This link has expired' }, { status: 403 });
    }

    if (linkConfig.viewLimit && linkConfig.currentViews >= linkConfig.viewLimit) {
      return NextResponse.json({ success: false, error: 'This link has reached its view limit' }, { status: 403 });
    }

    const spaceId = space._id.toString();

    // Fetch folders
    const foldersRaw = await db.collection('space_folders')
      .find({ spaceId: spaceId })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    console.log(`📁 Found ${foldersRaw.length} folders in space_folders`);

    // Fetch documents
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

    // Build folder document count map
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
    console.log('🔒 Link security:', linkConfig.securityLevel, '| requireEmail:', linkConfig.requireEmail, '| requirePassword:', linkConfig.requirePassword);

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
      // ✅ FIX: Read from linkConfig not space.publicAccess
      requiresEmail: linkConfig.requireEmail ?? true,
      requiresPassword: linkConfig.requirePassword ?? false
    });

  } catch (error) {
    console.error('❌ Portal error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load portal' }, { status: 500 });
  }
}