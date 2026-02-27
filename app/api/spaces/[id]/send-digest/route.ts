// app/api/spaces/[id]/send-digest/route.ts
//
// Manual trigger: lets the space owner send themselves the digest right now.
// Called from a "Send digest now" button in the spaces dashboard.
// Returns the same email that the cron would send, but just for THIS space.

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import { verifyUserFromRequest } from '@/lib/auth'
import { Resend } from 'resend'
import { buildWeeklyDigestHtml } from '@/lib/emails/weeklyDigestEmail'
import { ObjectId } from 'mongodb'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = 'DocMetrics <noreply@docmetrics.io>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://docmetrics.io'

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

function calcEngagementScore(totalSeconds: number, docsOpened: number, totalDocs: number, lastSeen: Date): number {
  const timeScore     = Math.min(40, Math.round(totalSeconds / 60 * 4))
  const coverageScore = Math.min(40, totalDocs > 0 ? Math.round((docsOpened / totalDocs) * 40) : 0)
  const hoursAgo      = (Date.now() - lastSeen.getTime()) / 3600000
  const recencyScore  = Math.max(0, Math.min(20, Math.round(20 - hoursAgo * 0.5)))
  return timeScore + coverageScore + recencyScore
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params  = context.params instanceof Promise ? await context.params : context.params
    const spaceId = params.id

    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db    = await dbPromise
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) })
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 })

    // Only owner / admin can trigger
    const isOwner  = space.userId === user.id || space.createdBy === user.id
    const isMember = space.members?.some((m: any) => m.email === user.email && ['owner', 'admin'].includes(m.role))
    if (!isOwner && !isMember) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    // Get owner email from members
    const owner = space.members?.find((m: any) => m.role === 'owner')
    const ownerEmail = owner?.email || user.email
    if (!ownerEmail) return NextResponse.json({ error: 'Owner email not found' }, { status: 400 })

    const ownerName = owner?.name || ownerEmail.split('@')[0]

    // Date range — last 7 days (or can be overridden via body)
    const body = await request.json().catch(() => ({}))
    const days  = body.days || 7
    const weekEnd   = new Date()
    const weekStart = new Date(weekEnd.getTime() - days * 24 * 60 * 60 * 1000)

    // ── Pull data ────────────────────────────────────────────────────────────

    const [logs, diligenceLogs, documents] = await Promise.all([
      db.collection('activityLogs').find({
        spaceId:   new ObjectId(spaceId),
        timestamp: { $gte: weekStart, $lte: weekEnd },
      }).toArray(),

      db.collection('diligenceLogs').find({
        spaceId:   new ObjectId(spaceId),
        startedAt: { $gte: weekStart, $lte: weekEnd },
      }).toArray(),

      db.collection('documents').find({
        spaceId:  new ObjectId(spaceId),
        archived: { $ne: true },
      }).toArray(),
    ])

    const totalDocs = documents.length

    // Link labels
    const publicAccessList: any[] = Array.isArray(space.publicAccess)
      ? space.publicAccess
      : space.publicAccess?.shareLink ? [space.publicAccess] : []
    const linkLabelMap: Record<string, string> = {}
    for (const pa of publicAccessList) {
      if (pa.shareLink) {
        linkLabelMap[pa.shareLink] = pa.label || pa.shareLink.slice(0, 12) + '…'
      }
    }

    // Existing visitors (before this week)
    const existingVisitors = await db.collection('activityLogs').distinct('visitorEmail', {
      spaceId:   new ObjectId(spaceId),
      timestamp: { $lt: weekStart },
    })
    const existingSet = new Set(existingVisitors)

    // Aggregate investors
    const investorMap: Record<string, any> = {}
    for (const dl of diligenceLogs) {
      const email = dl.visitorEmail || 'anonymous'
      const sl    = dl.shareLink    || 'unknown'
      const key   = `${email}::${sl}`
      if (!investorMap[key]) {
        investorMap[key] = { email, shareLink: sl, totalSeconds: 0, docsOpened: new Set(), downloads: 0, lastSeen: new Date(dl.startedAt), sessionCount: 0 }
      }
      investorMap[key].totalSeconds += (dl.totalSeconds || 0)
      investorMap[key].sessionCount += 1
      if (dl.documentId) investorMap[key].docsOpened.add(dl.documentId.toString())
      const t = new Date(dl.lastHeartbeat || dl.startedAt)
      if (t > investorMap[key].lastSeen) investorMap[key].lastSeen = t
    }
    for (const log of logs) {
      const email = log.visitorEmail || 'anonymous'
      const sl    = log.shareLink    || 'unknown'
      const key   = `${email}::${sl}`
      if (!investorMap[key]) {
        investorMap[key] = { email, shareLink: sl, totalSeconds: 0, docsOpened: new Set(), downloads: 0, lastSeen: new Date(log.timestamp), sessionCount: 0 }
      }
      if (log.event === 'download' || log.event === 'file_download') investorMap[key].downloads += 1
      if (log.documentId) investorMap[key].docsOpened.add(log.documentId.toString())
      const t = new Date(log.timestamp)
      if (t > investorMap[key].lastSeen) investorMap[key].lastSeen = t
    }

    const investors = Object.values(investorMap)
      .map((inv: any) => {
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
      .sort((a: any, b: any) => b.engagementScore - a.engagementScore)

    // Document stats
    const docTimeMap: Record<string, { seconds: number; views: number }> = {}
    for (const dl of diligenceLogs) {
      const docId = dl.documentId?.toString()
      if (!docId) continue
      if (!docTimeMap[docId]) docTimeMap[docId] = { seconds: 0, views: 0 }
      docTimeMap[docId].seconds += (dl.totalSeconds || 0)
      docTimeMap[docId].views   += 1
    }
    const documentStats = documents.map((doc: any) => {
      const docId   = doc._id.toString()
      const data    = docTimeMap[docId]
      return {
        name:      doc.name,
        views:     data?.views || 0,
        totalTime: data ? formatSeconds(data.seconds) : '—',
        skippedBy: investors.length - (data?.views || 0),
      }
    }).sort((a: any, b: any) => b.views - a.views)

    // Questions
    const newQuestions = logs
      .filter((l: any) => l.event === 'question_submitted' || l.event === 'question_asked')
      .map((l: any) => ({
        email:    l.visitorEmail || 'anonymous',
        question: l.meta?.question || l.meta?.text || '(question text missing)',
        document: l.documentName || 'general',
        askedAt:  timeAgo(new Date(l.timestamp)),
      }))

    // Heat score
    const top3     = investors.slice(0, 3)
    const avgScore = top3.length > 0
      ? Math.round(top3.reduce((s: number, i: any) => s + i.engagementScore, 0) / top3.length)
      : 0
    const heatLabel =
      avgScore >= 70 ? 'Very active — consider following up this week' :
      avgScore >= 40 ? 'Active — investors are engaged' :
      avgScore >= 15 ? 'Some activity — keep sharing' :
      'Quiet week — no significant activity'

    const weekStartLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const weekEndLabel   = weekEnd.toLocaleDateString('en-US',   { month: 'short', day: 'numeric' })

    const html = buildWeeklyDigestHtml({
      ownerName,
      weekStart: weekStartLabel,
      weekEnd:   weekEndLabel,
      spaces: [{
        spaceId:       spaceId,
        spaceName:     space.name,
        spaceUrl:      `${APP_URL}/spaces/${spaceId}`,
        newVisitors:   investors.filter((i: any) => i.isNew).length,
        totalViews:    logs.filter((l: any) => l.event === 'document_view').length,
        totalDownloads: logs.filter((l: any) => l.event === 'download' || l.event === 'file_download').length,
        totalQuestions: newQuestions.length,
        topInvestors:   investors,
        documentStats,
        newQuestions,
        dealHeatScore:  avgScore,
        heatLabel,
      }],
      appUrl: APP_URL,
    })

    const totalViews = logs.filter((l: any) => l.event === 'document_view').length
    const subject    = totalViews > 0
      ? `📊 ${totalViews} doc view${totalViews > 1 ? 's' : ''} this week — ${space.name} digest`
      : `📊 Activity summary — ${space.name}`

    const { error } = await resend.emails.send({
      from:    FROM,
      to:      [ownerEmail],
      subject,
      html,
      tags: [{ name: 'type', value: 'manual-digest' }],
    })

    if (error) {
      console.error('❌ Manual digest send failed:', error)
      return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 })
    }

    console.log(`✅ Manual digest sent to ${ownerEmail} for space: ${space.name}`)
    return NextResponse.json({ success: true, sentTo: ownerEmail })

  } catch (error) {
    console.error('❌ send-digest error:', error)
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 })
  }
}