// app/api/organizations/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ Helper: Check if user can manage members
async function canManageMembers(db: any, orgId: string, userId: string): Promise<boolean> {
  const membership = await db.collection('organization_members').findOne({
    organizationId: orgId,
    userId: userId,
    status: 'active'
  });

  return membership && ['owner', 'admin'].includes(membership.role);
}

// ✅ GET: List organization members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Verify user is member of this org
    const userMembership = await db.collection('organization_members').findOne({
      organizationId: orgId,
      userId: user.id,
      status: 'active'
    });

    if (!userMembership) {
      return NextResponse.json({ 
        error: 'Access denied to this organization' 
      }, { status: 403 });
    }

    // Get all members
    const members = await db.collection('organization_members')
      .find({ 
        organizationId: orgId,
        status: { $in: ['active', 'invited'] }
      })
      .sort({ joinedAt: -1 })
      .toArray();

    const formattedMembers = members.map(m => ({
      id: m._id.toString(),
      userId: m.userId,
      email: m.email,
      name: m.name,
      role: m.role,
      status: m.status,
      permissions: m.permissions,
      joinedAt: m.joinedAt,
      invitedAt: m.invitedAt,
      lastActiveAt: m.lastActiveAt
    }));

    return NextResponse.json({
      success: true,
      members: formattedMembers
    });

  } catch (error) {
    console.error('❌ Get members error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch members'
    }, { status: 500 });
  }
}

// ✅ POST: Invite member to organization
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permissions
    const canManage = await canManageMembers(db, orgId, user.id);
    if (!canManage) {
      return NextResponse.json({ 
        error: 'Only owners and admins can invite members' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = 'member' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ 
        error: 'Valid email address required' 
      }, { status: 400 });
    }

    const validRoles = ['member', 'admin', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role' 
      }, { status: 400 });
    }

    // Check if already a member
    const existing = await db.collection('organization_members').findOne({
      organizationId: orgId,
      email: email.toLowerCase()
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'User is already a member of this organization' 
      }, { status: 400 });
    }

    // Get organization
    const org = await db.collection('organizations').findOne({
      _id: new ObjectId(orgId)
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check member limit
    const currentMembers = await db.collection('organization_members')
      .countDocuments({ organizationId: orgId, status: 'active' });

    if (org.settings.maxMembers !== -1 && currentMembers >= org.settings.maxMembers) {
      return NextResponse.json({ 
        error: `Member limit reached (${org.settings.maxMembers}). Upgrade your plan.` 
      }, { status: 400 });
    }

    // Set permissions based on role
    const permissions = {
      canCreateSpaces: role !== 'viewer',
      canInviteMembers: role === 'admin',
      canViewAllSpaces: role === 'admin',
      canManageBilling: false,
      canManageSettings: role === 'admin'
    };

    // Create invitation
    await db.collection('organization_members').insertOne({
      organizationId: orgId,
      userId: null,  // Will be filled when they accept
      email: email.toLowerCase(),
      name: email.split('@')[0],
      role,
      permissions,
      status: 'invited',
      invitedBy: user.id,
      invitedAt: new Date(),
      joinedAt: null,
      lastActiveAt: null
    });

    // Update member count
    await db.collection('organizations').updateOne(
      { _id: new ObjectId(orgId) },
      { 
        $inc: { memberCount: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    // TODO: Send invitation email (we'll add this later)

    console.log(`✅ Invited ${email} to organization ${org.name}`);

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      member: {
        email,
        role,
        status: 'invited'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Invite member error:', error);
    return NextResponse.json({ 
      error: 'Failed to invite member'
    }, { status: 500 });
  }
}