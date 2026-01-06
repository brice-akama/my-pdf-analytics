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
    
    console.log('🔄 Accepting invitation with token:', token);

    // ✅ 1. Verify user is logged in
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      console.log('❌ User not logged in, requires auth');
      return NextResponse.json({
        success: false,
        requiresAuth: true,
        error: 'Please log in first'
      }, { status: 401 });
    }

    console.log('✅ User logged in:', {
      userId: user.id,
      userEmail: user.email
    });

    const db = await dbPromise;

    // ✅ 2. Find the invitation
    const invitation = await db.collection('invitations').findOne({
      token,
      status: 'pending'
    });

    if (!invitation) {
      console.log('❌ Invitation not found or already used');
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired invitation'
      }, { status: 404 });
    }

    console.log('✅ Invitation found:', {
      invitedEmail: invitation.email,
      invitedRole: invitation.role,
      spaceId: invitation.spaceId.toString()
    });

    // ✅ 3. Verify user's email matches invitation
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      console.log('❌ Email mismatch:', {
        userEmail: user.email,
        invitedEmail: invitation.email
      });
      return NextResponse.json({
        success: false,
        error: `This invitation is for ${invitation.email}. Please log in with that email.`
      }, { status: 403 });
    }

    // ✅ 4. CRITICAL: Find the space and verify member exists
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(invitation.spaceId)
    });

    if (!space) {
      console.log('❌ Space not found');
      return NextResponse.json({
        success: false,
        error: 'Space not found'
      }, { status: 404 });
    }

    // Find this specific member in the members array
    const memberIndex = space.members?.findIndex(
      (m: any) => m.email.toLowerCase() === invitation.email.toLowerCase()
    );

    if (memberIndex === -1) {
      console.log('❌ Member not found in space');
      return NextResponse.json({
        success: false,
        error: 'Member record not found in space'
      }, { status: 404 });
    }

    const existingMember = space.members[memberIndex];
    console.log('✅ Found member in space:', {
      email: existingMember.email,
      currentRole: existingMember.role,
      hasUserId: !!existingMember.userId
    });

    // ✅ 5. CRITICAL: Update THIS SPECIFIC member with userId
    const updateResult = await db.collection('spaces').updateOne(
      {
        _id: new ObjectId(invitation.spaceId),
        'members.email': invitation.email.toLowerCase()
      },
      {
        $set: {
          'members.$.userId': user.id, // ✅ Link THIS user to THIS member
          'members.$.lastAccessedAt': new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.log('⚠️ No changes made (member may already have userId)');
    } else {
      console.log('✅ Successfully linked userId to member:', {
        userId: user.id,
        email: invitation.email,
        role: existingMember.role
      });
    }

    // ✅ 6. Verify the update worked by fetching the updated space
    const updatedSpace = await db.collection('spaces').findOne({
      _id: new ObjectId(invitation.spaceId)
    });

    const updatedMember = updatedSpace?.members?.find(
      (m: any) => m.email.toLowerCase() === invitation.email.toLowerCase()
    );

    console.log('✅ Member after update:', {
      email: updatedMember?.email,
      role: updatedMember?.role,
      userId: updatedMember?.userId,
      hasUserId: !!updatedMember?.userId
    });

    // ✅ 7. Mark invitation as accepted
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

    console.log('✅ Invitation accepted successfully');

    // ✅ 8. Log activity
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
    console.error('❌ Accept invitation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}