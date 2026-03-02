// app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    console.log('✅ Authenticated user:', user.id);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = parseInt(searchParams.get('sortOrder') || '-1');
    const spaceId = searchParams.get('spaceId');

    let query: any;

    // =========================================================
    // SPACE DOCUMENTS — role + folder-permission based access
    // =========================================================
    if (spaceId) {
      console.log('🔍 Fetching documents for space:', spaceId);

      const space = await db.collection('spaces').findOne({
        _id: new ObjectId(spaceId)
      });

      if (!space) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 });
      }

      const isOwner = space.userId === user.id;
      const spaceMember = space.members?.find(
        (m: any) => m.email === user.email || m.userId === user.id
      );

      if (!isOwner && !spaceMember) {
        return NextResponse.json({ error: 'Access denied to this space' }, { status: 403 });
      }

      const userRole = isOwner ? 'owner' : spaceMember?.role || 'viewer';
      console.log('👤 User role in space:', userRole);

      const showArchived = searchParams.get('archived') === 'true';
      query = {
        spaceId,
        belongsToSpace: true,
        archived: showArchived ? true : { $ne: true },
      };

      let documents = await db.collection('documents')
        .find(query, { projection: { fileData: 0 } })
        .sort({ [sortBy]: sortOrder } as any)
        .toArray();

      console.log(`📄 Total documents in space: ${documents.length}`);

      let folderPermissions: any[] = [];

      if (['owner', 'admin', 'editor'].includes(userRole)) {
        console.log('✅ Privileged role — showing all space documents');
      } else {
        console.log('👁️ Viewer — checking folder permissions');

        folderPermissions = await db.collection('folder_permissions')
          .find({
            spaceId,
            grantedTo: user.email.toLowerCase(),
            isActive: true,
          })
          .toArray();

        console.log(`🔐 Found ${folderPermissions.length} folder permissions`);

        if (folderPermissions.length === 0) {
          documents = [];
        } else {
          const allowedFolderIds = folderPermissions
            .filter(p => !p.expiresAt || new Date(p.expiresAt) >= new Date())
            .map(p => p.folderId);

          documents = documents.filter(doc => {
            if (!doc.folder) return false;
            return allowedFolderIds.includes(doc.folder);
          });
        }

        console.log(`📊 After folder filtering: ${documents.length} documents visible`);
      }

      const paginatedDocuments = documents.slice((page - 1) * limit, page * limit);

      const transformedDocuments = paginatedDocuments.map(doc => {
        let canDownload = true;
        if (userRole === 'viewer' && doc.folder) {
          const folderPerm = folderPermissions.find(p => p.folderId === doc.folder);
          if (folderPerm) canDownload = folderPerm.canDownload ?? true;
        }
        return {
          id: doc._id.toString(),
          name: doc.originalFilename,
          type: doc.originalFormat || doc.mimeType,
          size: `${(doc.size / 1024).toFixed(2)} KB`,
          views: doc.tracking?.views || 0,
          downloads: doc.tracking?.downloads || 0,
          lastUpdated: new Date(doc.updatedAt).toLocaleDateString(),
          folderId: doc.folder || null,
          folder: doc.folder || null,
          cloudinaryPdfUrl: doc.cloudinaryPdfUrl,
          canDownload,
          ...doc,
          _id: doc._id.toString(),
        };
      });

      return NextResponse.json({
        success: true,
        documents: transformedDocuments,
        totalDocuments: documents.length,
        currentPage: page,
        totalPages: Math.ceil(documents.length / limit),
      });

    } else {
      // =========================================================
      // PERSONAL DOCUMENTS — strict per-user privacy
      // Every user sees ONLY their own uploads.
      // Sharing is the only way to grant access to others.
      // =========================================================
      console.log('🔒 Fetching personal documents for user:', user.id);

      const showArchived =
        searchParams.get('deleted') === 'true' ||
        searchParams.get('archived') === 'true';
      const showTemplates = searchParams.get('templates') === 'true';
      const searchQuery = searchParams.get('search') || '';

      // HARD LOCK: userId must match — no org fallback, no role bypass
      query = {
        userId: user.id,
        $or: [
          { belongsToSpace: { $exists: false } },
          { belongsToSpace: false },
        ],
      };

      if (showArchived) {
        query.archived = true;
      } else {
        query.archived = { $ne: true };
      }

      if (showTemplates) {
        query.isTemplate = true;
      }

      if (searchQuery) {
        query.$and = [
          ...(query.$and || []),
          {
            $or: [
              { originalFilename: { $regex: searchQuery, $options: 'i' } },
              { filename: { $regex: searchQuery, $options: 'i' } },
              { tags: { $regex: searchQuery, $options: 'i' } },
            ],
          },
        ];
      }

      const documents = await db.collection('documents')
        .find(query, { projection: { fileData: 0 } })
        .sort({ [sortBy]: sortOrder } as any)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      const transformedDocuments = documents.map(doc => ({
        id: doc._id.toString(),
        name: doc.originalFilename,
        type: doc.originalFormat || doc.mimeType,
        size: `${(doc.size / 1024).toFixed(2)} KB`,
        views: doc.tracking?.views || 0,
        downloads: doc.tracking?.downloads || 0,
        lastUpdated: new Date(doc.updatedAt).toLocaleDateString(),
        folderId: doc.folder || null,
        folder: doc.folder || null,
        cloudinaryPdfUrl: doc.cloudinaryPdfUrl,
        ...doc,
        _id: doc._id.toString(),
      }));

      const totalDocuments = await db.collection('documents').countDocuments(query);

      return NextResponse.json({
        success: true,
        documents: transformedDocuments,
        totalDocuments,
        currentPage: page,
        totalPages: Math.ceil(totalDocuments / limit),
      });
    }

  } catch (error) {
    console.error('❌ Fetch documents error:', error);
    return NextResponse.json({
      error: 'Failed to fetch documents',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}