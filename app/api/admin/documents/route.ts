// app/api/admin/documents/route.ts
//
// WHAT THIS FILE DOES:
//   Platform-wide document analytics for the owner dashboard.
//   Queries documents, viewer_identities, signature_requests, analytics_sessions
//   directly — no user auth needed, this is admin-only data.
//
// QUERY PARAMS:
//   page    — page number for document list (default 1)
//   limit   — results per page (default 20)
//   search  — search by filename
//   sort    — createdAt | views | downloads | size (default: createdAt)
//   order   — asc | desc (default: desc)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { dbPromise } from '@/app/api/lib/mongodb'

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

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export async function GET(request: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // ── Params ─────────────────────────────────────────────────
    const { searchParams } = new URL(request.url)
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit  = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const search = searchParams.get('search') || ''
    const sort   = searchParams.get('sort')   || 'createdAt'
    const order  = searchParams.get('order')  === 'asc' ? 1 : -1

    const db = await dbPromise
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thirtyDaysAgo = daysAgo(30)
    const sevenDaysAgo  = daysAgo(7)

    // ── Build document list query ──────────────────────────────
    const listQuery: any = { archived: { $ne: true } }
    if (search) {
      listQuery.$or = [
        { originalFilename: { $regex: search, $options: 'i' } },
        { filename: { $regex: search, $options: 'i' } },
      ]
    }

    // ── Run all queries in parallel ────────────────────────────
    const [
      // Platform totals
      totalDocuments,
      totalDocumentsThisMonth,
      totalDocumentsThisWeek,
      totalArchivedDocuments,

      // Views from viewer_identities (one doc per unique viewer per document)
      totalViews,
      totalViewsThisMonth,

      // Signatures
      totalSignaturesCompleted,
      totalSignaturesPending,

      // Top documents by views
      topByViews,

      // Top uploaders
      topUploaders,

      // Daily uploads sparkline (last 30 days)
      dailyUploads,

      // Daily views sparkline (last 30 days)
      dailyViews,

      // Document list (paginated)
      documentList,
      documentListTotal,

      // File type breakdown
      fileTypeBreakdown,

      // Average views per document
      avgViewsAgg,

    ] = await Promise.all([

      db.collection('documents').countDocuments({ archived: { $ne: true } }),
      db.collection('documents').countDocuments({ createdAt: { $gte: thisMonthStart }, archived: { $ne: true } }),
      db.collection('documents').countDocuments({ createdAt: { $gte: sevenDaysAgo }, archived: { $ne: true } }),
      db.collection('documents').countDocuments({ archived: true }),

      db.collection('viewer_identities').countDocuments(),
      db.collection('viewer_identities').countDocuments({ createdAt: { $gte: thisMonthStart } }),

      db.collection('signature_requests').countDocuments({ status: 'completed' }),
      db.collection('signature_requests').countDocuments({ status: { $in: ['pending', 'sent'] } }),

      // Top 10 most-viewed documents
      db.collection('documents').aggregate([
        { $match: { archived: { $ne: true } } },
        { $project: {
            fileData: 0,
            name: { $ifNull: ['$originalFilename', '$filename'] },
            views: { $ifNull: ['$tracking.views', 0] },
            downloads: { $ifNull: ['$tracking.downloads', 0] },
            userId: 1,
            createdAt: 1,
            size: 1,
        }},
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]).toArray(),

      // Top 10 uploaders by document count
      db.collection('documents').aggregate([
        { $match: { archived: { $ne: true } } },
        { $group: { _id: '$userId', count: { $sum: 1 }, totalViews: { $sum: '$tracking.views' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray(),

      // Daily uploads last 30 days
      db.collection('documents').aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, archived: { $ne: true } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]).toArray(),

      // Daily views last 30 days (from viewer_identities.createdAt)
      db.collection('viewer_identities').aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]).toArray(),

      // Paginated document list
      db.collection('documents')
        .find(listQuery, { projection: { fileData: 0 } })
        .sort({ [sort]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),

      db.collection('documents').countDocuments(listQuery),

      // File type breakdown
      db.collection('documents').aggregate([
        { $match: { archived: { $ne: true } } },
        { $group: {
            _id: { $ifNull: ['$originalFormat', '$mimeType', 'unknown'] },
            count: { $sum: 1 },
        }},
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]).toArray(),

      // Average views per document
      db.collection('documents').aggregate([
        { $match: { archived: { $ne: true } } },
        { $group: { _id: null, avgViews: { $avg: '$tracking.views' } } },
      ]).toArray(),

    ])

    // ── Enrich top uploaders with user emails ──────────────────
    const uploaderIds = topUploaders.map(u => u._id).filter(Boolean)
    const uploaderUsers = uploaderIds.length > 0
      ? await db.collection('users').find(
          { _id: { $in: uploaderIds.map(id => { try { const { ObjectId } = require('mongodb'); return new ObjectId(id) } catch { return id } }) } },
          { projection: { email: 1, 'profile.fullName': 1, 'profile.avatarUrl': 1 } }
        ).toArray()
      : []

    const uploaderMap: Record<string, any> = {}
    for (const u of uploaderUsers) {
      uploaderMap[u._id.toString()] = u
    }

    // ── Fill sparkline gaps ────────────────────────────────────
    function fillSparkline(raw: { _id: string; count: number }[]) {
      const map: Record<string, number> = {}
      for (const r of raw) map[r._id] = r.count
      const result = []
      for (let i = 29; i >= 0; i--) {
        const d = daysAgo(i)
        const key = d.toISOString().slice(0, 10)
        result.push({ date: key, count: map[key] || 0 })
      }
      return result
    }

    return NextResponse.json({
      // ── Summary stats ────────────────────────────────────────
      stats: {
        totalDocuments,
        totalDocumentsThisMonth,
        totalDocumentsThisWeek,
        totalArchivedDocuments,
        totalViews,
        totalViewsThisMonth,
        totalSignaturesCompleted,
        totalSignaturesPending,
        avgViewsPerDocument: parseFloat((avgViewsAgg[0]?.avgViews || 0).toFixed(1)),
      },

      // ── Charts ───────────────────────────────────────────────
      sparklines: {
        uploads: fillSparkline(dailyUploads as { _id: string; count: number }[]),
        views: fillSparkline(dailyViews as { _id: string; count: number }[]),
      },

      // ── File type breakdown ───────────────────────────────────
      fileTypes: fileTypeBreakdown.map(f => ({
        type: f._id || 'unknown',
        count: f.count,
      })),

      // ── Top docs by views ─────────────────────────────────────
      topDocuments: topByViews.map(doc => ({
        id: doc._id.toString(),
        name: doc.name || doc.originalFilename || doc.filename || 'Untitled',
        views: doc.views || 0,
        downloads: doc.downloads || 0,
        userId: doc.userId,
        createdAt: doc.createdAt,
        sizeKB: parseFloat(((doc.size || 0) / 1024).toFixed(1)),
      })),

      // ── Top uploaders ─────────────────────────────────────────
      topUploaders: topUploaders.map(u => {
        const userInfo = uploaderMap[u._id] || {}
        return {
          userId: u._id,
          email: userInfo.email || 'Unknown',
          name: userInfo.profile?.fullName || userInfo.email?.split('@')[0] || 'Unknown',
          avatarUrl: userInfo.profile?.avatarUrl || null,
          documentCount: u.count,
          totalViews: u.totalViews || 0,
        }
      }),

      // ── Paginated document list ───────────────────────────────
      documents: {
        data: documentList.map(doc => ({
          id: doc._id.toString(),
          name: doc.originalFilename || doc.filename || 'Untitled',
          userId: doc.userId,
          size: doc.size || 0,
          sizeKB: parseFloat(((doc.size || 0) / 1024).toFixed(2)),
          views: doc.tracking?.views || 0,
          downloads: doc.tracking?.downloads || 0,
          mimeType: doc.mimeType || doc.originalFormat || null,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        })),
        total: documentListTotal,
        page,
        totalPages: Math.ceil(documentListTotal / limit),
      },
    })

  } catch (error: any) {
    console.error('Admin documents analytics error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}