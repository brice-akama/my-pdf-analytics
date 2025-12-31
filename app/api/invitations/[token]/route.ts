import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
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

    const space = await db.collection('spaces').findOne({
      _id: invitation.spaceId
    });

    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation.email,
        spaceName: space?.name,
        role: invitation.role,
        inviterEmail: invitation.invitedBy
      }
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}