// app/api/admin/users/[id]/route.ts
//
// WHAT THIS FILE DOES:
//   Returns full detail for one user: profile, billing state, their documents,
//   their recent audit log activity, and their signature requests.
//   Also handles PATCH for plan/status changes and DELETE for account removal.
//
// ROUTES:
//   GET    /api/admin/users/[id]  — fetch user detail
//   PATCH  /api/admin/users/[id]  — update plan, subscriptionStatus, or ban
//   DELETE /api/admin/users/[id]  — delete account and all their documents
//
// NEXT.JS 15 COMPLIANCE:
//   params is now a Promise — must be awaited before accessing any property.
//   Every handler uses: const { id } = await params
//   The old getUserId(params) helper is removed — it was accessing params.id
//   synchronously which throws in Next.js 15.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { dbPromise } from '@/app/api/lib/mongodb'
import { ObjectId } from 'mongodb'

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'default_secret'
)

async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, ADMIN_SECRET)
    return payload
  } catch {
    return null
  }
}

// ── GET — full user detail ─────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // ✅ Next.js 15: params is a Promise — must be awaited
    const { id: userId } = await params

    const db = await dbPromise

    // Try ObjectId first, fallback to string id
    let user: any = null
    try {
      user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { passwordHash: 0 } }
      )
    } catch {
      user = await db.collection('users').findOne(
        { id: userId },
        { projection: { passwordHash: 0 } }
      )
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userIdStr = user._id.toString()

    // ── Fetch related data in parallel ─────────────────────────────────────
    const [
      documents,
      totalDocs,
      recentActivity,
      signatureRequests,
      spaces,
    ] = await Promise.all([
      // Their 10 most recent documents
      db.collection('documents')
        .find(
          { userId: userIdStr, archived: { $ne: true } },
          { projection: { fileData: 0 } }
        )
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),

      // Total doc count
      db.collection('documents').countDocuments({
        userId: userIdStr,
        archived: { $ne: true },
      }),

      // Recent audit log entries for this user
      db.collection('audit_log')
        .find({ user_id: userIdStr })
        .sort({ created_at: -1 })
        .limit(15)
        .toArray(),

      // Their signature requests
      db.collection('signature_requests')
        .find({ createdBy: userIdStr })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),

      // Their spaces
      db.collection('spaces')
        .find({ userId: userIdStr })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
    ])

    return NextResponse.json({
      user: {
        id: userIdStr,
        email: user.email,
        name: user.profile?.fullName || user.email?.split('@')[0],
        avatarUrl: user.profile?.avatarUrl || null,
        companyName: user.profile?.companyName || null,
        firstName: user.profile?.firstName || null,
        lastName: user.profile?.lastName || null,
        plan: user.plan || 'free',
        subscriptionStatus: user.subscriptionStatus || 'inactive',
        billingCycle: user.billingCycle || null,
        trialEndsAt: user.trialEndsAt || null,
        currentPeriodEnd: user.currentPeriodEnd || null,
        paddleCustomerId: user.paddleCustomerId || null,
        paddleSubscriptionId: user.paddleSubscriptionId || null,
        provider: user.provider || 'local',
        emailVerified: user.email_verified || false,
        industry: user.industry || null,
        companySize: user.companySize || null,
        useCases: user.useCases || [],
        totalStorageBytes: user.totalStorageUsedBytes || 0,
        totalStorageGB: parseFloat(((user.totalStorageUsedBytes || 0) / 1073741824).toFixed(3)),
        banned: user.banned || false,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.lastLoginAt || null,
      },
      stats: {
        totalDocuments: totalDocs,
        totalSignatures: signatureRequests.length,
        totalSpaces: spaces.length,
      },
      documents: documents.map(doc => ({
        id: doc._id.toString(),
        name: doc.originalFilename || doc.filename || 'Untitled',
        size: doc.size || 0,
        sizeKB: parseFloat(((doc.size || 0) / 1024).toFixed(2)),
        views: doc.tracking?.views || 0,
        downloads: doc.tracking?.downloads || 0,
        mimeType: doc.mimeType || doc.originalFormat || null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      activity: recentActivity.map(a => ({
        id: a._id.toString(),
        action: a.action,
        metadata: a.metadata || {},
        ipAddress: a.ip_address || null,
        createdAt: a.created_at,
      })),
      signatures: signatureRequests.map(s => ({
        id: s._id.toString(),
        status: s.status,
        recipientEmail: s.recipientEmail || s.signerEmail || null,
        createdAt: s.createdAt,
        completedAt: s.completedAt || null,
      })),
    })

  } catch (error: any) {
    console.error('Admin user detail error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PATCH — update plan / status / ban ────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // ✅ Next.js 15: params is a Promise — must be awaited
    const { id: userId } = await params

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    const db = await dbPromise
    const now = new Date()

    // Only allow these fields to be updated from the admin panel
    const allowedFields = ['plan', 'subscriptionStatus', 'billingCycle', 'banned']
    const update: any = { updated_at: now }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        update[field] = body[field]
      }
    }

    let userObjectId: ObjectId
    try {
      userObjectId = new ObjectId(userId)
    } catch {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const result = await db.collection('users').updateOne(
      { _id: userObjectId },
      { $set: update }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Mirror plan changes to profiles collection too
    if (body.plan || body.subscriptionStatus) {
      await db.collection('profiles').updateOne(
        { user_id: userId },
        {
          $set: {
            ...(body.plan && { plan: body.plan }),
            ...(body.subscriptionStatus && { subscriptionStatus: body.subscriptionStatus }),
          },
        }
      )
    }

    // Audit log the admin action
    await db.collection('audit_log').insertOne({
      user_id: userId,
      action: 'admin_update',
      metadata: { changes: update, updatedBy: 'admin' },
      created_at: now,
    })

    return NextResponse.json({ success: true, updated: update })

  } catch (error: any) {
    console.error('Admin user patch error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE — remove account ────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // ✅ Next.js 15: params is a Promise — must be awaited
    const { id: userId } = await params

    const db = await dbPromise

    let userObjectId: ObjectId
    try {
      userObjectId = new ObjectId(userId)
    } catch {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Delete user + their documents + their profile
    await Promise.all([
      db.collection('users').deleteOne({ _id: userObjectId }),
      db.collection('profiles').deleteOne({ user_id: userId }),
      db.collection('documents').deleteMany({ userId }),
      db.collection('audit_log').insertOne({
        user_id: userId,
        action: 'admin_delete_account',
        metadata: { deletedBy: 'admin', deletedAt: new Date() },
        created_at: new Date(),
      }),
    ])

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Admin user delete error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}