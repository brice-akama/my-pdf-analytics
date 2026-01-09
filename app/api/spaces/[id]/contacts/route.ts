//app/api/spaces/[id]/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { sendSpaceInvitation } from '@/lib/emailService';

/* ======================================================
   GET: List all contacts in a space
====================================================== */
export async function GET(
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

    const members = space.members || [];

    const contacts = members.map((member: any) => ({
      id: member.userId || null,
      email: member.email,
      role: member.role || 'viewer',
      addedAt: member.addedAt || space.createdAt,
      lastAccess: member.lastAccessedAt || null
    }));

    return NextResponse.json({
      success: true,
      contacts,
      count: contacts.length
    });

  } catch (error) {
    console.error('❌ Get contacts error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/* ======================================================
   POST: Add contact + create invitation
====================================================== */
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

    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId),
      userId: user.id
    });

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Space not found or access denied' },
        { status: 404 }
      );
    }

    const { email, role } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (role && !['viewer', 'editor', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    const existingMember = space.members?.find(
      (m: any) => m.email === email.trim()
    );

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'User already has access' },
        { status: 400 }
      );
    }

    
    /* ======================================================
   1. Add member to space
====================================================== */
const newMember = {
  email: email.trim().toLowerCase(), // Always lowercase
  role: String(role || 'viewer'), // Force new string
  addedBy: user.id,
  addedAt: new Date(),
  lastAccessedAt: null,
  status: 'active',
  userId: null // Will be filled when they accept invite
};

await db.collection('spaces').updateOne(
  { _id: new ObjectId(spaceId) },
  {
    $push: { 
      members: newMember
    },
    $inc: { teamMembers: 1 }
  } as any
);

    /* ======================================================
       2. Generate invitation token
    ====================================================== */
    const inviteToken = crypto.randomBytes(32).toString('hex');

    await db.collection('invitations').insertOne({
      token: inviteToken,
      spaceId: new ObjectId(spaceId),
      email: email.trim(),
      role: role || 'viewer',
      invitedBy: user.id,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    });

    /* ======================================================
       3. Build invitation URL
    ====================================================== */
    const invitationLink =
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${inviteToken}`;

    /* ======================================================
       4. Send invitation email
    ====================================================== */
    await sendSpaceInvitation({
      toEmail: email.trim(),
      spaceName: space.name,
      inviterName: user.email || 'A team member',
      role: role || 'viewer',
      inviteToken
    });

    console.log(`✅ Contact invited to space ${spaceId}: ${email}`);
    console.log(`📧 Invitation link: ${invitationLink}`);

    return NextResponse.json({
      success: true,
      message: 'Contact added successfully',
      contact: newMember,
      invitationLink
    });

  } catch (error) {
    console.error('❌ Add contact error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
