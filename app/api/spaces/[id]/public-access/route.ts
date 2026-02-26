/// app/api/spaces/[id]/public-access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

// Generate a UNIQUE share link slug every single time
function generateShareLink(spaceName: string): string {
  const slug = spaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);

  // 8 random bytes = 16 hex chars — guaranteed unique every call
  const randomSuffix = crypto.randomBytes(8).toString('hex');

  return `${slug}-${randomSuffix}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Create a NEW share link (never reuses old ones)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
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

    const body = await request.json();
    const {
      label        = null,
      securityLevel = 'open',
      allowedEmails = [],
      allowedDomains = [],
      password,
      expiresAt,
      viewLimit,
    } = body;

    // Validation
    if (securityLevel === 'whitelist' && allowedEmails.length === 0 && (!allowedDomains || allowedDomains.length === 0)) {
      return NextResponse.json({
        error: 'Whitelist security requires at least one allowed email or domain'
      }, { status: 400 });
    }

    if ((securityLevel === 'password' || securityLevel === 'whitelist') && !password) {
      return NextResponse.json({
        error: 'Password required for this security level'
      }, { status: 400 });
    }

    const db = await dbPromise;

    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const isOwner = space.userId === user.id || space.createdBy === user.id;
    const isMember = space.members?.some(
      (m: any) => m.email === user.email && ['owner', 'admin', 'editor'].includes(m.role)
    );

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ── ALWAYS generate a fresh unique slug ───────────────────────────────
    const shareLink = generateShareLink(space.name);

    // Hash password if needed
    let hashedPassword = null;
    if ((securityLevel === 'password' || securityLevel === 'whitelist') && password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${shareLink}`;

    // ── Build the new link entry ──────────────────────────────────────────
    const newLinkEntry = {
      shareLink,
      label:         label || null,
      securityLevel,

      requireEmail:    true,
      requirePassword: securityLevel === 'password' || securityLevel === 'whitelist',
      password:        hashedPassword,

      allowedEmails:  securityLevel === 'whitelist'
        ? allowedEmails.map((e: string) => e.toLowerCase())
        : [],
      allowedDomains: allowedDomains || [],

      expiresAt:  expiresAt  ? new Date(expiresAt)  : null,
      viewLimit:  viewLimit  ? parseInt(viewLimit)   : null,
      currentViews: 0,

      publicUrl,
      createdAt: new Date(),
      createdBy: user.id,
      enabled:   true,
    };

    // ── Migrate old single-object format to array if needed ──────────────
    const currentAccess = space.publicAccess;
    const isAlreadyArray = Array.isArray(currentAccess);

    if (!isAlreadyArray && currentAccess && typeof currentAccess === 'object') {
      // Convert the existing object into an array first, then push new entry
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        {
          $set: {
            publicAccess: [currentAccess, newLinkEntry], // migrate + add new
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Already an array (or empty) — just push
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        {
          $push: { publicAccess: newLinkEntry } as any,
          $set:  { updatedAt: new Date() }
        }
      );
    }

    console.log(`✅ New share link created for space: ${spaceId}`);
    console.log(`   Label: ${label || '(none)'}`);
    console.log(`   Security: ${securityLevel}`);
    console.log(`   Slug: ${shareLink}`);

    return NextResponse.json({
      success: true,
      message: 'Share link created',
      shareLink,
      publicUrl,
      settings: {
        label,
        securityLevel,
        requireEmail: true,
        requirePassword: securityLevel === 'password' || securityLevel === 'whitelist',
        allowedEmails: securityLevel === 'whitelist' ? allowedEmails : [],
        allowedDomains,
        expiresAt,
        viewLimit,
      }
    });

  } catch (error) {
    console.error('❌ Create share link error:', error);
    return NextResponse.json({
      error: 'Failed to create share link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Return all share links for this space (for analytics)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise
      ? await context.params
      : context.params;

    const spaceId = params.id;
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) });
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

    const links = Array.isArray(space.publicAccess)
      ? space.publicAccess
      : space.publicAccess ? [space.publicAccess] : [];

    return NextResponse.json({
      success: true,
      links: links.map((l: any) => ({
        shareLink:     l.shareLink,
        label:         l.label || null,
        securityLevel: l.securityLevel || 'open',
        createdAt:     l.createdAt,
        expiresAt:     l.expiresAt,
        viewLimit:     l.viewLimit,
        currentViews:  l.currentViews || 0,
        enabled:       l.enabled !== false,
        publicUrl:     l.publicUrl,
      }))
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update a specific share link (disable, rename, etc.)
// ─────────────────────────────────────────────────────────────────────────────
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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { shareLink, updates } = body;

    if (!shareLink) {
      return NextResponse.json({ error: 'shareLink required' }, { status: 400 });
    }

    const db = await dbPromise;

    // Build $set for the specific array element
    const setFields: any = {};
    if (updates.label       !== undefined) setFields['publicAccess.$[link].label']         = updates.label;
    if (updates.enabled     !== undefined) setFields['publicAccess.$[link].enabled']        = updates.enabled;
    if (updates.expiresAt   !== undefined) setFields['publicAccess.$[link].expiresAt']      = updates.expiresAt ? new Date(updates.expiresAt) : null;
    if (updates.viewLimit   !== undefined) setFields['publicAccess.$[link].viewLimit']      = updates.viewLimit;

    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      { $set: setFields },
      { arrayFilters: [{ 'link.shareLink': shareLink }] }
    );

    return NextResponse.json({ success: true, message: 'Share link updated' });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to update share link' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — Disable a specific share link (or all)
// ─────────────────────────────────────────────────────────────────────────────
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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetLink = searchParams.get('shareLink');

    const db = await dbPromise;

    if (targetLink) {
      // Disable a specific link
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        {
          $set: { 'publicAccess.$[link].enabled': false },
        },
        { arrayFilters: [{ 'link.shareLink': targetLink }] }
      );
    } else {
      // Disable ALL links
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { $set: { 'publicAccess.$[].enabled': false } }
      );
    }

    return NextResponse.json({ success: true, message: 'Share link disabled' });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to disable share link' }, { status: 500 });
  }
}