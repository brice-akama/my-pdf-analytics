// app/api/spaces/[id]/my-role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbPromise;
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Space not found' },
        { status: 404 }
      );
    }

    // ✅ CRITICAL FIX: Check owner by userId ONLY (not email)
    const isOwner = space.userId === user.id;
    
    if (isOwner) {
      console.log(`✅ ${user.email} is OWNER of space ${spaceId}`);
      return NextResponse.json({
        success: true,
        role: 'owner',
        email: user.email,
        userId: user.id,
        spaceName: space.name,
        canManageMembers: true,
        canUpload: true,
        canDelete: true
      });
    }

    // ✅ Find user in members array by email (primary) or userId (fallback)
    const member = space.members?.find(
      (m: any) => m.email?.toLowerCase() === user.email?.toLowerCase() || m.userId === user.id
    );

    if (!member) {
      console.log(`❌ ${user.email} NOT found in members array`);
      return NextResponse.json(
        { success: false, error: 'You do not have access to this space' },
        { status: 403 }
      );
    }

    // ✅ CRITICAL: Use the member's role directly from database
    const userRole = String(member.role).toLowerCase(); // Force to string and lowercase
    
    console.log(`✅ ${user.email} has role: ${userRole} (from DB: ${member.role})`);

    const permissions = {
      owner: {
        canManageMembers: true,
        canUpload: true,
        canDelete: true,
      },
      admin: {
        canManageMembers: true,
        canUpload: true,
        canDelete: true,
      },
      editor: {
        canManageMembers: false,
        canUpload: true,
        canDelete: false,
      },
      viewer: {
        canManageMembers: false,
        canUpload: false,
        canDelete: false,
      }
    };

    const rolePermissions = permissions[userRole as keyof typeof permissions] || permissions.viewer;

    return NextResponse.json({
      success: true,
      role: userRole,
      email: user.email,
      userId: user.id,
      spaceName: space.name,
      status: member.status || 'active',
      ...rolePermissions
    });

  } catch (error) {
    console.error('❌ Get my role error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
