// app/api/invitations/[token]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Try cookie-based auth first (already logged in)
    let user = await verifyUserFromRequest(request);

    // If not via cookie, accept userId from body (post login/signup on invite page)
    let bodyUserId: string | null = null;
    let body: any = {};

    try {
      body = await request.json();
      bodyUserId = body.userId || null;
    } catch {
      // no body or not JSON, that's fine
    }

    // If still no user but we have a userId from body, fetch user from DB
    if (!user && bodyUserId) {
      const db = await dbPromise;
      const dbUser = await db.collection('users').findOne({
        _id: new ObjectId(bodyUserId)
      });

      if (dbUser) {
        user = {
          id: dbUser._id.toString(),
          email: dbUser.email
        };
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        requiresAuth: true,
        error: 'Please log in first'
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Find the invitation
    const invitation = await db.collection('invitations').findOne({
      token,
      status: 'pending'
    });

    if (!invitation) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired invitation'
      }, { status: 404 });
    }

    // Verify email matches
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: `This invitation is for ${invitation.email}. Please log in with that email.`
      }, { status: 403 });
    }

    // Find the space
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(invitation.spaceId)
    });

    if (!space) {
      return NextResponse.json({
        success: false,
        error: 'Space not found'
      }, { status: 404 });
    }

    // Find member in space
    const memberIndex = space.members?.findIndex(
      (m: any) => m.email.toLowerCase() === invitation.email.toLowerCase()
    );

    if (memberIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Member record not found in space'
      }, { status: 404 });
    }

    const existingMember = space.members[memberIndex];

    // Link userId to member
    await db.collection('spaces').updateOne(
      {
        _id: new ObjectId(invitation.spaceId),
        'members.email': invitation.email.toLowerCase()
      },
      {
        $set: {
          'members.$.userId': user.id,
          'members.$.lastAccessedAt': new Date()
        }
      }
    );

    // Mark invitation as accepted
    await db.collection('invitations').updateOne(
      { _id: invitation._id },
      {
        $set: {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedBy: user.id
        }
      }
    );

    // Log activity
    await db.collection('space_activity_logs').insertOne({
      spaceId: invitation.spaceId.toString(),
      userId: user.id,
      action: 'invitation_accepted',
      details: {
        email: user.email,
        role: existingMember.role
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      spaceId: invitation.spaceId.toString(),
      role: existingMember.role
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}