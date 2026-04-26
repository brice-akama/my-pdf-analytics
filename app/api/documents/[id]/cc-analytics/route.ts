// app/api/documents/[id]/cc-analytics/route.ts
//
// WHAT THIS FILE DOES:
//   Lets the document owner see the full tracking picture for every
//   CC recipient on a document:
//     - Did they open it?
//     - How many times?
//     - How long did they spend reading?
//     - Did they download it?
//     - When was each event?
//     - Full activity timeline from analytics_logs
//
// ROUTE:
//   GET /api/documents/[id]/cc-analytics
//
// AUTHENTICATION:
//   Uses your existing checkAccess() — only the document owner can see this.
//   We verify the document belongs to the requesting user before returning data.
//
// PLAN GATING:
//   basic plan  → summary counts only (opened y/n, download y/n)
//   full plan   → full timeline, time spent, device, IP, per-event log
//
// USED BY:
//   The CC analytics section inside your signature analytics page,
//   or a standalone CC tab — your choice on the frontend.
//
// NEXT.JS 15: params is a Promise — awaited before use.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '../../../lib/mongodb'
import { ObjectId } from 'mongodb'
import { checkAccess } from '@/lib/checkAccess'
import { getAnalyticsLevel } from '@/lib/planLimits'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Next.js 15: await params before accessing properties
    const { id } = await params

    // ── Auth + plan ───────────────────────────────────────────────────────────
    const access = await checkAccess(req)
    if (!access.ok) return access.response

    const analyticsLevel = getAnalyticsLevel(access.plan)
    const db = await dbPromise

    // ── Verify document ownership ─────────────────────────────────────────────
    // Never let one user see CC analytics for another user's document.
    let documentObjectId: ObjectId
    try {
      documentObjectId = new ObjectId(id)
    } catch {
      return NextResponse.json({ error: 'Invalid document id' }, { status: 400 })
    }

    const document = await db.collection('documents').findOne({
      _id: documentObjectId,
      userId: access.user._id.toString(),
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // ── Fetch all CC recipients for this document ─────────────────────────────
    const ccRecipients = await db
      .collection('cc_recipients')
      .find({ documentId: id })
      .sort({ createdAt: 1 })
      .toArray()

    if (ccRecipients.length === 0) {
      return NextResponse.json({
        success: true,
        analyticsLevel,
        hasCCRecipients: false,
        summary: {
          total: 0,
          opened: 0,
          notOpened: 0,
          downloaded: 0,
          openRate: 0,
          downloadRate: 0,
          totalViewCount: 0,
          totalTimeSpentSeconds: 0,
          avgTimeSpentSeconds: null,
        },
        recipients: [],
        timeline: [],
      })
    }

    // ── Build summary counts ──────────────────────────────────────────────────
    const total = ccRecipients.length
    const opened = ccRecipients.filter(r => !!r.firstOpenedAt).length
    const notOpened = total - opened
    const downloaded = ccRecipients.filter(r => r.downloaded === true).length
    const openRate = total > 0 ? Math.round((opened / total) * 100) : 0
    const downloadRate = total > 0 ? Math.round((downloaded / total) * 100) : 0

    const totalViewCount = ccRecipients.reduce((sum, r) => sum + (r.viewCount || 0), 0)
    const totalTimeSpentSeconds = ccRecipients.reduce(
      (sum, r) => sum + (r.totalTimeSpentSeconds || 0), 0
    )
    const recipientsWithTime = ccRecipients.filter(r => (r.totalTimeSpentSeconds || 0) > 0)
    const avgTimeSpentSeconds = recipientsWithTime.length > 0
      ? Math.round(totalTimeSpentSeconds / recipientsWithTime.length)
      : null

    // ── BASIC plan — return summary only, no per-recipient detail ─────────────
    if (analyticsLevel === 'basic') {
      return NextResponse.json({
        success: true,
        analyticsLevel: 'basic',
        hasCCRecipients: true,
        summary: {
          total,
          opened,
          notOpened,
          downloaded,
          openRate,
          downloadRate,
          totalViewCount,
          totalTimeSpentSeconds,
          avgTimeSpentSeconds,
        },
        // Strip full detail for basic plan
        recipients: ccRecipients.map(r => ({
          id: r._id.toString(),
          name: r.name || null,
          email: r.email,
          role: 'cc',
          opened: !!r.firstOpenedAt,
          downloaded: r.downloaded || false,
          // No timestamps, no device, no IP on basic plan
        })),
        timeline: [],
      })
    }

    // ── FULL plan — return everything ─────────────────────────────────────────

    // Fetch full activity timeline from analytics_logs for all CC recipients
    const ccRecipientIds = ccRecipients.map(r => r._id.toString())
    const ccEmails = ccRecipients.map(r => r.email)

    const timelineLogs = await db
      .collection('analytics_logs')
      .find({
        documentId: id,
        action: { $in: ['cc_opened', 'cc_time_spent', 'cc_downloaded'] },
        $or: [
          { ccRecipientId: { $in: ccRecipientIds } },
          { email: { $in: ccEmails } },
        ],
      })
      .sort({ timestamp: -1 })
      .limit(200) // cap at 200 log entries per document
      .toArray()

    // ── Build per-recipient detail objects ────────────────────────────────────
    const recipients = ccRecipients.map(r => {
      const sentAt = r.createdAt ? new Date(r.createdAt).getTime() : null
      const firstOpenedAt = r.firstOpenedAt ? new Date(r.firstOpenedAt).getTime() : null
      const timeToOpenSeconds = sentAt && firstOpenedAt
        ? Math.floor((firstOpenedAt - sentAt) / 1000)
        : null

      return {
        id: r._id.toString(),
        name: r.name || null,
        email: r.email,
        role: 'cc',
        uniqueId: r.uniqueId,

        // Open tracking
        opened: !!r.firstOpenedAt,
        viewCount: r.viewCount || 0,
        firstOpenedAt: r.firstOpenedAt || null,
        lastOpenedAt: r.lastOpenedAt || null,
        timeToOpenSeconds,        // how long after send before they first opened

        // Time tracking
        totalTimeSpentSeconds: r.totalTimeSpentSeconds || 0,

        // Download tracking
        downloaded: r.downloaded || false,
        downloadCount: r.downloadCount || 0,
        firstDownloadedAt: r.firstDownloadedAt || null,
        lastDownloadedAt: r.lastDownloadedAt || null,

        // Device / location (captured on first open)
        firstDevice: r.firstDevice || null,
        firstIpAddress: r.firstIpAddress || null,

        // When the CC was added
        createdAt: r.createdAt || null,
        notifyWhen: r.notifyWhen || null,

        // Engagement signal — human-readable summary
        engagementSignal: (() => {
          if (!r.firstOpenedAt) return 'not_opened'
          if ((r.totalTimeSpentSeconds || 0) >= 120) return 'highly_engaged'
          if ((r.totalTimeSpentSeconds || 0) >= 30) return 'engaged'
          if (r.viewCount > 1) return 'returned'
          return 'glanced'
        })(),
      }
    })

    // ── Format timeline for the frontend ─────────────────────────────────────
    // Map action names to human-readable labels
    const ACTION_LABELS: Record<string, string> = {
      cc_opened: 'Opened document',
      cc_time_spent: 'Spent time reading',
      cc_downloaded: 'Downloaded PDF',
    }

    const timeline = timelineLogs.map(log => ({
      id: log._id.toString(),
      email: log.email,
      ccName: log.ccName || null,
      action: log.action,
      label: ACTION_LABELS[log.action] || log.action,
      secondsSpent: log.secondsSpent || null,   // only on cc_time_spent
      isFirstOpen: log.isFirstOpen || false,     // only on cc_opened
      isFirstDownload: log.isFirstDownload || false, // only on cc_downloaded
      device: log.device || null,
      ipAddress: log.ipAddress || null,
      timestamp: log.timestamp || null,
    }))

    // ── Aggregate stats across all CC recipients ──────────────────────────────
    const engagementBreakdown = {
      not_opened: recipients.filter(r => r.engagementSignal === 'not_opened').length,
      glanced: recipients.filter(r => r.engagementSignal === 'glanced').length,
      returned: recipients.filter(r => r.engagementSignal === 'returned').length,
      engaged: recipients.filter(r => r.engagementSignal === 'engaged').length,
      highly_engaged: recipients.filter(r => r.engagementSignal === 'highly_engaged').length,
    }

    const deviceBreakdown = recipients
      .filter(r => r.firstDevice)
      .reduce((acc: Record<string, number>, r) => {
        const d = r.firstDevice!
        acc[d] = (acc[d] || 0) + 1
        return acc
      }, {})

    // Fastest opener
    const fastestOpener = recipients
      .filter(r => r.timeToOpenSeconds !== null)
      .sort((a, b) => (a.timeToOpenSeconds ?? Infinity) - (b.timeToOpenSeconds ?? Infinity))[0] || null

    // Most engaged reader
    const mostEngaged = recipients
      .filter(r => r.totalTimeSpentSeconds > 0)
      .sort((a, b) => b.totalTimeSpentSeconds - a.totalTimeSpentSeconds)[0] || null

    return NextResponse.json({
      success: true,
      analyticsLevel,
      hasCCRecipients: true,
      summary: {
        total,
        opened,
        notOpened,
        downloaded,
        openRate,
        downloadRate,
        totalViewCount,
        totalTimeSpentSeconds,
        avgTimeSpentSeconds,
      },
      insights: {
        engagementBreakdown,
        deviceBreakdown,
        fastestOpener: fastestOpener
          ? { email: fastestOpener.email, name: fastestOpener.name, timeToOpenSeconds: fastestOpener.timeToOpenSeconds }
          : null,
        mostEngaged: mostEngaged
          ? { email: mostEngaged.email, name: mostEngaged.name, totalTimeSpentSeconds: mostEngaged.totalTimeSpentSeconds }
          : null,
      },
      recipients,
      timeline,
    })

  } catch (error: any) {
    console.error('❌ CC analytics error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}