//app/api/spaces/[id]/files/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// ✅ HELPER: Check if user has permission in space
async function checkSpacePermission(
  db: any,
  spaceId: string,
  userId: string,
  requiredRole: 'viewer' | 'editor' | 'admin' | 'owner'
): Promise<{ allowed: boolean; space: any; userRole: string | null }> {
  const space = await db.collection('spaces').findOne({
    _id: new ObjectId(spaceId)
  });

  if (!space) {
    return { allowed: false, space: null, userRole: null };
  }

  // Owner has all permissions
  if (space.ownerId === userId) {
    return { allowed: true, space, userRole: 'owner' };
  }

  // Check if user is a member
  const member = space.members?.find((m: any) => m.userId === userId);
  if (!member) {
    return { allowed: false, space, userRole: null };
  }

  // Role hierarchy: owner > admin > editor > viewer
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

// ✅ HELPER: Log activity for audit trail
async function logSpaceActivity(
  db: any,
  spaceId: string,
  userId: string,
  action: string,
  details: any
) {
  try {
    await db.collection('space_activity_logs').insertOne({
      spaceId,
      userId,
      action,
      details,
      timestamp: new Date(),
      ipAddress: details.ipAddress || null,
      userAgent: details.userAgent || null
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failure shouldn't break the operation
  }
}

// ✅ GET: Get file details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: spaceId, fileId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permission (viewer can view)
    const { allowed, space } = await checkSpacePermission(db, spaceId, user.id, 'viewer');
    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied' 
      }, { status: 403 });
    }

    // Get file
    const spaceFile = await db.collection('space_files').findOne({
      _id: new ObjectId(fileId),
      spaceId: spaceId,
      deleted: { $ne: true } // Don't show deleted files
    });

    if (!spaceFile) {
      return NextResponse.json({ 
        success: false,
        error: 'File not found' 
      }, { status: 404 });
    }

    // Get document details
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(spaceFile.documentId)
    });

    // Get folder name if in folder
    let folderName = null;
    if (spaceFile.folderId) {
      const folder = await db.collection('space_folders').findOne({
        _id: new ObjectId(spaceFile.folderId)
      });
      folderName = folder?.name || null;
    }

    return NextResponse.json({
      success: true,
      file: {
        _id: spaceFile._id,
        filename: spaceFile.filename,
        size: spaceFile.size,
        mimeType: spaceFile.mimeType,
        numPages: spaceFile.numPages,
        folderId: spaceFile.folderId,
        folderName,
        viewsInSpace: spaceFile.viewsInSpace,
        downloadsInSpace: spaceFile.downloadsInSpace,
        lastViewedInSpace: spaceFile.lastViewedInSpace,
        addedBy: spaceFile.addedBy,
        addedAt: spaceFile.addedAt,
        cloudinaryPdfUrl: document?.cloudinaryPdfUrl,
        cloudinaryOriginalUrl: document?.cloudinaryOriginalUrl,
        analytics: document?.analytics
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

// ✅ PATCH: Update file (rename, move, update metadata)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: spaceId, fileId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permission (editor required for modifications)
    const { allowed, userRole } = await checkSpacePermission(db, spaceId, user.id, 'editor');
    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient permissions. Editor role required.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { action, filename, folderId, metadata } = body;

    // Get current file
    const spaceFile = await db.collection('space_files').findOne({
      _id: new ObjectId(fileId),
      spaceId: spaceId,
      deleted: { $ne: true }
    });

    if (!spaceFile) {
      return NextResponse.json({ 
        success: false,
        error: 'File not found' 
      }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date(),
      updatedBy: user.id
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

      // Check for duplicate filename in same folder
      const duplicate = await db.collection('space_files').findOne({
        spaceId,
        folderId: spaceFile.folderId,
        filename: filename.trim(),
        _id: { $ne: new ObjectId(fileId) },
        deleted: { $ne: true }
      });

      if (duplicate) {
        return NextResponse.json({ 
          success: false,
          error: 'A file with this name already exists in this location' 
        }, { status: 400 });
      }

      updates.filename = filename.trim();
      
      // Also update the main document record
      await db.collection('documents').updateOne(
        { _id: new ObjectId(spaceFile.documentId) },
        { 
          $set: { 
            originalFilename: filename.trim(),
            updatedAt: new Date()
          } 
        }
      );

      activityMessage = `Renamed file from "${spaceFile.filename}" to "${filename.trim()}"`;
    }

    // ✅ MOVE FILE TO DIFFERENT FOLDER
    if (action === 'move' && folderId !== undefined) {
      // Validate folder exists if not moving to root
      if (folderId !== null) {
        const targetFolder = await db.collection('space_folders').findOne({
          _id: new ObjectId(folderId),
          spaceId: spaceId
        });

        if (!targetFolder) {
          return NextResponse.json({ 
            success: false,
            error: 'Target folder not found' 
          }, { status: 404 });
        }

        // Check for duplicate filename in target folder
        const duplicate = await db.collection('space_files').findOne({
          spaceId,
          folderId: folderId,
          filename: spaceFile.filename,
          _id: { $ne: new ObjectId(fileId) },
          deleted: { $ne: true }
        });

        if (duplicate) {
          return NextResponse.json({ 
            success: false,
            error: 'A file with this name already exists in the target folder' 
          }, { status: 400 });
        }
      }

      const oldFolderName = spaceFile.folderId 
        ? (await db.collection('space_folders').findOne({ _id: new ObjectId(spaceFile.folderId) }))?.name || 'Root'
        : 'Root';
      
      const newFolderName = folderId
        ? (await db.collection('space_folders').findOne({ _id: new ObjectId(folderId) }))?.name || 'Root'
        : 'Root';

      updates.folderId = folderId;
      activityMessage = `Moved file from "${oldFolderName}" to "${newFolderName}"`;
    }

    // ✅ UPDATE METADATA
    if (action === 'updateMetadata' && metadata) {
      updates.metadata = {
        ...spaceFile.metadata,
        ...metadata
      };
      activityMessage = 'Updated file metadata';
    }

    // Apply updates
    const result = await db.collection('space_files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: updates }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No changes made' 
      }, { status: 400 });
    }

    // Log activity
    await logSpaceActivity(db, spaceId, user.id, action || 'update_file', {
      fileId,
      filename: spaceFile.filename,
      message: activityMessage,
      changes: updates
    });

    // Update space last activity
    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      { $set: { lastActivity: new Date() } }
    );

    console.log(`✅ File updated in space ${spaceId}: ${activityMessage}`);

    return NextResponse.json({
      success: true,
      message: activityMessage || 'File updated successfully',
      file: {
        ...spaceFile,
        ...updates
      }
    });

  } catch (error) {
    console.error('❌ Update file error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ DELETE: Soft delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: spaceId, fileId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permission (editor required for deletion)
    const { allowed, userRole } = await checkSpacePermission(db, spaceId, user.id, 'editor');
    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient permissions. Editor role required.' 
      }, { status: 403 });
    }

    // Get file
    const spaceFile = await db.collection('space_files').findOne({
      _id: new ObjectId(fileId),
      spaceId: spaceId,
      deleted: { $ne: true }
    });

    if (!spaceFile) {
      return NextResponse.json({ 
        success: false,
        error: 'File not found' 
      }, { status: 404 });
    }

    // Check query param for permanent deletion
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // ⚠️ PERMANENT DELETE - Only owners and admins
      if (userRole !== 'owner' && userRole !== 'admin') {
        return NextResponse.json({ 
          success: false,
          error: 'Only owners and admins can permanently delete files' 
        }, { status: 403 });
      }

      // Delete from Cloudinary
      try {
        const document = await db.collection('documents').findOne({
          _id: new ObjectId(spaceFile.documentId)
        });

        if (document?.cloudinaryOriginalUrl) {
          const publicId = document.cloudinaryOriginalUrl.split('/').slice(-1)[0].split('.')[0];
          await cloudinary.v2.uploader.destroy(publicId);
        }

        if (document?.cloudinaryPdfUrl) {
          const publicId = document.cloudinaryPdfUrl.split('/').slice(-1)[0].split('.')[0];
          await cloudinary.v2.uploader.destroy(publicId);
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion failed:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }

      // Delete from space_files
      await db.collection('space_files').deleteOne({
        _id: new ObjectId(fileId)
      });

      // Delete main document if it only belonged to this space
      await db.collection('documents').deleteOne({
        _id: new ObjectId(spaceFile.documentId),
        belongsToSpace: true,
        spaceId: spaceId
      });

      // Update space document count
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { 
          $inc: { documentsCount: -1 },
          $set: { lastActivity: new Date() }
        }
      );

      await logSpaceActivity(db, spaceId, user.id, 'permanent_delete_file', {
        fileId,
        filename: spaceFile.filename
      });

      console.log(`✅ File permanently deleted from space ${spaceId}: ${spaceFile.filename}`);

      return NextResponse.json({
        success: true,
        message: `File "${spaceFile.filename}" permanently deleted`
      });

    } else {
      // ✅ SOFT DELETE - Recoverable
      await db.collection('space_files').updateOne(
        { _id: new ObjectId(fileId) },
        { 
          $set: { 
            deleted: true,
            deletedAt: new Date(),
            deletedBy: user.id
          } 
        }
      );

      // Update space document count
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { 
          $inc: { documentsCount: -1 },
          $set: { lastActivity: new Date() }
        }
      );

      await logSpaceActivity(db, spaceId, user.id, 'soft_delete_file', {
        fileId,
        filename: spaceFile.filename
      });

      console.log(`✅ File soft deleted from space ${spaceId}: ${spaceFile.filename}`);

      return NextResponse.json({
        success: true,
        message: `File "${spaceFile.filename}" moved to trash. Can be restored within 30 days.`
      });
    }

  } catch (error) {
    console.error('❌ Delete file error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}