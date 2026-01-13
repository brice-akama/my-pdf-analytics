 

// app/api/spaces/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // ✅ NEW: Get organizationId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const db = await dbPromise;

    let ownedSpaces = [];
    let memberSpaces = [];

    if (organizationId) {
      // ✅ ORGANIZATION MODE: Fetch spaces for specific organization
      
      // Check if user is member of this organization
      const orgMembership = await db.collection('organization_members').findOne({
        organizationId,
        userId: user.id,
        status: 'active'
      });

      if (!orgMembership) {
        return NextResponse.json({ 
          error: 'Access denied to this organization' 
        }, { status: 403 });
      }

      // Get spaces based on organization permissions
      if (orgMembership.permissions.canViewAllSpaces) {
        // Admin/Owner sees all org spaces
        ownedSpaces = await db.collection('spaces')
          .find({ organizationId })
          .sort({ updatedAt: -1 })
          .toArray();
      } else {
        // Members see only their spaces + spaces shared with them
        // ✅ ALL organization members can see ALL org spaces
ownedSpaces = await db.collection('spaces')
  .find({ organizationId })
  .sort({ updatedAt: -1 })
  .toArray();

      }
    } else {
  // ✅ PERSONAL MODE: Fetch user's personal spaces (no organization)
  
  console.log('🔍 DEBUG - Searching personal spaces for user:', user.id);
  console.log('🔍 DEBUG - User email:', user.email);
  
  // ✅ FIX: Match BOTH null and non-existent organizationId
  ownedSpaces = await db.collection('spaces')
    .find({ 
      userId: user.id,
      $or: [
        { organizationId: null },
        { organizationId: { $exists: false } }
      ]
    })
    .sort({ updatedAt: -1 })
    .toArray();

  console.log('🔍 DEBUG - Found owned personal spaces:', ownedSpaces.length);
  if (ownedSpaces.length > 0) {
    console.log('🔍 DEBUG - First space:', ownedSpaces[0].name, '| orgId:', ownedSpaces[0].organizationId);
  }

      // Member of personal spaces
  memberSpaces = await db.collection('spaces')
    .find({ 
      'members.email': user.email,
      userId: { $ne: user.id },
      $or: [
        { organizationId: null },
        { organizationId: { $exists: false } }
      ]
    })
    .sort({ createdAt: -1 })
    .toArray();
    
  console.log('🔍 DEBUG - Found member personal spaces:', memberSpaces.length);
}

    // Format owned spaces
    const formattedOwned = ownedSpaces.map(space => ({
      _id: space._id.toString(),
      name: space.name,
      description: space.description || '',
      type: space.type || 'custom',
      status: space.status || 'active',
      template: space.template,
      color: space.color || '#8B5CF6',
      
      // ✅ NEW: Organization info
      organizationId: space.organizationId || null,
      createdBy: space.createdBy || space.userId,
      
      // Owner info
      owner: {
        name: user.email,
        email: user.email
      },
      
      // Counters
      documentsCount: space.documentsCount || 0,
      teamMembers: space.teamMembers || space.members?.length || 1,
      viewsCount: space.viewsCount || 0,
      
      // Timestamps
      lastActivity: space.lastActivity || space.updatedAt || space.createdAt,
      createdAt: space.createdAt,
      
      // Permissions (for owner, all are true)
      permissions: {
        canView: true,
        canEdit: true,
        canShare: true,
        canDownload: true
      },
      
      // Flags
      isOwner: space.userId === user.id || space.createdBy === user.id,
      role: space.userId === user.id ? 'owner' : 'admin'
    }));

    // Format member spaces
    const formattedMember = memberSpaces.map(space => {
      const member = space.members?.find((m: any) => m.email === user.email);
      const role = member?.role || 'viewer';
      
      return {
        _id: space._id.toString(),
        name: space.name,
        description: space.description || '',
        type: space.type || 'custom',
        status: space.status || 'active',
        template: space.template,
        color: space.color || '#8B5CF6',
        
        // ✅ NEW: Organization info
        organizationId: space.organizationId || null,
        createdBy: space.createdBy || space.userId,
        
        // Counters
        documentsCount: space.documentsCount || 0,
        teamMembers: space.teamMembers || space.members?.length || 1,
        viewsCount: space.viewsCount || 0,
        
        // Timestamps
        lastActivity: space.lastActivity || space.updatedAt || space.createdAt,
        createdAt: space.createdAt,
        
        // Permissions based on role
        permissions: {
          canView: true,
          canEdit: role === 'editor' || role === 'admin',
          canShare: role === 'admin',
          canDownload: space.settings?.allowDownloads !== false
        },
        
        // Flags
        isOwner: false,
        role: role
      };
    });

    // Combine both arrays
    const allSpaces = [...formattedOwned, ...formattedMember];

    console.log(`✅ Returning ${allSpaces.length} spaces (${formattedOwned.length} owned, ${formattedMember.length} member)${organizationId ? ` for org ${organizationId}` : ''}`);

    return NextResponse.json({
      success: true,
      spaces: allSpaces
    });

  } catch (error) {
    console.error('❌ Fetch spaces error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      template,
      color,
      description,
      type,
      privacy,
      autoExpiry,
      expiryDate,
      requireNDA,
      enableWatermark,
      allowDownloads,
      notifyOnView,
      
      // ✅ NEW: Organization support
      organizationId
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // ✅ NEW: Verify organization membership and permissions
    if (organizationId) {
      const membership = await db.collection('organization_members').findOne({
        organizationId,
        userId: user.id,
        status: 'active'
      });

      if (!membership) {
        return NextResponse.json({ 
          error: 'You are not a member of this organization' 
        }, { status: 403 });
      }

      if (!membership.permissions.canCreateSpaces) {
        return NextResponse.json({ 
          error: 'You do not have permission to create spaces in this organization' 
        }, { status: 403 });
      }

      // ✅ Check organization space limit
      const org = await db.collection('organizations').findOne({
        _id: new ObjectId(organizationId)
      });

      if (org && org.settings.maxSpaces !== -1) {
        const currentSpaces = await db.collection('spaces')
          .countDocuments({ organizationId });
        
        if (currentSpaces >= org.settings.maxSpaces) {
          return NextResponse.json({ 
            error: `Space limit reached (${org.settings.maxSpaces}). Upgrade your plan.` 
          }, { status: 400 });
        }
      }
    }

    // Create space with organization link
    const space = {
      // 🔒 Ownership
      userId: user.id,
      createdBy: user.id,  // ✅ NEW: Track who created it
      
      // ✅ NEW: Organization link
      organizationId: organizationId || null,

      // 🏷️ Basic info
      name: name.trim(),
      description: description || '',
      type: type || 'custom',
      template: template || null,
      color: color || '#8B5CF6',
      active: true,
      status: 'active',

      // 👥 Members
      // ✅ NEW CODE: Add creator + all org members
members: await (async () => {
  const membersList = [
    {
      email: user.email,
      role: 'owner',
      addedAt: new Date()
    }
  ];

  // ✅ If space belongs to organization, add all org members
  if (organizationId) {
    const orgMembers = await db.collection('organization_members')
      .find({
        organizationId,
        status: 'active',
        email: { $ne: user.email } // Don't duplicate creator
      })
      .toArray();

    // Add each org member to space members with their org role
    orgMembers.forEach(orgMember => {
      membersList.push({
        email: orgMember.email,
        role: orgMember.role === 'owner' || orgMember.role === 'admin' ? 'admin' : 'editor',
        addedAt: new Date()
      });
    });
  }

  return membersList;
})(),

      // ⚙️ Settings
      settings: {
        privacy: privacy || 'private',
        autoExpiry: autoExpiry || false,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        requireNDA: requireNDA || false,
        enableWatermark: enableWatermark || false,
        allowDownloads: allowDownloads !== false,
        notifyOnView: notifyOnView !== false
      },

      // 🌍 Public access
      publicAccess: {
        enabled: false,
        shareLink: null,
        requireEmail: true,
        requirePassword: false,
        password: null,
        expiresAt: null,
        viewLimit: null,
        currentViews: 0
      },

      // 🎨 Branding
      branding: {
        logoUrl: null,
        primaryColor: color || '#8B5CF6',
        companyName: null,
        welcomeMessage: 'Welcome to our secure data room',
        coverImageUrl: null
      },

      // 📊 Counters
      documentsCount: 0,
      viewsCount: 0,
      teamMembers: 1,

      // 🧾 Logs
      visitors: [],
      activityLog: [],

      // 🕒 Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date()
    };

    const result = await db.collection('spaces').insertOne(space);

    // ✅ NEW: Update organization space count
    if (organizationId) {
      await db.collection('organizations').updateOne(
        { _id: new ObjectId(organizationId) },
        { 
          $inc: { spaceCount: 1 },
          $set: { updatedAt: new Date() }
        }
      );
    }

    return NextResponse.json({
      success: true,
      spaceId: result.insertedId.toString(),
      space: {
        ...space,
        _id: result.insertedId.toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create space error:', error);
    return NextResponse.json(
      { error: 'Failed to create space' },
      { status: 500 }
    );
  }
}