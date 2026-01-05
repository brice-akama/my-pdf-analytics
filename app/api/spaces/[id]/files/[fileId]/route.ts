// app/api/spaces/[id]/files/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ HELPER: Check if user has permission in space
async function checkSpacePermission(
  db: any,
  spaceId: string,
  userId: string,
  userEmail: string,
  requiredRole: 'viewer' | 'editor' | 'admin' | 'owner'
): Promise<{ allowed: boolean; space: any; userRole: string | null }> {
  const space = await db.collection('spaces').findOne({
    _id: new ObjectId(spaceId)
  });

  if (!space) {
    return { allowed: false, space: null, userRole: null };
  }

  // Check if user is owner
  if (space.userId === userId) {
    return { allowed: true, space, userRole: 'owner' };
  }

  // Check if user is a member
  const member = space.members?.find((m: any) => 
    m.email === userEmail || m.userId === userId
  );
  
  if (!member) {
    return { allowed: false, space, userRole: null };
  }

  const roleHierarchy: Record<string, number> = {
    owner: 4,
    admin: 3,
    editor: 2,
    viewer: 1
  };

  const userLevel = roleHierarchy[member.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return {
    allowed: userLevel >= requiredLevel,
    space,
    userRole: member.role
  };
}

// ✅ PATCH: Update file (rename, move, update metadata)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const resolvedParams = await params;
    const spaceId = resolvedParams.id;
    const fileId = resolvedParams.fileId;
    
    console.log('🔍 PATCH request received:', { spaceId, fileId });
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permission (editor required)
    const { allowed } = await checkSpacePermission(
      db, 
      spaceId, 
      user.id, 
      user.email, 
      'editor'
    );
    
    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient permissions. Editor role required.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { action, filename, folderId, metadata } = body;

    console.log('📝 Action details:', { action, filename, folderId });

    // ✅ Find file in documents collection
    let document = await db.collection('documents').findOne({
      _id: new ObjectId(fileId),
      spaceId: spaceId
    });

    // Try with ObjectId spaceId
    if (!document) {
      document = await db.collection('documents').findOne({
        _id: new ObjectId(fileId),
        spaceId: new ObjectId(spaceId)
      });
    }

    if (!document) {
      console.error('❌ Document not found');
      return NextResponse.json({ 
        success: false,
        error: 'Document not found'
      }, { status: 404 });
    }

    console.log('✅ Document found:', {
      filename: document.originalFilename,
      currentFolder: document.folder
    });

    const updates: any = {
      updatedAt: new Date()
    };

    let activityMessage = '';

    // ✅ RENAME FILE
    if (action === 'rename' && filename) {
      if (!filename.trim()) {
        return NextResponse.json({ 
          success: false,
          error: 'Filename cannot be empty' 
        }, { status: 400 });
      }

      // Check for duplicate in same folder
      const duplicate = await db.collection('documents').findOne({
        spaceId: spaceId,
        folder: document.folder,
        originalFilename: filename.trim(),
        _id: { $ne: new ObjectId(fileId) }
      });

      if (duplicate) {
        return NextResponse.json({ 
          success: false,
          error: 'A file with this name already exists in this location' 
        }, { status: 400 });
      }

      updates.originalFilename = filename.trim();
      activityMessage = `Renamed file from "${document.originalFilename}" to "${filename.trim()}"`;
    }

    // ✅ MOVE FILE TO FOLDER
    if (action === 'move' && folderId !== undefined) {
      console.log('🚀 Moving file to folder:', folderId);
      
      // Validate folder exists (if not moving to root)
      if (folderId !== null) {
        const targetFolder = await db.collection('space_folders').findOne({
          _id: new ObjectId(folderId),
          spaceId: spaceId
        });

        if (!targetFolder) {
          console.error('❌ Target folder not found:', folderId);
          return NextResponse.json({ 
            success: false,
            error: 'Target folder not found' 
          }, { status: 404 });
        }

        // Check for duplicate in target folder
        const duplicate = await db.collection('documents').findOne({
          spaceId: spaceId,
          folder: folderId,
          originalFilename: document.originalFilename,
          _id: { $ne: new ObjectId(fileId) }
        });

        if (duplicate) {
          return NextResponse.json({ 
            success: false,
            error: 'A file with this name already exists in the target folder' 
          }, { status: 400 });
        }
      }

      // Get folder names for logging
      const oldFolderName = document.folder 
        ? (await db.collection('space_folders').findOne({ _id: new ObjectId(document.folder) }))?.name || 'Root'
        : 'Root';
      
      const newFolderName = folderId
        ? (await db.collection('space_folders').findOne({ _id: new ObjectId(folderId) }))?.name || 'Root'
        : 'Root';

      updates.folder = folderId; // ✅ Use 'folder' not 'folderId'
      activityMessage = `Moved file from "${oldFolderName}" to "${newFolderName}"`;
      
      console.log('✅ Move prepared:', { oldFolderName, newFolderName });
    }

    // ✅ UPDATE METADATA
    if (action === 'updateMetadata' && metadata) {
      updates.metadata = {
        ...document.metadata,
        ...metadata
      };
      activityMessage = 'Updated file metadata';
    }

    console.log('💾 Applying updates:', updates);

    // ✅ Apply updates to documents collection
    const result = await db.collection('documents').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: updates }
    );

    console.log('📊 Update result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Document not found during update' 
      }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No changes made - document may already have these values' 
      }, { status: 400 });
    }

    // Log activity
    await db.collection('analytics_logs').insertOne({
      documentId: fileId,
      spaceId: spaceId,
      action: action || 'update_document',
      userId: user.id,
      details: {
        message: activityMessage,
        changes: updates
      },
      timestamp: new Date()
    });

    // Update space last activity
    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      { $set: { lastActivity: new Date() } }
    );

    console.log(`✅ Document updated successfully: ${activityMessage}`);

    return NextResponse.json({
      success: true,
      message: activityMessage || 'Document updated successfully',
      document: {
        ...document,
        ...updates
      }
    });

  } catch (error) {
    console.error('❌ PATCH handler error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ DELETE: Soft delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const resolvedParams = await params;
    const spaceId = resolvedParams.id;
    const fileId = resolvedParams.fileId;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permission
    const { allowed, userRole } = await checkSpacePermission(
      db, 
      spaceId, 
      user.id, 
      user.email, 
      'editor'
    );
    
    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient permissions. Editor role required.' 
      }, { status: 403 });
    }

    // Get document
    let document = await db.collection('documents').findOne({
      _id: new ObjectId(fileId),
      spaceId: spaceId
    });

    if (!document) {
      document = await db.collection('documents').findOne({
        _id: new ObjectId(fileId),
        spaceId: new ObjectId(spaceId)
      });
    }

    if (!document) {
      return NextResponse.json({ 
        success: false,
        error: 'Document not found' 
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent && userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ 
        success: false,
        error: 'Only owners and admins can permanently delete files' 
      }, { status: 403 });
    }

    if (permanent) {
      // Permanent delete
      await db.collection('documents').deleteOne({
        _id: new ObjectId(fileId)
      });

      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { 
          $inc: { documentsCount: -1 },
          $set: { lastActivity: new Date() }
        }
      );

      return NextResponse.json({
        success: true,
        message: `Document "${document.originalFilename}" permanently deleted`
      });
    } else {
      // Soft delete
      await db.collection('documents').updateOne(
        { _id: new ObjectId(fileId) },
        { 
          $set: { 
            archived: true,
            archivedAt: new Date(),
            archivedBy: user.id
          } 
        }
      );

      return NextResponse.json({
        success: true,
        message: `Document "${document.originalFilename}" moved to trash`
      });
    }

  } catch (error) {
    console.error('❌ Delete error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ GET: Get file details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const resolvedParams = await params;
    const spaceId = resolvedParams.id;
    const fileId = resolvedParams.fileId;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permission (viewer can view)
    const { allowed } = await checkSpacePermission(
      db, 
      spaceId, 
      user.id, 
      user.email, 
      'viewer'
    );
    
    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied' 
      }, { status: 403 });
    }

    // Get document from documents collection
    let document = await db.collection('documents').findOne({
      _id: new ObjectId(fileId),
      spaceId: spaceId,
      archived: { $ne: true }
    });

    // Try with ObjectId spaceId
    if (!document) {
      document = await db.collection('documents').findOne({
        _id: new ObjectId(fileId),
        spaceId: new ObjectId(spaceId),
        archived: { $ne: true }
      });
    }

    if (!document) {
      return NextResponse.json({ 
        success: false,
        error: 'Document not found' 
      }, { status: 404 });
    }

    // Get folder name if in folder
    let folderName = null;
    if (document.folder) {
      const folder = await db.collection('space_folders').findOne({
        _id: new ObjectId(document.folder)
      });
      folderName = folder?.name || null;
    }

    return NextResponse.json({
      success: true,
      file: {
        _id: document._id,
        filename: document.originalFilename,
        originalFilename: document.originalFilename,
        size: document.size,
        mimeType: document.mimeType,
        numPages: document.numPages,
        folder: document.folder,
        folderName,
        cloudinaryPdfUrl: document.cloudinaryPdfUrl,
        cloudinaryOriginalUrl: document.cloudinaryOriginalUrl,
        tracking: {
          views: document.tracking?.views || 0,
          downloads: document.tracking?.downloads || 0,
          lastViewed: document.tracking?.lastViewed || null
        },
        analytics: document.analytics || {},
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Get file error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}