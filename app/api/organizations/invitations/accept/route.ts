// app/api/organizations/invitations/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ POST: Accept organization invitation
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ 
        error: 'Organization ID required' 
      }, { status: 400 });
    }

    const db = await dbPromise;

    // Find pending invitation for this user's email
    const invitation = await db.collection('organization_members').findOne({
      organizationId,
      email: user.email.toLowerCase(),
      status: 'invited'
    });

    if (!invitation) {
      return NextResponse.json({ 
        error: 'No pending invitation found' 
      }, { status: 404 });
    }

    // Update invitation to active membership
    await db.collection('organization_members').updateOne(
      { _id: invitation._id },
      {
        $set: {
          userId: user.id,
          name:  user.email.split('@')[0],
          status: 'active',
          joinedAt: new Date(),
          lastActiveAt: new Date()
        }
      }
    );

    // Get organization details
    const org = await db.collection('organizations').findOne({
      _id: new ObjectId(organizationId)
    });

    console.log(`✅ User ${user.email} accepted invitation to ${org?.name}`);

    return NextResponse.json({
      success: true,
      message: `Welcome to ${org?.name}!`,
      organization: {
        id: organizationId,
        name: org?.name,
        slug: org?.slug,
        role: invitation.role
      }
    });

  } catch (error) {
    console.error('❌ Accept invitation error:', error);
    return NextResponse.json({ 
      error: 'Failed to accept invitation'
    }, { status: 500 });
  }
}