//app/api/spaces/[id]/folders/[folderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ HELPER: Check permission
async function checkSpacePermission(
  db: any,
  spaceId: string,
  userId: string,
  requiredRole: 'viewer' | 'editor' | 'admin' | 'owner'
): Promise<{ allowed: boolean; userRole: string | null }> {
  const space = await db.collection('spaces').findOne({
    _id: new ObjectId(spaceId)
  });

  if (!space) return { allowed: false, userRole: null };
  if (space.ownerId === userId) return { allowed: true, userRole: 'owner' };

  const member = space.members?.find((m: any) => m.userId === userId);
  if (!member) return { allowed: false, userRole: null };

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
    userRole: member.role
  };
}

// ✅ PATCH: Rename folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; folderId: string }> }
) {
  try {
    const { id: spaceId, folderId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permission
    const { allowed } = await checkSpacePermission(db, spaceId, user.id, 'editor');
    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient permissions' 
      }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Folder name cannot be empty' 
      }, { status: 400 });
    }

    // Get folder
    const folder = await db.collection('space_folders').findOne({
      _id: new ObjectId(folderId),
      spaceId
    });

    if (!folder) {
      return NextResponse.json({ 
        success: false,
        error: 'Folder not found' 
      }, { status: 404 });
    }

    // Check for duplicate name
    const duplicate = await db.collection('space_folders').findOne({
      spaceId,
      parentFolderId: folder.parentFolderId,
      name: name.trim(),
      _id: { $ne: new ObjectId(folderId) }
    });

    if (duplicate) {
      return NextResponse.json({ 
        success: false,
        error: 'Folder with this name already exists' 
      }, { status: 400 });
    }

    // Update folder
    await db.collection('space_folders').updateOne(
      { _id: new ObjectId(folderId) },
      { 
        $set: { 
          name: name.trim(),
          description: description || folder.description,
          updatedAt: new Date()
        } 
      }
    );

    // Log activity
    await db.collection('space_activity_logs').insertOne({
      spaceId,
      userId: user.id,
      action: 'rename_folder',
      details: {
        folderId,
        oldName: folder.name,
        newName: name.trim()
      },
      timestamp: new Date()
    });

    console.log(`✅ Folder renamed in space ${spaceId}: "${folder.name}" → "${name.trim()}"`);

    return NextResponse.json({
      success: true,
      message: `Folder renamed to "${name.trim()}"`,
      folder: {
        ...folder,
        name: name.trim(),
        description: description || folder.description,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Rename folder error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}

// ✅ DELETE: Delete folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; folderId: string }> }
) {
  try {
    const { id: spaceId, folderId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permission
    const { allowed } = await checkSpacePermission(db, spaceId, user.id, 'editor');
    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient permissions' 
      }, { status: 403 });
    }

    // Get folder
    const folder = await db.collection('space_folders').findOne({
      _id: new ObjectId(folderId),
      spaceId
    });

    if (!folder) {
      return NextResponse.json({ 
        success: false,
        error: 'Folder not found' 
      }, { status: 404 });
    }
    // Check if folder has files
const filesCount = await db.collection('space_files').countDocuments({
spaceId,
folderId: folderId,
deleted: { $ne: true }
});

// Check query param for force deletion
const { searchParams } = new URL(request.url);
const force = searchParams.get('force') === 'true';

if (filesCount > 0 && !force) {
  return NextResponse.json({ 
    success: false,
    error: `Folder contains ${filesCount} file(s). Add ?force=true to delete anyway (files will be moved to root).`,
    filesCount
  }, { status: 400 });
}

// If force, move files to root
if (filesCount > 0) {
  await db.collection('space_files').updateMany(
    { spaceId, folderId: folderId },
    { 
      $set: { 
        folderId: null,
        updatedAt: new Date()
      } 
    }
  );
  console.log(`✅ Moved ${filesCount} files to root before deleting folder`);
}

// Delete folder
await db.collection('space_folders').deleteOne({
  _id: new ObjectId(folderId)
});

// Log activity
await db.collection('space_activity_logs').insertOne({
  spaceId,
  userId: user.id,
  action: 'delete_folder',
  details: {
    folderId,
    folderName: folder.name,
    filesMovedToRoot: filesCount
  },
  timestamp: new Date()
});

// Update space last activity
await db.collection('spaces').updateOne(
  { _id: new ObjectId(spaceId) },
  { $set: { lastActivity: new Date() } }
);

console.log(`✅ Folder deleted from space ${spaceId}: ${folder.name}`);

return NextResponse.json({
  success: true,
  message: `Folder "${folder.name}" deleted${filesCount > 0 ? ` and ${filesCount} file(s) moved to root` : ''}`
});
} catch (error) {
console.error('❌ Delete folder error:', error);
return NextResponse.json({
success: false,
error: 'Server error'
}, { status: 500 });
}
}
