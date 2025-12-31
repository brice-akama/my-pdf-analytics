import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Please log in first',
        requiresAuth: true
      }, { status: 401 });
    }

    const db = await dbPromise;

    const invitation = await db.collection('invitations').findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return NextResponse.json({
        success: false,
        error: 'Invitation not found or expired'
      }, { status: 404 });
    }

    // Check if email matches
    if (invitation.email !== user.email) {
      return NextResponse.json({
        success: false,
        error: 'This invitation was sent to a different email address'
      }, { status: 403 });
    }

    // Add user to space members
    const space = await db.collection('spaces').findOne({
      _id: invitation.spaceId
    });

    const existingMember = space?.members?.find(
      (m: any) => m.email === user.email
    );

    if (!existingMember) {
      await db.collection('spaces').updateOne(
        { _id: invitation.spaceId },
        {
          $push: {
            'members': {
              email: user.email,
              userId: user.id,
              role: invitation.role,
              addedAt: new Date(),
              lastAccessedAt: new Date()
            }
          }
        } as any
      );
    }

    // Mark invitation as accepted
    await db.collection('invitations').updateOne(
      { token },
      {
        $set: {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedBy: user.id
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted',
      spaceId: invitation.spaceId.toString()
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}