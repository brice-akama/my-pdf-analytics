// app/api/organizations/[id]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ Helper: Check permissions
async function canManageMembers(db: any, orgId: string, userId: string): Promise<boolean> {
  const membership = await db.collection('organization_members').findOne({
    organizationId: orgId,
    userId: userId,
    status: 'active'
  });

  return membership && ['owner', 'admin'].includes(membership.role);
}

// ✅ PATCH: Update member role/permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: orgId, memberId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permissions
    const canManage = await canManageMembers(db, orgId, user.id);
    if (!canManage) {
      return NextResponse.json({ 
        error: 'Only owners and admins can update members' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { role, status } = body;

    // Get target member
    const targetMember = await db.collection('organization_members').findOne({
      _id: new ObjectId(memberId),
      organizationId: orgId
    });

    if (!targetMember) {
      return NextResponse.json({ 
        error: 'Member not found' 
      }, { status: 404 });
    }

    // Prevent owner from being demoted
    if (targetMember.role === 'owner' && role && role !== 'owner') {
      return NextResponse.json({ 
        error: 'Cannot change owner role. Transfer ownership first.' 
      }, { status: 400 });
    }

    // Prevent user from demoting themselves
    if (targetMember.userId === user.id) {
      return NextResponse.json({ 
        error: 'Cannot change your own role' 
      }, { status: 400 });
    }

    const updates: any = {
      updatedAt: new Date()
    };

    // Update role and permissions
    if (role) {
      const validRoles = ['member', 'admin', 'viewer', 'owner'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ 
          error: 'Invalid role' 
        }, { status: 400 });
      }

      updates.role = role;
      updates.permissions = {
        canCreateSpaces: role !== 'viewer',
        canInviteMembers: role === 'admin' || role === 'owner',
        canViewAllSpaces: role === 'admin' || role === 'owner',
        canManageBilling: role === 'owner',
        canManageSettings: role === 'admin' || role === 'owner'
      };
    }

    // Update status
    if (status) {
      const validStatuses = ['active', 'suspended'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: 'Invalid status' 
        }, { status: 400 });
      }
      updates.status = status;
    }

    // Apply updates
    await db.collection('organization_members').updateOne(
      { _id: new ObjectId(memberId) },
      { $set: updates }
    );

    console.log(`✅ Updated member ${targetMember.email} in org ${orgId}`);

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      member: {
        id: memberId,
        email: targetMember.email,
        role: updates.role || targetMember.role,
        status: updates.status || targetMember.status
      }
    });

  } catch (error) {
    console.error('❌ Update member error:', error);
    return NextResponse.json({ 
      error: 'Failed to update member'
    }, { status: 500 });
  }
}

// ✅ DELETE: Remove member from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: orgId, memberId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permissions
    const canManage = await canManageMembers(db, orgId, user.id);
    if (!canManage) {
      return NextResponse.json({ 
        error: 'Only owners and admins can remove members' 
      }, { status: 403 });
    }

    // Get target member
    const targetMember = await db.collection('organization_members').findOne({
      _id: new ObjectId(memberId),
      organizationId: orgId
    });

    if (!targetMember) {
      return NextResponse.json({ 
        error: 'Member not found' 
      }, { status: 404 });
    }

    // Prevent removing owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ 
        error: 'Cannot remove organization owner. Transfer ownership first.' 
      }, { status: 400 });
    }

    // Prevent user from removing themselves
    if (targetMember.userId === user.id) {
      return NextResponse.json({ 
        error: 'Cannot remove yourself. Use "Leave Organization" instead.' 
      }, { status: 400 });
    }

    // Delete member
    await db.collection('organization_members').deleteOne({
      _id: new ObjectId(memberId)
    });

    // Update member count
    await db.collection('organizations').updateOne(
      { _id: new ObjectId(orgId) },
      { 
        $inc: { memberCount: -1 },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`✅ Removed member ${targetMember.email} from org ${orgId}`);

    return NextResponse.json({
      success: true,
      message: `${targetMember.email} has been removed from the organization`
    });

  } catch (error) {
    console.error('❌ Remove member error:', error);
    return NextResponse.json({ 
      error: 'Failed to remove member'
    }, { status: 500 });
  }
}