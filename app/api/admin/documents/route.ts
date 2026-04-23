// app/api/admin/documents/route.ts
//
// FIX: Separated the $project stage that was mixing exclusion (fileData: 0)
// with computed expressions — MongoDB does not allow this in one stage.
// Solution: use $unset to drop fileData first, then $addFields for computed
// fields, then a pure inclusion $project at the end.

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
    const adminToken = request.cookies.get('auth_token')?.value
    if (!adminToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyAdminToken(adminToken)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

    const listQuery: any = { archived: { $ne: true } }
    if (search) {
      listQuery.$or = [
        { originalFilename: { $regex: search, $options: 'i' } },
        { filename:         { $regex: search, $options: 'i' } },
      ]
    }

    const [
      totalDocuments,
      totalDocumentsThisMonth,
      totalDocumentsThisWeek,
      totalArchivedDocuments,
      totalViews,
      totalViewsThisMonth,
      totalSignaturesCompleted,
      totalSignaturesPending,
      topByViews,
      topUploaders,
      dailyUploads,
      dailyViews,
      documentList,
      documentListTotal,
      fileTypeBreakdown,
      avgViewsAgg,
    ] = await Promise.all([

      db.collection('documents').countDocuments({ archived: { $ne: true } }),
      db.collection('documents').countDocuments({ createdAt: { $gte: thisMonthStart }, archived: { $ne: true } }),
      db.collection('documents').countDocuments({ createdAt: { $gte: sevenDaysAgo },  archived: { $ne: true } }),
      db.collection('documents').countDocuments({ archived: true }),

      db.collection('viewer_identities').countDocuments(),
      db.collection('viewer_identities').countDocuments({ createdAt: { $gte: thisMonthStart } }),

      db.collection('signature_requests').countDocuments({ status: 'completed' }),
      db.collection('signature_requests').countDocuments({ status: { $in: ['pending', 'sent'] } }),

      // FIX: $unset heavy field → $addFields for computed values → pure $project
      db.collection('documents').aggregate([
        { $match: { archived: { $ne: true } } },
        { $unset: 'fileData' },
        { $addFields: {
            name:      { $ifNull: ['$originalFilename', '$filename'] },
            views:     { $ifNull: ['$tracking.views', 0] },
            downloads: { $ifNull: ['$tracking.downloads', 0] },
        }},
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $project: { name: 1, views: 1, downloads: 1, userId: 1, createdAt: 1, size: 1 } },
      ]).toArray(),

      db.collection('documents').aggregate([
        { $match: { archived: { $ne: true } } },
        { $group: {
            _id: '$userId',
            count: { $sum: 1 },
            totalViews: { $sum: '$tracking.views' },
        }},
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray(),

      db.collection('documents').aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, archived: { $ne: true } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]).toArray(),

      db.collection('viewer_identities').aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]).toArray(),

      db.collection('documents')
        .find(listQuery, { projection: { fileData: 0 } })
        .sort({ [sort]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),

      db.collection('documents').countDocuments(listQuery),

      db.collection('documents').aggregate([
        { $match: { archived: { $ne: true } } },
        { $group: {
            _id: { $ifNull: ['$originalFormat', '$mimeType'] },
            count: { $sum: 1 },
        }},
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]).toArray(),

      db.collection('documents').aggregate([
        { $match: { archived: { $ne: true } } },
        { $group: { _id: null, avgViews: { $avg: '$tracking.views' } } },
      ]).toArray(),

    ])

    // ── Enrich top uploaders with user emails ──────────────────
    const { ObjectId } = await import('mongodb')
    const uploaderIds = topUploaders.map(u => u._id).filter(Boolean)
    const uploaderUsers = uploaderIds.length > 0
      ? await db.collection('users').find(
          {
            $or: [
              { _id: { $in: uploaderIds.map(id => { try { return new ObjectId(id) } catch { return id } }) } },
              { id: { $in: uploaderIds } },
            ],
          },
          { projection: { email: 1, 'profile.fullName': 1, 'profile.avatarUrl': 1 } }
        ).toArray()
      : []

    const uploaderMap: Record<string, any> = {}
    for (const u of uploaderUsers) uploaderMap[u._id.toString()] = u

    // ── Zero-fill sparkline gaps ───────────────────────────────
    function fillSparkline(raw: any[]) {
      const map: Record<string, number> = {}
      for (const r of raw) map[String(r._id)] = Number(r.count)
      const result = []
      for (let i = 29; i >= 0; i--) {
        const d = daysAgo(i)
        const key = d.toISOString().slice(0, 10)
        result.push({ date: key, count: map[key] || 0 })
      }
      return result
    }

    return NextResponse.json({
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
      sparklines: {
        uploads: fillSparkline(dailyUploads),
        views:   fillSparkline(dailyViews),
      },
      fileTypes: fileTypeBreakdown.map(f => ({
        type:  f._id || 'unknown',
        count: f.count,
      })),
      topDocuments: topByViews.map(doc => ({
        id:        doc._id.toString(),
        name:      doc.name || 'Untitled',
        views:     doc.views || 0,
        downloads: doc.downloads || 0,
        userId:    doc.userId,
        createdAt: doc.createdAt,
        sizeKB:    parseFloat(((doc.size || 0) / 1024).toFixed(1)),
      })),
      topUploaders: topUploaders.map(u => {
        const info = uploaderMap[u._id] || {}
        return {
          userId:        u._id,
          email:         info.email || 'Unknown',
          name:          info.profile?.fullName || info.email?.split('@')[0] || 'Unknown',
          avatarUrl:     info.profile?.avatarUrl || null,
          documentCount: u.count,
          totalViews:    u.totalViews || 0,
        }
      }),
      documents: {
        data: documentList.map(doc => ({
          id:        doc._id.toString(),
          name:      doc.originalFilename || doc.filename || 'Untitled',
          userId:    doc.userId,
          size:      doc.size || 0,
          sizeKB:    parseFloat(((doc.size || 0) / 1024).toFixed(2)),
          views:     doc.tracking?.views || 0,
          downloads: doc.tracking?.downloads || 0,
          mimeType:  doc.mimeType || doc.originalFormat || null,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        })),
        total:      documentListTotal,
        page,
        totalPages: Math.ceil(documentListTotal / limit),
      },
    })

  } catch (error: any) {
    console.error('Admin documents analytics error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}