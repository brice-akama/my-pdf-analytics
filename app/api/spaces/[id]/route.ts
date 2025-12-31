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
