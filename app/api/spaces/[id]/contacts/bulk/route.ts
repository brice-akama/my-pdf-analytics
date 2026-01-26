import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { sendSpaceInvitation } from '@/lib/emailService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbPromise;
    
    // Verify space ownership/admin
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId),
      userId: user.id
    });

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { emails, role } = await request.json();

    if (!Array.isArray(emails) || emails.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Minimum 2 emails required' },
        { status: 400 }
      );
    }

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as { email: string; reason: string }[]
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase();

      // Validate email format
      if (!emailRegex.test(trimmedEmail)) {
        results.failed.push({
          email: trimmedEmail,
          reason: 'Invalid email format'
        });
        continue;
      }

      // Check if already member
      const existingMember = space.members?.find(
        (m: any) => m.email === trimmedEmail
      );

      if (existingMember) {
        results.failed.push({
          email: trimmedEmail,
          reason: 'Already has access'
        });
        continue;
      }

      try {
        // Add member to space
        const newMember = {
          email: trimmedEmail,
          role: String(role),
          addedBy: user.id,
          addedAt: new Date(),
          lastAccessedAt: null,
          status: 'active',
          userId: null
        };

        await db.collection('spaces').updateOne(
          { _id: new ObjectId(spaceId) },
          {
            $push: { members: newMember },
            $inc: { teamMembers: 1 }
          } as any
        );

        // Generate invitation token
        const inviteToken = crypto.randomBytes(32).toString('hex');

        await db.collection('invitations').insertOne({
          token: inviteToken,
          spaceId: new ObjectId(spaceId),
          email: trimmedEmail,
          role,
          invitedBy: user.id,
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date()
        });

        // Send invitation email
        await sendSpaceInvitation({
          toEmail: trimmedEmail,
          spaceName: space.name,
          inviterName: user.email || 'A team member',
          role,
          inviteToken
        });

        results.success.push(trimmedEmail);

      } catch (error) {
        console.error(`Failed to invite ${trimmedEmail}:`, error);
        results.failed.push({
          email: trimmedEmail,
          reason: 'Server error'
        });
      }
    }

    console.log(`✅ Bulk invite completed: ${results.success.length} success, ${results.failed.length} failed`);

    return NextResponse.json({
      success: true,
      message: `Invited ${results.success.length} people`,
      results
    });

  } catch (error) {
    console.error('❌ Bulk invite error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
} 