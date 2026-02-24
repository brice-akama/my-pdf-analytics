// app/api/spaces/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { dbPromise } from '../../lib/mongodb';
import { checkSpaceAccess } from '@/lib/spaceAccessGuard'; // ✅ NEW

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authUser = await verifyUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid space ID' },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    const users = db.collection('users');
    const profiles = db.collection('profiles');
    const spaces = db.collection('spaces');

    const space = await spaces.findOne({ _id: new ObjectId(id) });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // ✅ Get user's profile to check organization
    const userProfile = await profiles.findOne({ user_id: authUser.id });
    const userOrgId = userProfile?.organization_id || authUser.id;

    // ✅ Check access: owner, org owner, or member
    const isSpaceOwner = space.userId === authUser.id;
    const isOrgOwner = space.organizationId && space.organizationId === userOrgId;
    const member = space.members?.find((m: any) => m.email === authUser.email);

    if (!isSpaceOwner && !isOrgOwner && !member) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // ✅ Determine role with org hierarchy
    let role = 'owner';
    let isOwner = true;
    const userOrgRole = userProfile?.role || 'owner';

    if (isOrgOwner && !isSpaceOwner) {
      role = userOrgRole === 'owner' ? 'owner' : 'admin';
      isOwner = userOrgRole === 'owner';
      console.log(`🏢 Org ${userOrgRole} accessing team space - granted ${role} access`);
    } else if (!isSpaceOwner && member) {
      role = member.role || 'viewer';
      isOwner = false;
    }

    // ✅ ENFORCEMENT LAYER
    // Owners and org admins bypass all restrictions — they manage the space
    const isManager = isSpaceOwner || (isOrgOwner && ['owner', 'admin'].includes(userOrgRole));

    if (!isManager) {
      const guard = await checkSpaceAccess(space, authUser.email, db);

      if (!guard.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: guard.reason,
            code: guard.code,
            // ✅ For NDA_REQUIRED — send the NDA doc info so frontend
            // can show the signing screen instead of a generic error
            ...(guard.code === 'NDA_REQUIRED' && {
              ndaDocumentUrl: space.ndaSettings?.ndaDocumentUrl,
              ndaDocumentName: space.ndaSettings?.ndaDocumentName,
              spaceId: id,
              spaceName: space.name,
            }),
          },
          { status: 403 }
        );
      }
    }

    // ✅ Fetch owner email
    const dbUser = await users.findOne(
      { _id: new ObjectId(space.userId) },
      { projection: { email: 1 } }
    );

    // ✅ Fetch owner profile
    const profile = await profiles.findOne(
      { userId: space.userId },
      { projection: { fullName: 1, avatar: 1 } }
    );

    const processedSpace = {
      ...space,
      _id: space._id.toString(),
      owner: {
        id: space.userId,
        email: dbUser?.email ?? null,
        name: profile?.fullName ?? null,
        avatar: profile?.avatar ?? null,
      },
      isOwner,
      role,
      status: space.status ?? 'active',
      type: space.type ?? 'custom',
      documentsCount: space.documentsCount ?? 0,
      viewsCount: space.viewsCount ?? 0,
      teamMembers: space.teamMembers ?? 0,
      lastActivity:
        space.lastActivity ??
        space.createdAt ??
        new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      space: processedSpace,
    });

  } catch (error) {
    console.error('Error fetching space:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const { id: spaceId } = await params;

    console.log('🗑️ DELETE - User ID:', user.id);
    console.log('🗑️ DELETE - Space ID:', spaceId);

    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId),
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    console.log('🗑️ Space found:', space.name);

    let canDelete = false;

    if (space.userId === user.id || space.createdBy === user.id) {
      canDelete = true;
      console.log('✅ User is space owner');
    }

    if (space.organizationId && !canDelete) {
      const orgMembership = await db.collection('organization_members').findOne({
        organizationId: space.organizationId,
        userId: user.id,
        status: 'active',
      });

      if (orgMembership && (orgMembership.role === 'owner' || orgMembership.role === 'admin')) {
        canDelete = true;
        console.log('✅ User is org owner/admin');
      }
    }

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this space' },
        { status: 403 }
      );
    }

    const documentsResult = await db.collection('documents').deleteMany({
      spaceId: spaceId,
    });

    console.log(`🗑️ Deleted ${documentsResult.deletedCount} documents`);

    await db.collection('spaces').deleteOne({ _id: new ObjectId(spaceId) });

    if (space.organizationId) {
      await db.collection('organizations').updateOne(
        { _id: new ObjectId(space.organizationId) },
        {
          $inc: { spaceCount: -1 },
          $set: { updatedAt: new Date() },
        }
      );
      console.log('📉 Decremented organization space count');
    }

    console.log(`✅ Deleted space: ${space.name}`);

    return NextResponse.json({
      success: true,
      message: 'Space deleted successfully',
      deletedDocuments: documentsResult.deletedCount,
    });

  } catch (error) {
    console.error('❌ Delete space error:', error);
    return NextResponse.json(
      { error: 'Failed to delete space' },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid space ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const db = await dbPromise;

    const space = await db.collection('spaces').findOne({ _id: new ObjectId(id) });
    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Space not found' },
        { status: 404 }
      );
    }

    const isOwnerOrAdmin =
      space.userId === user.id ||
      space.members?.some(
        (m: any) => m.email === user.email && ['owner', 'admin'].includes(m.role)
      );

    if (!isOwnerOrAdmin) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    const updateFields: Record<string, any> = { updatedAt: new Date() };

    if (body.status !== undefined) {
      const validStatuses = ['active', 'archived', 'draft'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updateFields.status = body.status;
    }

    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.settings !== undefined) updateFields.settings = { ...space.settings, ...body.settings };
    // ✅ Allow ndaSettings updates from the settings drawer
    if (body.ndaSettings !== undefined) updateFields.ndaSettings = { ...space.ndaSettings, ...body.ndaSettings };

    await db.collection('spaces').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    console.log(`✅ Space ${id} updated:`, updateFields);

    return NextResponse.json({
      success: true,
      message: body.status
        ? `Space ${body.status === 'active' ? 'activated' : 'archived'} successfully`
        : 'Space updated successfully',
    });

  } catch (error) {
    console.error('❌ PATCH space error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}


 