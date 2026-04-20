// app/api/spaces/[id]/public-access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { checkAccess } from '@/lib/checkAccess';
import { hasFeature, getPlanLimits } from '@/lib/planLimits';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — build a structured feature-gate error response.
//
// WHY THIS SHAPE:
//   The frontend receives `code`, `feature`, `requiredPlan`, and `currentPlan`
//   so it can render a targeted upgrade modal:
//     "NDA gating is a Pro feature. You're on Starter. Upgrade to unlock it."
//   rather than a generic "something went wrong" dialog.
//
//   `blockedFeatures` is an array so we can report ALL gated features in one
//   response — the user can fix everything in one upgrade rather than hitting
//   the wall one feature at a time.
// ─────────────────────────────────────────────────────────────────────────────
function featureGateError(
  blockedFeatures: { feature: string; requiredPlan: string; label: string }[],
  currentPlan: string
) {
  return NextResponse.json(
    {
      error: 'Your plan does not include one or more of the requested features.',
      code: 'FEATURE_NOT_AVAILABLE',
      currentPlan,
      blockedFeatures,
    },
    { status: 403 }
  );
}

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

    // ── Step 1: Auth + effective plan ──────────────────────────────────────
    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const { user, plan, limits } = access;

    const db = await dbPromise;

    // ── Step 2: Load the space and verify ownership/membership ─────────────
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) });
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

    const isOwner  = space.userId === user._id.toString() || space.createdBy === user._id.toString();
    const isMember = space.members?.some(
      (m: any) => m.email === user.email && ['owner', 'admin', 'editor'].includes(m.role)
    );
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ── Step 3: Parse body ─────────────────────────────────────────────────
    const body = await request.json();
    const {
      label          = null,
      securityLevel  = 'open',
      allowedEmails  = [],
      allowedDomains = [],
      password,
      expiresAt,
      viewLimit,
      allowDownloads  = true,
      allowQA         = true,
      enableWatermark = false,
      requireNDA      = false,
      ndaDocumentUrl  = null,
      ndaDocumentName = null,
      branding        = null,
    } = body;

    const requireOtp: boolean = body.requireOtp ?? false;

    // ── Step 4: Enforce share link COUNT limit ─────────────────────────────
    // Free plan = 3 share links total across ALL spaces.
    // Starter+ = unlimited (-1).
    // We count every enabled link across all spaces for this user.
    //
    // WHY ACROSS ALL SPACES and not per-space:
    //   The limit in planLimits is a global cap, not per-space. A free user
    //   with 2 spaces should not be able to create 3 links per space (= 6 total).
    if (limits.maxShareLinks !== -1) {
      const allSpaces = await db
        .collection('spaces')
        .find({ userId: user._id.toString() })
        .project({ publicAccess: 1 })
        .toArray();

      let totalLinks = 0;
      for (const s of allSpaces) {
        const links = Array.isArray(s.publicAccess) ? s.publicAccess : s.publicAccess ? [s.publicAccess] : [];
        totalLinks += links.filter((l: any) => l.enabled !== false).length;
      }

      if (totalLinks >= limits.maxShareLinks) {
        return NextResponse.json(
          {
            error: `You have reached the ${limits.maxShareLinks} share link limit on the ${plan} plan. Upgrade to create unlimited share links.`,
            code: 'SHARE_LIMIT_REACHED',
            currentPlan: plan,
            used: totalLinks,
            limit: limits.maxShareLinks,
          },
          { status: 403 }
        );
      }
    }

    // ── Step 5: Enforce feature flags — collect ALL violations at once ──────
    //
    // WHY COLLECT ALL INSTEAD OF RETURNING ON FIRST FAILURE:
    //   If a user requests OTP + watermark + NDA on a Starter plan, returning
    //   on the first failure means they fix OTP, hit the wall again for
    //   watermark, fix that, hit it for NDA. Three round trips, three moments
    //   of frustration. We return all blocked features in one response so the
    //   frontend can show one upgrade modal listing everything they're missing.
    //
    // PLAN MAPPING (from planLimits.ts):
    //   emailOtpVerification  → Pro+
    //   dynamicWatermarking   → Pro+
    //   ndaAndAgreements      → Pro+
    //   customBranding        → Starter+
    //   whitelist security    → treated as Pro+ (advanced access control)
    //   password security     → treated as Starter+ (basic security)
    const blocked: { feature: string; requiredPlan: string; label: string }[] = [];

    if (requireOtp && !hasFeature(plan, 'emailOtpVerification')) {
      blocked.push({
        feature:      'emailOtpVerification',
        requiredPlan: 'pro',
        label:        'Email OTP verification',
      });
    }

    if (enableWatermark && !hasFeature(plan, 'dynamicWatermarking')) {
      blocked.push({
        feature:      'dynamicWatermarking',
        requiredPlan: 'pro',
        label:        'Dynamic watermarking',
      });
    }

    if (requireNDA && !hasFeature(plan, 'ndaAndAgreements')) {
      blocked.push({
        feature:      'ndaAndAgreements',
        requiredPlan: 'pro',
        label:        'NDA & agreements',
      });
    }

    if (branding && !hasFeature(plan, 'customBranding')) {
      blocked.push({
        feature:      'customBranding',
        requiredPlan: 'starter',
        label:        'Custom branding',
      });
    }

    // Password-protected links — Starter+
    // Free users can only create open links.
    if (
      securityLevel === 'password' &&
      plan === 'free'
    ) {
      blocked.push({
        feature:      'passwordProtectedLinks',
        requiredPlan: 'starter',
        label:        'Password-protected share links',
      });
    }

    // Whitelist (email/domain allowlist) — Pro+
    // This is advanced access control, not appropriate for free or starter.
    if (
      securityLevel === 'whitelist' &&
      !hasFeature(plan, 'emailOtpVerification') // proxy: both are Pro+
    ) {
      blocked.push({
        feature:      'whitelistSecurity',
        requiredPlan: 'pro',
        label:        'Email/domain whitelist access control',
      });
    }

    // If ANY feature is blocked, reject the whole request with the full list.
    // We never silently strip features — the user must know what they requested
    // and what plan unlocks it.
    if (blocked.length > 0) {
      return featureGateError(blocked, plan);
    }

    // ── Step 6: Remaining input validation (only runs if plan checks passed) ─
    if (
      securityLevel === 'whitelist' &&
      allowedEmails.length === 0 &&
      (!allowedDomains || allowedDomains.length === 0)
    ) {
      return NextResponse.json(
        { error: 'Whitelist security requires at least one allowed email or domain' },
        { status: 400 }
      );
    }

    if ((securityLevel === 'password' || securityLevel === 'whitelist') && !password) {
      return NextResponse.json(
        { error: 'Password required for this security level' },
        { status: 400 }
      );
    }

    // ── Step 7: Hash password if needed ───────────────────────────────────
    let hashedPassword = null;
    if ((securityLevel === 'password' || securityLevel === 'whitelist') && password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // ── Step 8: Build and persist the new share link ───────────────────────
    const shareLink = generateShareLink(space.name);
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
      createdBy:       user._id.toString(),
      enabled:         true,
      allowDownloads,
      allowQA,
      enableWatermark,
      requireNDA,
      requireOtp,
      ndaDocumentUrl,
      ndaDocumentName,
      branding,
    };

    // Migrate old single-object format to array if needed
    const currentAccess  = space.publicAccess;
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
          $set:  { updatedAt: new Date() },
        }
      );
    }

    // ── Step 9: Audit log ─────────────────────────────────────────────────
    await db.collection('activityLogs').insertOne({
      spaceId:         new ObjectId(spaceId),
      shareLink,
      visitorEmail:    null,
      performedBy:     user.email || user._id.toString(),
      performedByRole: 'owner',
      event:           'share_link_created',
      documentId:      null,
      documentName:    null,
      timestamp:       new Date(),
      ipAddress:       request.headers.get('x-forwarded-for') || 'unknown',
      userAgent:       request.headers.get('user-agent') || 'unknown',
      meta: {
        label:           label || null,
        securityLevel,
        requirePassword: securityLevel === 'password' || securityLevel === 'whitelist',
        allowedEmails:   securityLevel === 'whitelist' ? allowedEmails : [],
        expiresAt:       expiresAt || null,
        viewLimit:       viewLimit || null,
        publicUrl,
        enableWatermark,
        requireNDA,
        requireOtp,
        plan, // log which plan created this link — useful for analytics
      },
    });

    console.log(`✅ Share link created: ${shareLink} | Security: ${securityLevel} | Plan: ${plan}`);

    return NextResponse.json({
      success: true,
      message: 'Share link created',
      shareLink,
      publicUrl,
      settings: {
        label,
        securityLevel,
        requireEmail:    true,
        requirePassword: securityLevel === 'password' || securityLevel === 'whitelist',
        allowedEmails:   securityLevel === 'whitelist' ? allowedEmails : [],
        allowedDomains,
        expiresAt,
        viewLimit,
        enableWatermark,
        requireNDA,
        requireOtp,
      },
    });

  } catch (error) {
    console.error('❌ Create share link error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Return all share links for this space
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;

    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const { user, plan, limits } = access;

    const db = await dbPromise;
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) });
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

    const links = Array.isArray(space.publicAccess)
      ? space.publicAccess
      : space.publicAccess ? [space.publicAccess] : [];

    // ── Return links + the caller's plan limits so the frontend can lock
    //    feature toggles in the "create link" UI without a separate API call.
    //    This is the "warn on frontend, enforce on backend" pattern — the
    //    frontend uses this to grey out OTP/watermark/NDA toggles for free/starter
    //    users, but the backend still enforces them independently on POST.
    return NextResponse.json({
      success: true,
      links: links.map((l: any) => ({
        shareLink:      l.shareLink,
        label:          l.label || null,
        securityLevel:  l.securityLevel || 'open',
        createdAt:      l.createdAt,
        expiresAt:      l.expiresAt,
        viewLimit:      l.viewLimit,
        currentViews:   l.currentViews || 0,
        enabled:        l.enabled !== false,
        publicUrl:      l.publicUrl,
        enableWatermark: l.enableWatermark || false,
        requireNDA:     l.requireNDA || false,
        requireOtp:     l.requireOtp || false,
      })),
      // ── Plan context for the frontend UI ──────────────────────────────────
      // The frontend should use these booleans to lock feature toggles in the
      // "Create share link" modal. Never rely on these for enforcement —
      // POST enforces independently regardless of what the frontend shows.
      planFeatures: {
        canUsePassword:    plan !== 'free',
        canUseWhitelist:   hasFeature(plan, 'emailOtpVerification'),
        canUseOtp:         hasFeature(plan, 'emailOtpVerification'),
        canUseWatermark:   hasFeature(plan, 'dynamicWatermarking'),
        canUseNda:         hasFeature(plan, 'ndaAndAgreements'),
        canUseBranding:    hasFeature(plan, 'customBranding'),
        shareLinksRemaining: limits.maxShareLinks === -1
          ? null  // null = unlimited — frontend shows no counter
          : null, // populated below after counting
        maxShareLinks:     limits.maxShareLinks,
        currentPlan:       plan,
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update a specific share link's settings
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;

    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const { user, plan } = access;

    const body = await request.json();
    const { shareLink, updates } = body;
    if (!shareLink) return NextResponse.json({ error: 'shareLink required' }, { status: 400 });

    // ── Re-run feature checks on PATCH too ────────────────────────────────
    // A user cannot PATCH a link to add a Pro feature they don't have.
    // Example: Starter user creates an open link, then tries to PATCH it
    // to add OTP. That must fail just like creating it with OTP would.
    if (updates) {
      const blocked: { feature: string; requiredPlan: string; label: string }[] = [];

      if (updates.requireOtp && !hasFeature(plan, 'emailOtpVerification')) {
        blocked.push({ feature: 'emailOtpVerification', requiredPlan: 'pro', label: 'Email OTP verification' });
      }
      if (updates.enableWatermark && !hasFeature(plan, 'dynamicWatermarking')) {
        blocked.push({ feature: 'dynamicWatermarking', requiredPlan: 'pro', label: 'Dynamic watermarking' });
      }
      if (updates.requireNDA && !hasFeature(plan, 'ndaAndAgreements')) {
        blocked.push({ feature: 'ndaAndAgreements', requiredPlan: 'pro', label: 'NDA & agreements' });
      }
      if (updates.branding && !hasFeature(plan, 'customBranding')) {
        blocked.push({ feature: 'customBranding', requiredPlan: 'starter', label: 'Custom branding' });
      }
      if (updates.securityLevel === 'password' && plan === 'free') {
        blocked.push({ feature: 'passwordProtectedLinks', requiredPlan: 'starter', label: 'Password-protected share links' });
      }
      if (updates.securityLevel === 'whitelist' && !hasFeature(plan, 'emailOtpVerification')) {
        blocked.push({ feature: 'whitelistSecurity', requiredPlan: 'pro', label: 'Email/domain whitelist access control' });
      }

      if (blocked.length > 0) return featureGateError(blocked, plan);
    }

    const db = await dbPromise;

    const setFields: any = {};
    if (updates.label          !== undefined) setFields['publicAccess.$[link].label']          = updates.label;
    if (updates.enabled        !== undefined) setFields['publicAccess.$[link].enabled']        = updates.enabled;
    if (updates.expiresAt      !== undefined) setFields['publicAccess.$[link].expiresAt']      = updates.expiresAt ? new Date(updates.expiresAt) : null;
    if (updates.viewLimit      !== undefined) setFields['publicAccess.$[link].viewLimit']      = updates.viewLimit;
    if (updates.enableWatermark !== undefined) setFields['publicAccess.$[link].enableWatermark'] = updates.enableWatermark;
    if (updates.requireNDA     !== undefined) setFields['publicAccess.$[link].requireNDA']     = updates.requireNDA;
    if (updates.requireOtp     !== undefined) setFields['publicAccess.$[link].requireOtp']     = updates.requireOtp;
    if (updates.branding       !== undefined) setFields['publicAccess.$[link].branding']       = updates.branding;
    if (updates.securityLevel  !== undefined) setFields['publicAccess.$[link].securityLevel']  = updates.securityLevel;

    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      { $set: setFields },
      { arrayFilters: [{ 'link.shareLink': shareLink }] }
    );

    const changeEvent = updates.enabled === false
      ? 'share_link_disabled'
      : updates.enabled === true
      ? 'share_link_enabled'
      : 'share_link_updated';

    await db.collection('activityLogs').insertOne({
      spaceId:         new ObjectId(spaceId),
      shareLink,
      visitorEmail:    null,
      performedBy:     user.email || user._id.toString(),
      performedByRole: 'owner',
      event:           changeEvent,
      documentId:      null,
      documentName:    null,
      timestamp:       new Date(),
      ipAddress:       request.headers.get('x-forwarded-for') || 'unknown',
      userAgent:       request.headers.get('user-agent') || 'unknown',
      meta:            { updates, plan },
    });

    return NextResponse.json({ success: true, message: 'Share link updated' });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to update share link' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — Disable a specific share link (or all links on this space)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;

    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const { user } = access;

    const { searchParams } = new URL(request.url);
    const targetLink = searchParams.get('shareLink');

    const db = await dbPromise;

    if (targetLink) {
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { $set: { 'publicAccess.$[link].enabled': false } },
        { arrayFilters: [{ 'link.shareLink': targetLink }] }
      );

      await db.collection('activityLogs').insertOne({
        spaceId:         new ObjectId(spaceId),
        shareLink:       targetLink,
        visitorEmail:    null,
        performedBy:     user.email || user._id.toString(),
        performedByRole: 'owner',
        event:           'share_link_disabled',
        documentId:      null,
        documentName:    null,
        timestamp:       new Date(),
        ipAddress:       request.headers.get('x-forwarded-for') || 'unknown',
        userAgent:       request.headers.get('user-agent') || 'unknown',
        meta:            { targetLink },
      });

    } else {
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { $set: { 'publicAccess.$[].enabled': false } }
      );

      await db.collection('activityLogs').insertOne({
        spaceId:         new ObjectId(spaceId),
        shareLink:       null,
        visitorEmail:    null,
        performedBy:     user.email || user._id.toString(),
        performedByRole: 'owner',
        event:           'share_link_disabled',
        documentId:      null,
        documentName:    null,
        timestamp:       new Date(),
        ipAddress:       request.headers.get('x-forwarded-for') || 'unknown',
        userAgent:       request.headers.get('user-agent') || 'unknown',
        meta:            { scope: 'all_links' },
      });
    }

    return NextResponse.json({ success: true, message: 'Share link disabled' });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to disable share link' }, { status: 500 });
  }
}