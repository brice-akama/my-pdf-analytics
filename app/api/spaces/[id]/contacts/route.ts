import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { sendSpaceInvitation } from '@/lib/emailService';

// GET: List all contacts in a space
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check if user has access to this space
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId),
      userId: user.id
    });

    if (!space) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied' 
      }, { status: 403 });
    }

// Get all members/contacts for this space
const members = space.members || [];

// Format the response
const contacts = members.map((member: any) => ({
      id: member.userId || member._id,
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
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}

// POST: Add a new contact to the space
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // ✅ FIXED: Check if user is owner using userId field
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId),
      userId: user.id  // ✅ Use userId (not ownerId)
    });

    if (!space) {
      return NextResponse.json({ 
        success: false,
        error: 'Space not found or access denied' 
      }, { status: 404 });
    }

    // Get request body
    const { email, role } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ 
        success: false,
        error: 'Email is required' 
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Validate role
    if (role && !['viewer', 'editor', 'admin'].includes(role)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid role' 
      }, { status: 400 });
    }

    // Check if contact already exists
    const existingMember = space.members?.find(
      (m: any) => m.email === email.trim()
    );

    if (existingMember) {
      return NextResponse.json({ 
        success: false,
        error: 'This user already has access to this space' 
      }, { status: 400 });
    }

    // Add new member
    const newMember = {
      email: email.trim(),
      role: role || 'viewer',
      addedBy: user.id,
      addedAt: new Date(),
      lastAccessedAt: null
    };

    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      { 
        $push: { members: newMember as any },
        $inc: { teamMembers: 1 }
      } as any
    );

    // TODO: Send invitation email to the new contact
    // await sendInvitationEmail(email, space.name, inviteLink)

    console.log(`✅ Contact added to space ${spaceId}: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Contact added successfully',
      contact: newMember
    });

  } catch (error) {
    console.error('❌ Add contact error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}