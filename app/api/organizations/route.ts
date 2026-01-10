// app/api/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ GET: List user's organizations
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Find all organizations where user is a member
    const memberships = await db.collection('organization_members')
      .find({ 
        userId: user.id,
        status: 'active'
      })
      .toArray();

    const orgIds = memberships.map(m => new ObjectId(m.organizationId));

    // Get full organization details
    const organizations = await db.collection('organizations')
      .find({ _id: { $in: orgIds } })
      .toArray();

    // Combine org data with user's role
    const orgsWithRoles = organizations.map(org => {
      const membership = memberships.find(m => m.organizationId === org._id.toString());
      
      return {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        role: membership?.role || 'member',
        isOwner: org.owner.userId === user.id,
        memberCount: org.memberCount || 0,
        spaceCount: org.spaceCount || 0,
        plan: org.plan || 'free',
        createdAt: org.createdAt,
        settings: org.settings
      };
    });

    console.log(`✅ User ${user.email} has access to ${orgsWithRoles.length} organizations`);

    return NextResponse.json({
      success: true,
      organizations: orgsWithRoles
    });

  } catch (error) {
    console.error('❌ Get organizations error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch organizations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ POST: Create new organization
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, plan = 'free' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: 'Organization name is required' 
      }, { status: 400 });
    }

    const db = await dbPromise;

    // Generate slug if not provided
    const orgSlug = slug || name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug is taken
    const existing = await db.collection('organizations').findOne({ slug: orgSlug });
    if (existing) {
      return NextResponse.json({ 
        error: 'Organization name already taken. Please choose another.' 
      }, { status: 400 });
    }

    // Create organization
    const organization = {
      name: name.trim(),
      slug: orgSlug,
      owner: {
        userId: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0]
      },
      plan,
      settings: {
        allowMemberSpaces: true,      // Members can create spaces
        requireApproval: false,        // Spaces don't need approval
        defaultSpacePrivacy: 'private',
        maxMembers: plan === 'free' ? 3 : plan === 'pro' ? 25 : 100,
        maxSpaces: plan === 'free' ? 5 : -1  // -1 = unlimited
      },
      memberCount: 1,
      spaceCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('organizations').insertOne(organization);
    const orgId = result.insertedId.toString();

    // Add owner as first member
    await db.collection('organization_members').insertOne({
      organizationId: orgId,
      userId: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: 'owner',
      permissions: {
        canCreateSpaces: true,
        canInviteMembers: true,
        canViewAllSpaces: true,
        canManageBilling: true,
        canManageSettings: true
      },
      status: 'active',
      joinedAt: new Date(),
      lastActiveAt: new Date()
    });

    console.log(`✅ Organization created: ${name} (${orgSlug}) by ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Organization created successfully',
      organization: {
        id: orgId,
        name: organization.name,
        slug: organization.slug,
        role: 'owner'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create organization error:', error);
    return NextResponse.json({ 
      error: 'Failed to create organization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}