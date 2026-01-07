// app/api/spaces/[id]/folders/[folderId]/permissions/[email]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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

// ✅ DELETE: Revoke folder access
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; folderId: string; email: string }> }
) {
  try {
    const { id: spaceId, folderId, email } = await params;
    
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
        error: 'Only admins and owners can revoke folder permissions' 
      }, { status: 403 });
    }

    const decodedEmail = decodeURIComponent(email).toLowerCase();

    // Delete permission
    const result = await db.collection('folder_permissions').deleteOne({
      folderId,
      spaceId,
      grantedTo: decodedEmail
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Permission not found' 
      }, { status: 404 });
    }

    // Log activity
    await db.collection('space_activity_logs').insertOne({
      spaceId,
      userId: user.id,
      action: 'revoke_folder_access',
      details: {
        folderId,
        revokedFrom: decodedEmail
      },
      timestamp: new Date()
    });

    console.log(`✅ Revoked folder access from ${decodedEmail}`);

    return NextResponse.json({
      success: true,
      message: `Access revoked from ${decodedEmail}`
    });

  } catch (error) {
    console.error('❌ Revoke folder access error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}