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

    // 🔐 Ensure ownership
    const space = await spaces.findOne({
      _id: new ObjectId(id),
      userId: authUser.id,
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // ✅ Fetch user email
    const dbUser = await users.findOne(
      { _id: new ObjectId(authUser.id) },
      { projection: { email: 1 } }
    );

    // ✅ Fetch profile (name, avatar, etc.)
    const profile = await profiles.findOne(
      { userId: authUser.id },
      { projection: { fullName: 1, avatar: 1 } }
    );

    const processedSpace = {
      ...space,
      _id: space._id.toString(),

      owner: {
        id: authUser.id,
        email: dbUser?.email ?? null,
        name: profile?.fullName ?? null,
        avatar: profile?.avatar ?? null,
      },

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
