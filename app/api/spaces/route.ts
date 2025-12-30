// app/api/spaces/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // ✅ KEEP OLD LOGIC
    const spaces = await db.collection('spaces')
      .find({ userId: user.id })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      spaces: spaces.map(space => ({
        ...space,
        _id: space._id.toString()
      }))
    });

  } catch (error) {
    console.error('Get spaces error:', error);
    return NextResponse.json(
      { error: 'Failed to get spaces' },
      { status: 500 }
    );
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
