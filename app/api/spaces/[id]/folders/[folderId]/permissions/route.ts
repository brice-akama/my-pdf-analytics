// app/api/spaces/[id]/folders/[folderId]/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ HELPER: Check space permission
async function checkSpacePermission(
  db: any,
  spaceId: string,
  userId: string,
  userEmail: string,
  requiredRole: 'viewer' | 'editor' | 'admin' | 'owner'
): Promise<{ allowed: boolean; userRole: string | null }> {
  const space = await db.collection('spaces').findOne({
    _id: new ObjectId(spaceId)
  });

  if (!space) return { allowed: false, userRole: null };
  if (space.userId === userId) return { allowed: true, userRole: 'owner' };

  const member = space.members?.find((m: any) => 
    m.email === userEmail || m.userId === userId
  );
  
  if (!member) return { allowed: false, userRole: null };

  const roleHierarchy: Record<string, number> = {
    owner: 4, admin: 3, editor: 2, viewer: 1
  };

  const userLevel = roleHierarchy[member.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return {
    allowed: userLevel >= requiredLevel,
    userRole: member.role
  };
}

// ✅ POST: Grant folder access to someone
export async function POST(
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

    // Check if user has admin/owner permissions
    const { allowed, userRole } = await checkSpacePermission(
      db, 
      spaceId, 
      user.id, 
      user.email, 
      'admin'
    );

    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Only admins and owners can manage folder permissions' 
      }, { status: 403 });
    }

    // Verify folder exists
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

    const {
      grantedTo,           // Email of person getting access
      role,                // "viewer" | "editor" | "restricted"
      canDownload,         // true/false
      canUpload,           // true/false
      expiresAt,           // Date or null
      watermarkEnabled     // true/false
    } = await request.json();

    // Validate inputs
    if (!grantedTo || !grantedTo.includes('@')) {
      return NextResponse.json({ 
        success: false,
        error: 'Valid email address required' 
      }, { status: 400 });
    }

    const validRoles = ['viewer', 'editor', 'restricted'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid role. Must be viewer, editor, or restricted' 
      }, { status: 400 });
    }

    // Check if permission already exists
    const existingPermission = await db.collection('folder_permissions').findOne({
      folderId,
      spaceId,
      grantedTo: grantedTo.toLowerCase()
    });

    if (existingPermission) {
      // Update existing permission
      await db.collection('folder_permissions').updateOne(
        { _id: existingPermission._id },
        {
          $set: {
            role,
            canDownload: canDownload ?? true,
            canUpload: canUpload ?? false,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            watermarkEnabled: watermarkEnabled ?? false,
            updatedAt: new Date(),
            updatedBy: user.id,
            updatedByEmail: user.email,
            isActive: true
          }
        }
      );

      console.log(`✅ Updated folder permission for ${grantedTo}`);

      return NextResponse.json({
        success: true,
        message: `Updated access for ${grantedTo}`,
        permission: {
          id: existingPermission._id.toString(),
          grantedTo,
          role,
          canDownload: canDownload ?? true,
          canUpload: canUpload ?? false,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          watermarkEnabled: watermarkEnabled ?? false
        }
      });
    }

    // Create new permission
    const permissionRecord = {
      folderId,
      spaceId,
      folderName: folder.name,
      grantedTo: grantedTo.toLowerCase(),
      role,
      canDownload: canDownload ?? true,
      canUpload: canUpload ?? false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      watermarkEnabled: watermarkEnabled ?? false,
      grantedBy: user.id,
      grantedByEmail: user.email,
      grantedAt: new Date(),
      lastAccessed: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('folder_permissions').insertOne(permissionRecord);

    // Log activity
    await db.collection('space_activity_logs').insertOne({
      spaceId,
      userId: user.id,
      action: 'grant_folder_access',
      details: {
        folderId,
        folderName: folder.name,
        grantedTo,
        role,
        canDownload,
        expiresAt
      },
      timestamp: new Date()
    });

    console.log(`✅ Granted folder access: ${grantedTo} → ${folder.name} (${role})`);

    return NextResponse.json({
      success: true,
      message: `Access granted to ${grantedTo}`,
      permission: {
        id: result.insertedId.toString(),
        ...permissionRecord
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Grant folder access error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ GET: List all permissions for this folder
export async function GET(
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

    // Check if user has admin/owner permissions
    const { allowed } = await checkSpacePermission(
      db, 
      spaceId, 
      user.id, 
      user.email, 
      'admin'
    );

    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Only admins and owners can view folder permissions' 
      }, { status: 403 });
    }

    // Get all active permissions for this folder
    const permissions = await db.collection('folder_permissions')
      .find({
        folderId,
        spaceId,
        isActive: true
      })
      .sort({ grantedAt: -1 })
      .toArray();

    // Transform for frontend
    const transformedPermissions = permissions.map(p => ({
      id: p._id.toString(),
      grantedTo: p.grantedTo,
      role: p.role,
      canDownload: p.canDownload,
      canUpload: p.canUpload,
      expiresAt: p.expiresAt,
      watermarkEnabled: p.watermarkEnabled,
      grantedBy: p.grantedByEmail,
      grantedAt: p.grantedAt,
      lastAccessed: p.lastAccessed,
      isExpired: p.expiresAt ? new Date(p.expiresAt) < new Date() : false
    }));

    console.log(`✅ Loaded ${permissions.length} permissions for folder ${folderId}`);

    return NextResponse.json({
      success: true,
      permissions: transformedPermissions
    });

  } catch (error) {
    console.error('❌ Get folder permissions error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}