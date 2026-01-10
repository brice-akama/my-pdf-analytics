// app/api/organizations/[id]/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ Helper: Check if user is owner or admin
async function canManageSettings(db: any, orgId: string, userId: string): Promise<boolean> {
  const membership = await db.collection('organization_members').findOne({
    organizationId: orgId,
    userId: userId,
    status: 'active'
  });

  return membership && ['owner', 'admin'].includes(membership.role);
}

// ✅ GET: Get organization settings
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

    // Verify user is member
    const membership = await db.collection('organization_members').findOne({
      organizationId: orgId,
      userId: user.id,
      status: 'active'
    });

    if (!membership) {
      return NextResponse.json({ 
        error: 'Access denied' 
      }, { status: 403 });
    }

    // Get organization
    const org = await db.collection('organizations').findOne({
      _id: new ObjectId(orgId)
    });

    if (!org) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        owner: org.owner,
        settings: org.settings,
        memberCount: org.memberCount,
        spaceCount: org.spaceCount,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Get settings error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch settings'
    }, { status: 500 });
  }
}

// ✅ PATCH: Update organization settings
export async function PATCH(
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
    const canManage = await canManageSettings(db, orgId, user.id);
    if (!canManage) {
      return NextResponse.json({ 
        error: 'Only owners and admins can update settings' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, settings } = body;

    const updates: any = {
      updatedAt: new Date()
    };

    if (name) {
      updates.name = name.trim();
    }

    if (settings) {
      updates['settings.allowMemberSpaces'] = settings.allowMemberSpaces ?? undefined;
      updates['settings.requireApproval'] = settings.requireApproval ?? undefined;
      updates['settings.defaultSpacePrivacy'] = settings.defaultSpacePrivacy ?? undefined;
      
      // Remove undefined values
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) delete updates[key];
      });
    }

    // Apply updates
    await db.collection('organizations').updateOne(
      { _id: new ObjectId(orgId) },
      { $set: updates }
    );

    console.log(`✅ Updated settings for org ${orgId}`);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('❌ Update settings error:', error);
    return NextResponse.json({ 
      error: 'Failed to update settings'
    }, { status: 500 });
  }
}