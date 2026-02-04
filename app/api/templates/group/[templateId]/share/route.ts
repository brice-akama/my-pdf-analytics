// app/api/templates/group/[templateId]/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Get template sharing settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    
    const profile = await db.collection('profiles').findOne({
      user_id: user.id,
    });
    const organizationId = profile?.organization_id || user.id;

    const template = await db.collection('document_group_templates').findOne({
      _id: new ObjectId(templateId),
      organizationId: organizationId,
      isActive: true
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get current sharing settings
    const sharedWith = template.sharedWith || [];
    
    // Get team members if in organization
    let teamMembers: any[] = [];
    if (organizationId !== user.id) {
      // Fetch all users in this organization
      const profiles = await db.collection('profiles')
        .find({ organization_id: organizationId })
        .toArray();
      
      const userIds = profiles.map(p => new ObjectId(p.user_id));
      
      const users = await db.collection('users')
        .find({ _id: { $in: userIds } })
        .toArray();
      
      teamMembers = users.map(u => ({
        id: u._id.toString(),
        email: u.email,
        name: u.profile?.fullName || u.email,
        hasAccess: sharedWith.some((s: any) => s.userId === u._id.toString())
      })).filter(u => u.id !== user.id); // Exclude current user
    }

    return NextResponse.json({
      success: true,
      sharedWith,
      teamMembers,
      isOwnedByUser: template.userId === user.id
    });

  } catch (error) {
    console.error('❌ [TEMPLATE SHARE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get sharing settings' },
      { status: 500 }
    );
  }
}

// POST - Share template with team members
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    
    const profile = await db.collection('profiles').findOne({
      user_id: user.id,
    });
    const organizationId = profile?.organization_id || user.id;

    const { userIds, permissions } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'No users specified' },
        { status: 400 }
      );
    }

    // Verify template exists and user has permission
    const template = await db.collection('document_group_templates').findOne({
      _id: new ObjectId(templateId),
      organizationId: organizationId,
      isActive: true
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Only owner or admin can share
    const userRole = profile?.role || 'owner';
    if (template.userId !== user.id && userRole !== 'admin' && userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Only template owner or admins can share templates' },
        { status: 403 }
      );
    }

    // Build sharing records
    const sharedWith = userIds.map(userId => ({
      userId: userId,
      permissions: permissions || {
        canView: true,
        canUse: true,
        canEdit: false,
        canShare: false
      },
      sharedAt: new Date(),
      sharedBy: user.id
    }));

    // Update template
    await db.collection('document_group_templates').updateOne(
      { _id: new ObjectId(templateId) },
      {
        $set: {
          sharedWith: sharedWith,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ [TEMPLATE SHARE] Template ${templateId} shared with ${userIds.length} users`);

    return NextResponse.json({
      success: true,
      message: `Template shared with ${userIds.length} team member(s)`
    });

  } catch (error) {
    console.error('❌ [TEMPLATE SHARE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to share template' },
      { status: 500 }
    );
  }
}

// DELETE - Remove sharing (unshare)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    
    const profile = await db.collection('profiles').findOne({
      user_id: user.id,
    });
    const organizationId = profile?.organization_id || user.id;

    const { userId } = await request.json();

    // Update template - remove specific user from sharedWith
    const result = await db.collection('document_group_templates').updateOne(
      {
        _id: new ObjectId(templateId),
        organizationId: organizationId
      },
      {
        $pull: {
          sharedWith: { userId: userId }
        } as any,
        $set: {
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sharing removed successfully'
    });

  } catch (error) {
    console.error('❌ [TEMPLATE UNSHARE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove sharing' },
      { status: 500 }
    );
  }
}