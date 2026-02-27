// app/api/cron/weekly-digest/route.ts
//
// Runs every Monday at 8:00 AM UTC (see vercel.json)
// For each space owner, aggregates the last 7 days of activity
// from activityLogs + diligenceLogs, then sends a digest email via Resend.

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import { Resend } from 'resend'
import { buildWeeklyDigestHtml, DigestSpace } from '@/lib/emails/weeklyDigestEmail'
import { ObjectId } from 'mongodb'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = 'DocMetrics <noreply@docmetrics.io>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://docmetrics.io'

// ── Vercel cron guard ─────────────────────────────────────────────────────────
// Vercel sets this header automatically on cron requests.
// Without it, anyone could trigger mass emails by hitting the URL.
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = req.headers.get('authorization')
  if (process.env.CRON_SECRET) {
    return cronSecret === `Bearer ${process.env.CRON_SECRET}`
  }
  // In development, allow without secret
  return process.env.NODE_ENV === 'development'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSeconds(s: number): string {
  if (!s || s <= 0) return '—'
  if (s < 60)       return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m < 60)       return r > 0 ? `${m}m ${r}s` : `${m}m`
  const h  = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`
}

function timeAgo(date: Date): string {
  const diff  = Date.now() - date.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dateRange(label: Date): string {
  return label.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Main aggregation logic for one space ─────────────────────────────────────

async function buildSpaceDigest(
  db: any,
  space: any,
  weekStart: Date,
  weekEnd: Date
): Promise<DigestSpace | null> {

  const spaceId = space._id

  // 1. Activity logs for the week
  const logs = await db.collection('activityLogs').find({
    spaceId:   spaceId,
    timestamp: { $gte: weekStart, $lte: weekEnd },
  }).toArray()

  if (logs.length === 0) return null  // skip spaces with zero activity

  // 2. Diligence logs for the week (time-on-document data)
  const diligenceLogs = await db.collection('diligenceLogs').find({
    spaceId:   spaceId,
    startedAt: { $gte: weekStart, $lte: weekEnd },
  }).toArray()

  // 3. All documents in space (for "skipped" calculation)
  const documents = await db.collection('documents').find({
    spaceId:  spaceId,
    archived: { $ne: true },
  }).toArray()
  const totalDocs = documents.length

  // 4. Share link labels map
  const publicAccessList: any[] = Array.isArray(space.publicAccess)
    ? space.publicAccess
    : space.publicAccess?.shareLink ? [space.publicAccess] : []

  const linkLabelMap: Record<string, string> = {}
  for (const pa of publicAccessList) {
    if (pa.shareLink) {
      linkLabelMap[pa.shareLink] = pa.label || pa.shareLink.slice(0, 12) + '…'
    }
  }

  // ── Aggregate by investor (email + shareLink) ─────────────────────────────

  // Track which investors existed BEFORE this week (for isNew flag)
  const existingVisitors = await db.collection('activityLogs').distinct('visitorEmail', {
    spaceId:   spaceId,
    timestamp: { $lt: weekStart },
  })
  const existingSet = new Set(existingVisitors)

  type InvKey = string
  const investorMap: Record<InvKey, {
    email:        string
    shareLink:    string
    totalSeconds: number
    docsOpened:   Set<string>
    downloads:    number
    lastSeen:     Date
    sessionCount: number
  }> = {}

  // Build from diligence logs (has time data)
  for (const dl of diligenceLogs) {
    const email = dl.visitorEmail || 'anonymous'
    const sl    = dl.shareLink    || 'unknown'
    const key   = `${email}::${sl}`

    if (!investorMap[key]) {
      investorMap[key] = {
        email,
        shareLink:    sl,
        totalSeconds: 0,
        docsOpened:   new Set(),
        downloads:    0,
        lastSeen:     new Date(dl.lastHeartbeat || dl.startedAt),
        sessionCount: 0,
      }
    }

    investorMap[key].totalSeconds += (dl.totalSeconds || 0)
    investorMap[key].sessionCount += 1
    if (dl.documentId) investorMap[key].docsOpened.add(dl.documentId.toString())

    const t = new Date(dl.lastHeartbeat || dl.startedAt)
    if (t > investorMap[key].lastSeen) investorMap[key].lastSeen = t
  }

  // Supplement from activityLogs (portal_enter + downloads for investors
  // who may not have time data yet)
  for (const log of logs) {
    const email = log.visitorEmail || 'anonymous'
    const sl    = log.shareLink    || 'unknown'
    const key   = `${email}::${sl}`

    if (!investorMap[key]) {
      investorMap[key] = {
        email,
        shareLink:    sl,
        totalSeconds: 0,
        docsOpened:   new Set(),
        downloads:    0,
        lastSeen:     new Date(log.timestamp),
        sessionCount: 0,
      }
    }

    if (log.event === 'download' || log.event === 'file_download') {
      investorMap[key].downloads += 1
    }
    if (log.documentId) investorMap[key].docsOpened.add(log.documentId.toString())

    const t = new Date(log.timestamp)
    if (t > investorMap[key].lastSeen) investorMap[key].lastSeen = t
  }

  // Convert to sorted array
  const investors = Object.values(investorMap)
    .map(inv => {
      const score = calcEngagementScore(inv.totalSeconds, inv.docsOpened.size, totalDocs, inv.lastSeen)
      return {
        email:           inv.email,
        formattedTime:   formatSeconds(inv.totalSeconds),
        docsViewed:      inv.docsOpened.size,
        totalDocs,
        downloads:       inv.downloads,
        lastSeen:        timeAgo(inv.lastSeen),
        isNew:           !existingSet.has(inv.email),
        linkLabel:       linkLabelMap[inv.shareLink] || null,
        engagementScore: score,
      }
    })
    .sort((a, b) => b.engagementScore - a.engagementScore)

  // ── Document stats ────────────────────────────────────────────────────────

  // Aggregate total seconds per documentId across all diligence sessions
  const docTimeMap: Record<string, { seconds: number; views: number }> = {}
  for (const dl of diligenceLogs) {
    const docId = dl.documentId?.toString()
    if (!docId) continue
    if (!docTimeMap[docId]) docTimeMap[docId] = { seconds: 0, views: 0 }
    docTimeMap[docId].seconds += (dl.totalSeconds || 0)
    docTimeMap[docId].views   += 1
  }

  // Count how many unique investors skipped each doc
  const totalInvestors = investors.length
  const documentStats = documents.map((doc: any) => {
    const docId   = doc._id.toString()
    const data    = docTimeMap[docId]
    const viewers = data?.views || 0
    return {
      name:      doc.name,
      views:     viewers,
      totalTime: data ? formatSeconds(data.seconds) : '—',
      skippedBy: totalInvestors - viewers,
    }
  }).sort((a: { views: number }, b: { views: number }) => b.views - a.views)

  // ── Questions ─────────────────────────────────────────────────────────────
  const questionLogs = logs.filter((l: { event: string }) => l.event === 'question_submitted' || l.event === 'question_asked')
  const newQuestions = questionLogs.map((l: { visitorEmail: any; meta: { question: any; text: any }; documentName: any; timestamp: string | number | Date }) => ({
    email:    l.visitorEmail || 'anonymous',
    question: l.meta?.question || l.meta?.text || '(question text missing)',
    document: l.documentName || 'general',
    askedAt:  timeAgo(new Date(l.timestamp)),
  }))

  // ── Deal heat score (average across top 3 investors) ──────────────────────
  const top3     = investors.slice(0, 3)
  const avgScore = top3.length > 0
    ? Math.round(top3.reduce((s, i) => s + i.engagementScore, 0) / top3.length)
    : 0

  const heatLabel =
    avgScore >= 70 ? 'Very active — consider following up this week' :
    avgScore >= 40 ? 'Active — investors are engaged' :
    avgScore >= 15 ? 'Some activity — keep sharing' :
    'Quiet week — no significant activity'

  return {
    spaceId:       spaceId.toString(),
    spaceName:     space.name,
    spaceUrl:      `${APP_URL}/spaces/${spaceId}`,
    newVisitors:   investors.filter(i => i.isNew).length,
    totalViews:    logs.filter((l: { event: string }) => l.event === 'document_view').length,
    totalDownloads: logs.filter((l: { event: string }) => l.event === 'download' || l.event === 'file_download').length,
    totalQuestions: newQuestions.length,
    topInvestors:   investors,
    documentStats,
    newQuestions,
    dealHeatScore:  avgScore,
    heatLabel,
  }
}

// ── Engagement score formula ──────────────────────────────────────────────────

function calcEngagementScore(
  totalSeconds: number,
  docsOpened:   number,
  totalDocs:    number,
  lastSeen:     Date
): number {
  const timeScore     = Math.min(40, Math.round(totalSeconds / 60 * 4))
  const coverageScore = Math.min(40, totalDocs > 0 ? Math.round((docsOpened / totalDocs) * 40) : 0)
  const hoursAgo      = (Date.now() - lastSeen.getTime()) / 3600000
  const recencyScore  = Math.max(0, Math.min(20, Math.round(20 - hoursAgo * 0.5)))
  return timeScore + coverageScore + recencyScore
}

// ── Cron handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekEnd   = new Date()
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000)

  const weekStartLabel = dateRange(weekStart)
  const weekEndLabel   = dateRange(weekEnd)

  console.log(`📧 Weekly digest cron starting — ${weekStartLabel} to ${weekEndLabel}`)

  try {
    const db = await dbPromise

    // Get all spaces that have had ANY activity ever (settings.notifyOnView implied)
    // Group by owner email so one owner with 3 spaces gets ONE email
    const spaces = await db.collection('spaces')
      .find({ active: { $ne: false } })
      .toArray()

    // Group spaces by owner email
    const ownerSpacesMap: Record<string, { ownerName: string; spaces: any[] }> = {}

    for (const space of spaces) {
      const owner = space.members?.find((m: any) => m.role === 'owner')
      if (!owner?.email) continue

      const email = owner.email.toLowerCase()
      if (!ownerSpacesMap[email]) {
        ownerSpacesMap[email] = {
          ownerName: owner.name || email.split('@')[0],
          spaces:    [],
        }
      }
      ownerSpacesMap[email].spaces.push(space)
    }

    const results = { sent: 0, skipped: 0, errors: 0 }

    for (const [ownerEmail, { ownerName, spaces: ownerSpaces }] of Object.entries(ownerSpacesMap)) {
      try {
        // Build digest for each space — returns null if no activity
        const digestSpaces: DigestSpace[] = []
        for (const space of ownerSpaces) {
          const digest = await buildSpaceDigest(db, space, weekStart, weekEnd)
          if (digest) digestSpaces.push(digest)
        }

        // Only send if at least one space had activity
        if (digestSpaces.length === 0) {
          results.skipped++
          console.log(`⏭ No activity for ${ownerEmail} — skipping`)
          continue
        }

        const html = buildWeeklyDigestHtml({
          ownerName,
          weekStart: weekStartLabel,
          weekEnd:   weekEndLabel,
          spaces:    digestSpaces,
          appUrl:    APP_URL,
        })

        const totalViews = digestSpaces.reduce((s, sp) => s + sp.totalViews, 0)
        const subject    = totalViews > 0
          ? `📊 ${totalViews} document view${totalViews > 1 ? 's' : ''} this week — DocMetrics summary`
          : `📊 Your weekly DocMetrics summary`

        const { error } = await resend.emails.send({
          from:    FROM,
          to:      [ownerEmail],
          subject,
          html,
          tags: [
            { name: 'type',  value: 'weekly-digest' },
            { name: 'week',  value: weekStartLabel.replace(/\s/g, '-') },
          ],
        })

        if (error) {
          console.error(`❌ Failed to send to ${ownerEmail}:`, error)
          results.errors++
        } else {
          console.log(`✅ Sent digest to ${ownerEmail} (${digestSpaces.length} space${digestSpaces.length > 1 ? 's' : ''})`)
          results.sent++
        }

        // Small delay to avoid hitting Resend rate limits
        await new Promise(r => setTimeout(r, 100))

      } catch (err) {
        console.error(`❌ Error processing ${ownerEmail}:`, err)
        results.errors++
      }
    }

    console.log(`📧 Weekly digest complete:`, results)

    return NextResponse.json({
      success: true,
      week:    `${weekStartLabel} – ${weekEndLabel}`,
      results,
    })

  } catch (error) {
    console.error('❌ Weekly digest cron failed:', error)
    return NextResponse.json({ error: 'Cron failed', details: String(error) }, { status: 500 })
  }
}