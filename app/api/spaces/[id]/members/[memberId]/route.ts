// app/api/spaces/[id]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { sendMemberRoleChangedEmail, sendMemberRemovedEmail } from '@/lib/emailService';

// Permission matrix
const PERMISSIONS: Record<string, string[]> = {
  owner: ['change_role', 'toggle_status', 'remove_member', 'manage_billing', 'delete_space'],
  admin: ['change_role', 'toggle_status', 'remove_member'],
  editor: [],
  viewer: []
}

function canPerformAction(userRole: string, action: string): boolean {
  return PERMISSIONS[userRole as keyof typeof PERMISSIONS]?.includes(action) || false
}

function canModifyMember(userRole: string, targetRole: string): boolean {
  // Owner can modify anyone except other owners
  if (userRole === 'owner') return targetRole !== 'owner'
  
  // Admin can modify editors and viewers only
  if (userRole === 'admin') return ['editor', 'viewer'].includes(targetRole)
  
  // Editors and viewers cannot modify anyone
  return false
}

/* ======================================================
   PATCH: Update member (role or status)
====================================================== */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: spaceId, memberId } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbPromise;
    const { action, role, status } = await request.json();

    // Check if user has permission (owner or admin)
    // Get space and check membership
const space = await db.collection('spaces').findOne({
  _id: new ObjectId(spaceId)
});

if (!space) {
  return NextResponse.json(
    { success: false, error: 'Space not found' },
    { status: 404 }
  );
}

// Determine user's role in this space
let userRole = 'none'
if (space.userId === user.id || space.userId === user.email) {
  userRole = 'owner'
} else {
  const userMember = space.members?.find((m: any) => m.email === user.email || m.userId === user.id)
  userRole = userMember?.role || 'none'
}

// Check if user has permission for this action
if (!canPerformAction(userRole, action)) {
  return NextResponse.json(
    { success: false, error: `Only ${userRole === 'none' ? 'members' : 'owners/admins'} can ${action.replace('_', ' ')}` },
    { status: 403 }
  );
}

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Find member by email (memberId is actually email in this case)
    const memberIndex = space.members?.findIndex(
      (m: any) => m.email === memberId || m.userId === memberId
    );

    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    const member = space.members[memberIndex];

    // Prevent owner from being modified
    if (member.email === space.userId || member.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify space owner' },
        { status: 403 }
      );
    }

    // Handle different actions
if (action === 'change_role') {
  if (!['viewer', 'editor', 'admin'].includes(role)) {
    return NextResponse.json(
      { success: false, error: 'Invalid role' },
      { status: 400 }
    );
  }

  // Check if user can modify this member
  if (!canModifyMember(userRole, member.role)) {
    return NextResponse.json(
      { success: false, error: `${userRole}s cannot modify ${member.role}s` },
      { status: 403 }
    );
  }

  // Admins cannot promote to admin (only owner can)
  if (userRole === 'admin' && role === 'admin') {
    return NextResponse.json(
      { success: false, error: 'Only space owners can promote to admin' },
      { status: 403 }
    );
  }

   

      const oldRole = member.role;

      await db.collection('spaces').updateOne(
        {
          _id: new ObjectId(spaceId),
          'members.email': member.email
        },
        {
          $set: {
            'members.$.role': role,
            'members.$.updatedAt': new Date()
          }
        }
      );

      // Log activity
      await db.collection('space_activity_logs').insertOne({
        spaceId: spaceId,
        userId: user.id,
        action: 'member_role_changed',
        details: {
          memberEmail: member.email,
          oldRole,
          newRole: role,
          changedBy: user.email
        },
        timestamp: new Date()
      });

      // Send email notification
      await sendMemberRoleChangedEmail({
        toEmail: member.email,
        spaceName: space.name,
        oldRole,
        newRole: role,
        changedBy: user.email
      });

      return NextResponse.json({
        success: true,
        message: `Role updated to ${role}`
      });
    }

    if (action === 'toggle_status') {
      const newStatus = status || (member.status === 'active' ? 'inactive' : 'active');

      await db.collection('spaces').updateOne(
        {
          _id: new ObjectId(spaceId),
          'members.email': member.email
        },
        {
          $set: {
            'members.$.status': newStatus,
            'members.$.updatedAt': new Date()
          }
        }
      );

      // Log activity
      await db.collection('space_activity_logs').insertOne({
        spaceId: spaceId,
        userId: user.id,
        action: 'member_status_changed',
        details: {
          memberEmail: member.email,
          newStatus,
          changedBy: user.email
        },
        timestamp: new Date()
      });

      return NextResponse.json({
        success: true,
        message: `Member ${newStatus === 'active' ? 'activated' : 'suspended'}`,
        status: newStatus
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Update member error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/* ======================================================
   DELETE: Remove member from space
====================================================== */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: spaceId, memberId } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbPromise;

    // Check permission
    // Get space and check membership
const space = await db.collection('spaces').findOne({
  _id: new ObjectId(spaceId)
});

if (!space) {
  return NextResponse.json(
    { success: false, error: 'Space not found' },
    { status: 404 }
  );
}

// Determine user's role
let userRole = 'none'
if (space.userId === user.id || space.userId === user.email) {
  userRole = 'owner'
} else {
  const userMember = space.members?.find((m: any) => m.email === user.email || m.userId === user.id)
  userRole = userMember?.role || 'none'
}

// Check permission
if (!canPerformAction(userRole, 'remove_member')) {
  return NextResponse.json(
    { success: false, error: 'Only owners and admins can remove members' },
    { status: 403 }
  );
}

    // Find member
    const member = space.members?.find(
      (m: any) => m.email === memberId || m.userId === memberId
    );

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if user can remove this member
if (!canModifyMember(userRole, member.role)) {
  return NextResponse.json(
    { success: false, error: `${userRole}s cannot remove ${member.role}s` },
    { status: 403 }
  );
}

    // Prevent removing owner
    if (member.role === 'owner' || space.userId === member.email) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove space owner' },
        { status: 403 }
      );
    }

    // Remove member
    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      {
        $pull: { members: { email: member.email } },
        $inc: { teamMembers: -1 }
      } as any
    );

    // Log activity
    await db.collection('space_activity_logs').insertOne({
      spaceId: spaceId,
      userId: user.id,
      action: 'member_removed',
      details: {
        memberEmail: member.email,
        memberRole: member.role,
        removedBy: user.email
      },
      timestamp: new Date()
    });

    // Send email notification
    await sendMemberRemovedEmail({
      toEmail: member.email,
      spaceName: space.name,
      removedBy: user.email
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('❌ Delete member error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}