//app/api/invite/[token]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const db = await dbPromise;

    // ✅ Find the invitation
    const invitation = await db.collection('invitations').findOne({
      token,
      status: 'pending'
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = await request.json();

    // ✅ Check if user already exists
    let user = await db.collection('users').findOne({ email: invitation.email });

    if (!user) {
      // Create new user account
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        email: invitation.email,
        passwordHash: hashedPassword,
        provider: 'local',
        profile: {
          firstName: firstName || '',
          lastName: lastName || '',
          fullName: `${firstName || ''} ${lastName || ''}`.trim(),
        },
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await db.collection('users').insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };

      console.log('✅ New user created:', user.email);
    }

    // ✅ CRITICAL: Update the member record in the space with the user ID
    await db.collection('spaces').updateOne(
      {
        _id: new ObjectId(invitation.spaceId),
        'members.email': invitation.email
      },
      {
        $set: {
          'members.$.userId': user._id.toString(), // ✅ Link user ID to member
          'members.$.lastAccessedAt': new Date()
        }
      }
    );

    // ✅ Mark invitation as accepted
    await db.collection('invitations').updateOne(
      { _id: invitation._id },
      {
        $set: {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedBy: user._id.toString()
        }
      }
    );

    // ✅ Create JWT token with space context
    const jwtToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        spaceId: invitation.spaceId.toString(),
        role: invitation.role // ✅ Include role in token
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: invitation.role
      },
      redirectTo: `/spaces/${invitation.spaceId}`
    });

    // Set HTTP-only cookie
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    console.log('✅ Invitation accepted:', {
      email: invitation.email,
      role: invitation.role,
      spaceId: invitation.spaceId.toString()
    });

    return response;

  } catch (error) {
    console.error('❌ Accept invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}