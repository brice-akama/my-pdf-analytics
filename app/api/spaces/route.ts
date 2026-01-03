// app/api/spaces/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // ✅ Get spaces owned by user
    const ownedSpaces = await db.collection('spaces')
      .find({ userId: user.id })
      .sort({ updatedAt: -1 })
      .toArray();

    // ✅ Get spaces where user is a member
    const memberSpaces = await db.collection('spaces')
      .find({ 
        'members.email': user.email,
        userId: { $ne: user.id } // Exclude owned spaces
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Format owned spaces to match frontend expectations
    const formattedOwned = ownedSpaces.map(space => ({
      _id: space._id.toString(),
      name: space.name,
      description: space.description || '',
      type: space.type || 'custom',
      status: space.status || 'active',
      template: space.template,
      color: space.color || '#8B5CF6',
      
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
      isOwner: true,
      role: 'owner'
    }));

    // Format member spaces
    const formattedMember = memberSpaces.map(space => {
      // Find user's role in this space
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

    // ✅ Combine both arrays
    const allSpaces = [...formattedOwned, ...formattedMember];

    console.log(`✅ Returning ${allSpaces.length} spaces (${formattedOwned.length} owned, ${formattedMember.length} member)`);

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

      // ✅ NEW optional fields (safe defaults)
      description,
      type,
      privacy,
      autoExpiry,
      expiryDate,
      requireNDA,
      enableWatermark,
      allowDownloads,
      notifyOnView
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // ✅ KEEP OLD STRUCTURE + ADD NEW SCHEMA FIELDS
    const space = {
      // 🔒 Ownership
      userId: user.id,

      // 🏷️ Basic info
      name: name.trim(),
      description: description || '',
      type: type || 'custom',
      template: template || null,
      color: color || '#8B5CF6',
      active: true,
      status: 'active',

      // 👥 Members (KEEP OLD MODEL)
      members: [
        {
          email: user.email,
          role: 'owner',
          addedAt: new Date()
        }
      ],

      // ⚙️ NEW SETTINGS BLOCK
      settings: {
        privacy: privacy || 'private',
        autoExpiry: autoExpiry || false,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        requireNDA: requireNDA || false,
        enableWatermark: enableWatermark || false,
        allowDownloads: allowDownloads !== false, // default true
        notifyOnView: notifyOnView !== false       // default true
      },

      // 🌍 Public access (NEW)
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

      // 🎨 Branding (NEW)
      branding: {
        logoUrl: null,
        primaryColor: color || '#8B5CF6',
        companyName: null,
        welcomeMessage: 'Welcome to our secure data room',
        coverImageUrl: null
      },

      // 📊 Counters (NEW)
      documentsCount: 0,
      viewsCount: 0,
      teamMembers: 1,

      // 🧾 Logs (NEW)
      visitors: [],
      activityLog: [],

      // 🕒 Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date()
    };

    const result = await db.collection('spaces').insertOne(space);

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
