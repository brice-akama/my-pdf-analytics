// app/api/spaces/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { dbPromise } from '../../lib/mongodb';

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

    // ✅ ALLOW OWNER OR MEMBER
    const space = await spaces.findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: authUser.id },                 // owner
        { 'members.email': authUser.email }      // member
      ]
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // ✅ Determine role
    let role = 'owner';
    let isOwner = true;

    if (space.userId !== authUser.id) {
      const member = space.members?.find(
        (m: any) => m.email === authUser.email
      );
      role = member?.role || 'viewer';
      isOwner = false;
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

      // ✅ ADDED (safe, frontend-friendly)
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
    const user = await verifyUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await dbPromise
    const { id: spaceId } = await params

    console.log('🗑️ DELETE - User ID:', user.id)
    console.log('🗑️ DELETE - Space ID:', spaceId)

    // Get the space
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    })

    if (!space) {
      return NextResponse.json({ 
        error: 'Space not found' 
      }, { status: 404 })
    }

    console.log('🗑️ Space found:', space.name)

    // ✅ Check permissions
    let canDelete = false

    // Check if user is the space owner
    if (space.userId === user.id || space.createdBy === user.id) {
      canDelete = true
      console.log('✅ User is space owner')
    }

    // If space belongs to organization, check org permissions
    if (space.organizationId && !canDelete) {
      const orgMembership = await db.collection('organization_members').findOne({
        organizationId: space.organizationId,
        userId: user.id,
        status: 'active'
      })

      if (orgMembership && (orgMembership.role === 'owner' || orgMembership.role === 'admin')) {
        canDelete = true
        console.log('✅ User is org owner/admin')
      }
    }

    if (!canDelete) {
      return NextResponse.json({ 
        error: 'You do not have permission to delete this space' 
      }, { status: 403 })
    }

    // Delete all documents in this space
    const documentsResult = await db.collection('documents').deleteMany({
      spaceId: spaceId
    })

    console.log(`🗑️ Deleted ${documentsResult.deletedCount} documents`)

    // Delete the space
    await db.collection('spaces').deleteOne({
      _id: new ObjectId(spaceId)
    })

    // ✅ Update organization space count if needed
    if (space.organizationId) {
      await db.collection('organizations').updateOne(
        { _id: new ObjectId(space.organizationId) },
        { 
          $inc: { spaceCount: -1 },
          $set: { updatedAt: new Date() }
        }
      )
      console.log('📉 Decremented organization space count')
    }

    console.log(`✅ Deleted space: ${space.name}`)

    return NextResponse.json({
      success: true,
      message: 'Space deleted successfully',
      deletedDocuments: documentsResult.deletedCount
    })

  } catch (error) {
    console.error('❌ Delete space error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete space' 
    }, { status: 500 })
  }
}