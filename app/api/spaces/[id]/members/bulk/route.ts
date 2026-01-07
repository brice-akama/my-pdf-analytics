// app/api/spaces/[id]/members/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { sendMemberRoleChangedEmail } from '@/lib/emailService';

// Permission matrix
const PERMISSIONS: Record<string, string[]> = {
  owner: ['change_role', 'toggle_status', 'remove_member'],
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
   POST: Bulk actions on members
====================================================== */
export async function POST(
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
    const { action, memberEmails, newRole } = await request.json();

    // Validate input
    if (!action || !Array.isArray(memberEmails) || memberEmails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get space and check user's role
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

    // Check permission for this action
    if (!canPerformAction(userRole, action)) {
      return NextResponse.json(
        { success: false, error: `Only owners and admins can perform ${action}` },
        { status: 403 }
      );
    }

    // Process based on action type
    if (action === 'change_role') {
      return await handleBulkRoleChange(db, space, spaceId, memberEmails, newRole, userRole, user);
    }

    if (action === 'remove_members') {
      return await handleBulkRemove(db, space, spaceId, memberEmails, userRole, user);
    }

    if (action === 'toggle_status') {
      return await handleBulkToggleStatus(db, space, spaceId, memberEmails, userRole, user);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Bulk action error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/* ======================================================
   Helper: Bulk Role Change
====================================================== */
async function handleBulkRoleChange(
  db: any,
  space: any,
  spaceId: string,
  memberEmails: string[],
  newRole: string,
  userRole: string,
  user: any
) {
  // Validate role
  if (!['viewer', 'editor', 'admin'].includes(newRole)) {
    return NextResponse.json(
      { success: false, error: 'Invalid role' },
      { status: 400 }
    );
  }

  // Admins cannot promote to admin (only owner can)
  if (userRole === 'admin' && newRole === 'admin') {
    return NextResponse.json(
      { success: false, error: 'Only space owners can promote to admin' },
      { status: 403 }
    );
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const email of memberEmails) {
    try {
      // Find member
      const member = space.members?.find((m: any) => m.email === email);

      if (!member) {
        results.failed++;
        results.errors.push(`${email}: Member not found`);
        continue;
      }

      // Cannot modify owner
      if (member.role === 'owner' || member.email === space.userId) {
        results.failed++;
        results.errors.push(`${email}: Cannot modify space owner`);
        continue;
      }

      // Check if user can modify this member
      if (!canModifyMember(userRole, member.role)) {
        results.failed++;
        results.errors.push(`${email}: Insufficient permissions to modify ${member.role}`);
        continue;
      }

      // Skip if already has this role
      if (member.role === newRole) {
        results.failed++;
        results.errors.push(`${email}: Already has ${newRole} role`);
        continue;
      }

      const oldRole = member.role;

      // Update role
      await db.collection('spaces').updateOne(
        {
          _id: new ObjectId(spaceId),
          'members.email': email
        },
        {
          $set: {
            'members.$.role': newRole,
            'members.$.updatedAt': new Date()
          }
        }
      );

      // Log activity
      await db.collection('space_activity_logs').insertOne({
        spaceId: spaceId,
        userId: user.id,
        action: 'bulk_role_change',
        details: {
          memberEmail: email,
          oldRole,
          newRole,
          changedBy: user.email
        },
        timestamp: new Date()
      });

      // Send email notification
      try {
        await sendMemberRoleChangedEmail({
          toEmail: email,
          spaceName: space.name,
          oldRole,
          newRole,
          changedBy: user.email
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
        // Don't fail the operation if email fails
      }

      results.success++;

    } catch (error) {
      console.error(`Error processing ${email}:`, error);
      results.failed++;
      results.errors.push(`${email}: Processing error`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Successfully updated ${results.success} member(s)`,
    results: {
      successful: results.success,
      failed: results.failed,
      errors: results.errors
    }
  });
}

/* ======================================================
   Helper: Bulk Remove
====================================================== */
async function handleBulkRemove(
  db: any,
  space: any,
  spaceId: string,
  memberEmails: string[],
  userRole: string,
  user: any
) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const email of memberEmails) {
    try {
      // Find member
      const member = space.members?.find((m: any) => m.email === email);

      if (!member) {
        results.failed++;
        results.errors.push(`${email}: Member not found`);
        continue;
      }

      // Cannot remove owner
      if (member.role === 'owner' || member.email === space.userId) {
        results.failed++;
        results.errors.push(`${email}: Cannot remove space owner`);
        continue;
      }

      // Check if user can modify this member
      if (!canModifyMember(userRole, member.role)) {
        results.failed++;
        results.errors.push(`${email}: Insufficient permissions to remove ${member.role}`);
        continue;
      }

      // Remove member
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        {
          $pull: { members: { email: email } },
          $inc: { teamMembers: -1 }
        } as any
      );

      // Log activity
      await db.collection('space_activity_logs').insertOne({
        spaceId: spaceId,
        userId: user.id,
        action: 'bulk_member_removed',
        details: {
          memberEmail: email,
          memberRole: member.role,
          removedBy: user.email
        },
        timestamp: new Date()
      });

      results.success++;

    } catch (error) {
      console.error(`Error removing ${email}:`, error);
      results.failed++;
      results.errors.push(`${email}: Processing error`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Successfully removed ${results.success} member(s)`,
    results: {
      successful: results.success,
      failed: results.failed,
      errors: results.errors
    }
  });
}

/* ======================================================
   Helper: Bulk Toggle Status
====================================================== */
async function handleBulkToggleStatus(
  db: any,
  space: any,
  spaceId: string,
  memberEmails: string[],
  userRole: string,
  user: any
) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const email of memberEmails) {
    try {
      // Find member
      const member = space.members?.find((m: any) => m.email === email);

      if (!member) {
        results.failed++;
        results.errors.push(`${email}: Member not found`);
        continue;
      }

      // Cannot modify owner
      if (member.role === 'owner' || member.email === space.userId) {
        results.failed++;
        results.errors.push(`${email}: Cannot modify space owner`);
        continue;
      }

      const newStatus = member.status === 'active' ? 'inactive' : 'active';

      // Update status
      await db.collection('spaces').updateOne(
        {
          _id: new ObjectId(spaceId),
          'members.email': email
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
        action: 'bulk_status_change',
        details: {
          memberEmail: email,
          newStatus,
          changedBy: user.email
        },
        timestamp: new Date()
      });

      results.success++;

    } catch (error) {
      console.error(`Error toggling status for ${email}:`, error);
      results.failed++;
      results.errors.push(`${email}: Processing error`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Successfully updated status for ${results.success} member(s)`,
    results: {
      successful: results.success,
      failed: results.failed,
      errors: results.errors
    }
  });
}