import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const db = await dbPromise;

    console.log('🔍 Fetching invitation:', token);

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

    // Check expiration
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'This invitation has expired'
      }, { status: 400 });
    }

    // Get space info
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(invitation.spaceId)
    });

    if (!space) {
      return NextResponse.json({
        success: false,
        error: 'Space not found'
      }, { status: 404 });
    }

    // Get inviter info
    const inviter = await db.collection('users').findOne({
      _id: new ObjectId(invitation.invitedBy)
    });

    console.log('✅ Invitation found:', {
      email: invitation.email,
      role: invitation.role,
      spaceName: space.name
    });

    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        spaceName: space.name,
        spaceId: invitation.spaceId.toString(),
        inviterEmail: inviter?.email || 'Unknown',
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('❌ Get invitation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}