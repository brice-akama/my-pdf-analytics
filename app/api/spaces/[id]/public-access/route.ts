 // app/api/spaces/[id]/public-access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

function generateShareLink(spaceName: string): string {
  const slug = spaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  return `${slug}-${randomSuffix}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Create a NEW share link
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;

    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      label         = null,
      securityLevel = 'open',
      allowedEmails = [],
      allowedDomains = [],
      password,
      expiresAt,
      viewLimit,
    } = body;

    if (securityLevel === 'whitelist' && allowedEmails.length === 0 && (!allowedDomains || allowedDomains.length === 0)) {
      return NextResponse.json({ error: 'Whitelist security requires at least one allowed email or domain' }, { status: 400 });
    }

    if ((securityLevel === 'password' || securityLevel === 'whitelist') && !password) {
      return NextResponse.json({ error: 'Password required for this security level' }, { status: 400 });
    }

    const db = await dbPromise;

    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) });
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

    const isOwner = space.userId === user.id || space.createdBy === user.id;
    const isMember = space.members?.some(
      (m: any) => m.email === user.email && ['owner', 'admin', 'editor'].includes(m.role)
    );
    if (!isOwner && !isMember) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const shareLink = generateShareLink(space.name);

    let hashedPassword = null;
    if ((securityLevel === 'password' || securityLevel === 'whitelist') && password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${shareLink}`;

    const newLinkEntry = {
      shareLink,
      label:           label || null,
      securityLevel,
      requireEmail:    true,
      requirePassword: securityLevel === 'password' || securityLevel === 'whitelist',
      password:        hashedPassword,
      allowedEmails:   securityLevel === 'whitelist' ? allowedEmails.map((e: string) => e.toLowerCase()) : [],
      allowedDomains:  allowedDomains || [],
      expiresAt:       expiresAt ? new Date(expiresAt) : null,
      viewLimit:       viewLimit ? parseInt(viewLimit) : null,
      currentViews:    0,
      publicUrl,
      createdAt:       new Date(),
      createdBy:       user.id,
      enabled:         true,
    };

    // Migrate old single-object format to array if needed
    const currentAccess = space.publicAccess;
    const isAlreadyArray = Array.isArray(currentAccess);

    if (!isAlreadyArray && currentAccess && typeof currentAccess === 'object') {
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { $set: { publicAccess: [currentAccess, newLinkEntry], updatedAt: new Date() } }
      );
    } else {
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        {
          $push: { publicAccess: newLinkEntry } as any,
          $set:  { updatedAt: new Date() }
        }
      );
    }

    // ✅ AUDIT LOG — share link created
    await db.collection('activityLogs').insertOne({
      spaceId:         new ObjectId(spaceId),
      shareLink,
      visitorEmail:    null,
      performedBy:     user.email || user.id,
      performedByRole: 'owner',
      event:           'share_link_created',
      documentId:      null,
      documentName:    null,
      timestamp:       new Date(),
      ipAddress:       request.headers.get('x-forwarded-for') || 'unknown',
      userAgent:       request.headers.get('user-agent') || 'unknown',
      meta: {
        label:         label || null,
        securityLevel,
        requirePassword: securityLevel === 'password' || securityLevel === 'whitelist',
        allowedEmails:   securityLevel === 'whitelist' ? allowedEmails : [],
        expiresAt:       expiresAt || null,
        viewLimit:       viewLimit || null,
        publicUrl,
      }
    });

    console.log(`✅ New share link created: ${shareLink} | Security: ${securityLevel}`);

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
    return NextResponse.json({ error: 'Failed to create share link', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Return all share links
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
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
// PATCH — Update a specific share link
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;

    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { shareLink, updates } = body;
    if (!shareLink) return NextResponse.json({ error: 'shareLink required' }, { status: 400 });

    const db = await dbPromise;

    const setFields: any = {};
    if (updates.label     !== undefined) setFields['publicAccess.$[link].label']     = updates.label;
    if (updates.enabled   !== undefined) setFields['publicAccess.$[link].enabled']   = updates.enabled;
    if (updates.expiresAt !== undefined) setFields['publicAccess.$[link].expiresAt'] = updates.expiresAt ? new Date(updates.expiresAt) : null;
    if (updates.viewLimit !== undefined) setFields['publicAccess.$[link].viewLimit'] = updates.viewLimit;

    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      { $set: setFields },
      { arrayFilters: [{ 'link.shareLink': shareLink }] }
    );

    // ✅ AUDIT LOG — share link updated (label rename, enable/disable, etc.)
    const changeDescription = updates.enabled === false
      ? 'share_link_disabled'
      : updates.enabled === true
      ? 'share_link_enabled'
      : 'share_link_updated';

    await db.collection('activityLogs').insertOne({
      spaceId:         new ObjectId(spaceId),
      shareLink,
      visitorEmail:    null,
      performedBy:     user.email || user.id,
      performedByRole: 'owner',
      event:           changeDescription,
      documentId:      null,
      documentName:    null,
      timestamp:       new Date(),
      ipAddress:       request.headers.get('x-forwarded-for') || 'unknown',
      userAgent:       request.headers.get('user-agent') || 'unknown',
      meta:            { updates }
    });

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
    const params = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;

    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetLink = searchParams.get('shareLink');

    const db = await dbPromise;

    if (targetLink) {
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { $set: { 'publicAccess.$[link].enabled': false } },
        { arrayFilters: [{ 'link.shareLink': targetLink }] }
      );

      // ✅ AUDIT LOG — specific link disabled
      await db.collection('activityLogs').insertOne({
        spaceId:         new ObjectId(spaceId),
        shareLink:       targetLink,
        visitorEmail:    null,
        performedBy:     user.email || user.id,
        performedByRole: 'owner',
        event:           'share_link_disabled',
        documentId:      null,
        documentName:    null,
        timestamp:       new Date(),
        ipAddress:       request.headers.get('x-forwarded-for') || 'unknown',
        userAgent:       request.headers.get('user-agent') || 'unknown',
        meta:            { targetLink }
      });

    } else {
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { $set: { 'publicAccess.$[].enabled': false } }
      );

      // ✅ AUDIT LOG — all links disabled
      await db.collection('activityLogs').insertOne({
        spaceId:         new ObjectId(spaceId),
        shareLink:       null,
        visitorEmail:    null,
        performedBy:     user.email || user.id,
        performedByRole: 'owner',
        event:           'share_link_disabled',
        documentId:      null,
        documentName:    null,
        timestamp:       new Date(),
        ipAddress:       request.headers.get('x-forwarded-for') || 'unknown',
        userAgent:       request.headers.get('user-agent') || 'unknown',
        meta:            { scope: 'all_links' }
      });
    }

    return NextResponse.json({ success: true, message: 'Share link disabled' });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to disable share link' }, { status: 500 });
  }
}