// app/api/cc/[uniqueId]/track/route.ts
//
// WHAT THIS FILE DOES:
//   Records every tracking event for a CC recipient:
//     - "opened"      → first time they open the document link
//     - "time_spent"  → total seconds spent on page (sent via beacon on unload)
//     - "downloaded"  → they clicked the download button
//
// HOW IT WORKS:
//   Each event does a MongoDB $set / $inc on the cc_recipients document
//   so the owner always sees a live, up-to-date picture of CC activity.
//   We also write one entry to analytics_logs per event so the owner can
//   see a full timeline (opened at 9am, downloaded at 9:04am, etc.)
//
// CALLED FROM:
//   CCViewPage.tsx — three places:
//     1. On mount after fetchCCData succeeds          → event: "opened"
//     2. navigator.sendBeacon on beforeunload         → event: "time_spent"
//     3. Inside handleDownload after file is saved    → event: "downloaded"
//
// NEXT.JS 15: params is a Promise — awaited before use.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'
import { ObjectId } from 'mongodb'
import { sendCCOpenedNotificationEmail } from '@/lib/emailService'

 

// ── Allowed event types ───────────────────────────────────────────────────────
type TrackingEvent = 'opened' | 'time_spent' | 'downloaded'

const ALLOWED_EVENTS: TrackingEvent[] = ['opened', 'time_spent', 'downloaded']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    // ✅ Next.js 15: await params before accessing properties
    const { uniqueId } = await params

    // navigator.sendBeacon sends text/plain — handle both JSON and plain text
    const contentType = request.headers.get('content-type') || ''
    let body: any = {}
    try {
      const raw = await request.text()
      body = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { email, event, secondsSpent } = body

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    if (!event || !ALLOWED_EVENTS.includes(event as TrackingEvent)) {
      return NextResponse.json(
        { error: `Invalid event. Must be one of: ${ALLOWED_EVENTS.join(', ')}` },
        { status: 400 }
      )
    }

    const db = await dbPromise
    const now = new Date()

    // ── Look up the CC record ─────────────────────────────────────────────────
    const ccRecord = await db.collection('cc_recipients').findOne({
      uniqueId,
      email: email.toLowerCase().trim(),
    })

    if (!ccRecord) {
      // Return 200 anyway — we never want the beacon to retry endlessly
      return NextResponse.json({ success: false, reason: 'CC record not found' })
    }

    // ── Get request metadata for the log ─────────────────────────────────────
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Simple device detection from user agent
    const device = /mobile|android|iphone|ipad/i.test(userAgent)
      ? 'mobile'
      : /tablet/i.test(userAgent)
      ? 'tablet'
      : 'desktop'

    // ── Handle each event type ────────────────────────────────────────────────

    if (event === 'opened') {
      const isFirstOpen = !ccRecord.firstOpenedAt

      // Build the update — always increment viewCount, set timestamps
      const $set: any = {
        lastOpenedAt: now,
        updatedAt: now,
      }
      const $inc: any = {
        viewCount: 1,
      }

      // Only set firstOpenedAt once — never overwrite it
      if (isFirstOpen) {
        $set.firstOpenedAt = now
        $set.firstIpAddress = ipAddress
        $set.firstDevice = device
        $set.firstUserAgent = userAgent
      }

      await db.collection('cc_recipients').updateOne(
        { uniqueId, email: email.toLowerCase().trim() },
        { $set, $inc }
      )

      // Write to analytics_logs for the timeline view
      await db.collection('analytics_logs').insertOne({
        documentId: ccRecord.documentId,
        ccRecipientId: ccRecord._id.toString(),
        uniqueId,
        action: 'cc_opened',
        email: ccRecord.email,
        ccName: ccRecord.name || null,
        isFirstOpen,
        ipAddress,
        device,
        userAgent,
        timestamp: now,
      })

      // If this is the first open, also notify the document owner
      // by updating the parent document's CC tracking summary
      if (isFirstOpen && ccRecord.documentId) {
        try {
          await db.collection('documents').updateOne(
            { _id: new ObjectId(ccRecord.documentId) },
            {
              $inc: { 'ccTracking.totalOpens': 1 },
              $set: { 'ccTracking.lastActivityAt': now },
            }
          )
        } catch {
          // Non-blocking — document update failure should not fail the track call
        }
      }

      if (isFirstOpen) {
  // Fetch owner email from the document
  const doc = await db.collection('documents').findOne(
    { _id: new ObjectId(ccRecord.documentId) },
    { projection: { userId: 1, originalFilename: 1 } }
  )

  if (doc?.userId) {
    const owner = await db.collection('users').findOne(
      { _id: new ObjectId(doc.userId) },
      { projection: { email: 1, 'profile.firstName': 1 } }
    )

    if (owner) {
      const analyticsLink = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/documents/${ccRecord.documentId}/analytics`

      Promise.resolve(sendCCOpenedNotificationEmail({
        ownerEmail: owner.email,
        ownerName: owner.profile?.firstName || owner.email,
        ccName: ccRecord.name || ccRecord.email,
        ccEmail: ccRecord.email,
        documentName: doc.originalFilename || 'Document',
        device: device || null,
        analyticsLink,
      })).catch(err =>
        console.error('CC open notification email failed (non-blocking):', err)
      )
    }
  }
}

      return NextResponse.json({ success: true, event: 'opened', isFirstOpen })
    }

    // ── time_spent ────────────────────────────────────────────────────────────
    if (event === 'time_spent') {
      const seconds = typeof secondsSpent === 'number' && secondsSpent > 0
        ? Math.min(secondsSpent, 7200) // cap at 2 hours to ignore stale tabs
        : 0

      if (seconds === 0) {
        return NextResponse.json({ success: true, event: 'time_spent', seconds: 0 })
      }

      await db.collection('cc_recipients').updateOne(
        { uniqueId, email: email.toLowerCase().trim() },
        {
          $inc: { totalTimeSpentSeconds: seconds },
          $set: { lastOpenedAt: now, updatedAt: now },
        }
      )

      // Log the session
      await db.collection('analytics_logs').insertOne({
        documentId: ccRecord.documentId,
        ccRecipientId: ccRecord._id.toString(),
        uniqueId,
        action: 'cc_time_spent',
        email: ccRecord.email,
        ccName: ccRecord.name || null,
        secondsSpent: seconds,
        ipAddress,
        device,
        timestamp: now,
      })

      return NextResponse.json({ success: true, event: 'time_spent', seconds })
    }

    // ── downloaded ────────────────────────────────────────────────────────────
    if (event === 'downloaded') {
      const isFirstDownload = !ccRecord.firstDownloadedAt

      const $set: any = {
        lastDownloadedAt: now,
        downloaded: true,
        updatedAt: now,
      }
      const $inc: any = { downloadCount: 1 }

      if (isFirstDownload) {
        $set.firstDownloadedAt = now
      }

      await db.collection('cc_recipients').updateOne(
        { uniqueId, email: email.toLowerCase().trim() },
        { $set, $inc }
      )

      await db.collection('analytics_logs').insertOne({
        documentId: ccRecord.documentId,
        ccRecipientId: ccRecord._id.toString(),
        uniqueId,
        action: 'cc_downloaded',
        email: ccRecord.email,
        ccName: ccRecord.name || null,
        isFirstDownload,
        ipAddress,
        device,
        timestamp: now,
      })

      // Mirror to document-level summary
      if (ccRecord.documentId) {
        try {
          await db.collection('documents').updateOne(
            { _id: new ObjectId(ccRecord.documentId) },
            {
              $inc: { 'ccTracking.totalDownloads': 1 },
              $set: { 'ccTracking.lastActivityAt': now },
            }
          )
        } catch {
          // Non-blocking
        }
      }

      return NextResponse.json({ success: true, event: 'downloaded', isFirstDownload })
    }

    // Should never reach here given the ALLOWED_EVENTS check above
    return NextResponse.json({ error: 'Unhandled event' }, { status: 400 })

  } catch (error: any) {
    console.error('❌ CC track error:', error?.message || error)
    // Always return 200 for beacon requests so the browser does not retry
    return NextResponse.json({ success: false, error: 'Internal server error' })
  }
}

 
