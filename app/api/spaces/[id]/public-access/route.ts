// app/api/spaces/[id]/public-access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

// Generate a unique, readable share link slug
function generateShareLink(spaceName: string): string {
  // Convert space name to URL-friendly slug
  const slug = spaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  
  // Add random suffix for uniqueness
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  
  return `${slug}-${randomSuffix}`;
}

// POST - Enable public access
export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const spaceId = params.id;
    
    // Verify user owns this space
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      requireEmail = true,
      requirePassword = false,
      password,
      expiresAt,
      viewLimit,
      branding
    } = body;
    
    const db = await dbPromise;
    
    // Get space
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });
    
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }
    
    // Check if user has access
    const hasAccess = space.members?.some(
      (m: any) => m.email === user.email && ['owner', 'admin', 'editor'].includes(m.role)
    );
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Generate unique share link (or reuse existing)
    const shareLink = space.publicAccess?.shareLink || generateShareLink(space.name);
    
    // Hash password if provided
    let hashedPassword;
    if (requirePassword && password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // Update space with public access settings
    const publicAccessConfig = {
      enabled: true,
      shareLink,
      requireEmail,
      requirePassword,
      password: hashedPassword,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      viewLimit: viewLimit || null,
      currentViews: space.publicAccess?.currentViews || 0,
      enabledAt: new Date(),
      enabledBy: user.id
    };
    
    const brandingConfig = branding || space.branding || {
      primaryColor: '#6366f1',
      companyName: user.email.split('@')[0]
    };
    
    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      {
        $set: {
          publicAccess: publicAccessConfig,
          branding: brandingConfig,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Public access enabled for space: ${spaceId}`);
    console.log(`   Share link: ${shareLink}`);
    
    return NextResponse.json({
      success: true,
      message: 'Public access enabled',
      shareLink,
      publicUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${shareLink}`,
      settings: {
        requireEmail,
        requirePassword,
        expiresAt,
        viewLimit
      }
    });
    
  } catch (error) {
    console.error('❌ Enable public access error:', error);
    return NextResponse.json({
      error: 'Failed to enable public access',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH - Update public access settings
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const spaceId = params.id;
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updates = await request.json();
    const db = await dbPromise;
    
    // Build update query
    const updateFields: any = {
      updatedAt: new Date()
    };
    
    if (updates.requireEmail !== undefined) {
      updateFields['publicAccess.requireEmail'] = updates.requireEmail;
    }
    
    if (updates.requirePassword !== undefined) {
      updateFields['publicAccess.requirePassword'] = updates.requirePassword;
    }
    
    if (updates.password) {
      const bcrypt = require('bcryptjs');
      updateFields['publicAccess.password'] = await bcrypt.hash(updates.password, 10);
    }
    
    if (updates.expiresAt) {
      updateFields['publicAccess.expiresAt'] = new Date(updates.expiresAt);
    }
    
    if (updates.viewLimit !== undefined) {
      updateFields['publicAccess.viewLimit'] = updates.viewLimit;
    }
    
    if (updates.branding) {
      Object.keys(updates.branding).forEach(key => {
        updateFields[`branding.${key}`] = updates.branding[key];
      });
    }
    
    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      { $set: updateFields }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Public access settings updated'
    });
    
  } catch (error) {
    console.error('❌ Update public access error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// DELETE - Disable public access
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const spaceId = params.id;
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = await dbPromise;
    
    // Disable public access but keep the share link (in case they want to re-enable)
    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      {
        $set: {
          'publicAccess.enabled': false,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Public access disabled for space: ${spaceId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Public access disabled'
    });
    
  } catch (error) {
    console.error('❌ Disable public access error:', error);
    return NextResponse.json({ error: 'Failed to disable' }, { status: 500 });
  }
}