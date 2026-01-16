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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = parseInt(searchParams.get('sortOrder') || '-1');
    const spaceId = searchParams.get('spaceId');

    const db = await dbPromise;

    let query: any;
    
    if (spaceId) {
      console.log('🔍 Fetching documents for space:', spaceId);
      
      // ✅ STEP 1: Check user's role in the space
      const space = await db.collection('spaces').findOne({
        _id: new ObjectId(spaceId)
      });

      if (!space) {
        return NextResponse.json({ 
          error: 'Space not found' 
        }, { status: 404 });
      }

      const isOwner = space.userId === user.id;
      const spaceMember = space.members?.find((m: any) => 
        m.email === user.email || m.userId === user.id
      );

      if (!isOwner && !spaceMember) {
        return NextResponse.json({ 
          error: 'Access denied to this space' 
        }, { status: 403 });
      }

      const userRole = isOwner ? 'owner' : spaceMember?.role || 'viewer';
      console.log('👤 User role in space:', userRole);

      // ✅ STEP 2: Build base query for space documents
      query = { 
        spaceId: spaceId,
        belongsToSpace: true 
      };
      
      // Handle archived filter
      const archived = searchParams.get('archived');
      if (archived === 'true') {
        query.archived = true;
        console.log('📁 Fetching TRASHED documents');
      } else {
        query.archived = { $ne: true };
        console.log('📄 Fetching ACTIVE documents');
      }

      // ✅ STEP 3: Fetch all documents in the space
      let documents = await db.collection('documents')
        .find(query, { projection: { fileData: 0 } })
        .sort({ [sortBy]: sortOrder } as any)
        .toArray();

      console.log(`📄 Total documents in space: ${documents.length}`);

      // ✅ STEP 4: Apply folder-level filtering for non-privileged users
      let folderPermissions: any[] = [];
      
      if (userRole === 'owner' || userRole === 'admin' || userRole === 'editor') {
        // ✅ Admins, Editors, and Owners see ALL documents
        console.log('✅ Admin/Editor/Owner - showing all documents');
      } else {
        // ❌ Viewers MUST have explicit folder permissions
        console.log('👁️ Viewer role - checking folder permissions');

        // Get user's folder permissions
        folderPermissions = await db.collection('folder_permissions')
          .find({
            spaceId: spaceId,
            grantedTo: user.email.toLowerCase(),
            isActive: true
          })
          .toArray();

        console.log(`🔐 Found ${folderPermissions.length} folder permissions`);

        // ✅ FIX: If NO folder permissions exist, show NOTHING
        if (folderPermissions.length === 0) {
          console.log('❌ No folder permissions found - showing ZERO documents');
          documents = []; // Empty array = user sees nothing
        } else {
          // ✅ Filter to only show documents from allowed folders
          const allowedFolderIds = folderPermissions
            .filter(p => {
              // Check if permission is expired
              if (p.expiresAt && new Date(p.expiresAt) < new Date()) {
                console.log(`⏰ Permission expired for folder ${p.folderId}`);
                return false;
              }
              return true;
            })
            .map(p => p.folderId);

          console.log('📁 Allowed folder IDs:', allowedFolderIds);

          // ✅ CRITICAL FIX: Only show documents from allowed folders
          documents = documents.filter(doc => {
            // ❌ If document has no folder, don't show it
            if (!doc.folder) {
              return false;
            }
            
            // ✅ Only show if folder is in allowed list
            const hasAccess = allowedFolderIds.includes(doc.folder);
            
            if (hasAccess) {
              console.log(`✅ Access granted: "${doc.originalFilename}" in folder ${doc.folder}`);
            } else {
              console.log(`❌ Access denied: "${doc.originalFilename}" in folder ${doc.folder}`);
            }
            
            return hasAccess;
          });

          console.log(`📊 After folder filtering: ${documents.length} documents visible`);
        }
      }

      // Apply pagination AFTER filtering
      const paginatedDocuments = documents.slice((page - 1) * limit, page * limit);

      // Transform documents for frontend
      // Transform documents for frontend
const transformedDocuments = paginatedDocuments.map(doc => {
  // ✅ Check if user can download this document
  let canDownload = true; // Default: allow download
  
  if (userRole === 'viewer' && doc.folder) {
    // For viewers, check folder permission
    const folderPerm = folderPermissions.find(p => p.folderId === doc.folder);
    if (folderPerm) {
      canDownload = folderPerm.canDownload ?? true;
      console.log(`📄 Document "${doc.originalFilename}": canDownload=${canDownload}`);
    }
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
    canDownload, // ✅ NEW: Include download permission
    ...doc,
    _id: doc._id.toString()
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
      // Personal documents (not in a space)
      console.log('🔍 Fetching personal documents for user:', user.id);
      //   Get query parameters
  const showArchived = searchParams.get('deleted') === 'true' || searchParams.get('archived') === 'true';
  const showTemplates = searchParams.get('templates') === 'true';
  const searchQuery = searchParams.get('search') || '';
  
  // Build base query
  query = { 
    userId: user.id,
    $or: [
      { belongsToSpace: { $exists: false } },
      { belongsToSpace: false }
    ]
  };
  
  // ✅ Filter by archived status
  if (showArchived) {
    query.archived = true; // Only show archived
  } else {
    query.archived = { $ne: true }; // Exclude archived
  }
  
  // ✅ Filter by templates
  if (showTemplates) {
    query.isTemplate = true;
  }
  
  // ✅ Add search filter
  if (searchQuery) {
    query.$and = [
      ...(query.$and || []),
      {
        $or: [
          { originalFilename: { $regex: searchQuery, $options: 'i' } },
          { filename: { $regex: searchQuery, $options: 'i' } },
          { tags: { $regex: searchQuery, $options: 'i' } },
        ]
      }
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
        _id: doc._id.toString()
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
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}