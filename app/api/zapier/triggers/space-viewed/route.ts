// app/api/zapier/triggers/space-viewed/route.ts
//
// Fires when a visitor enters a Space (data room), views a document inside it,
// or downloads something. Reads from activityLogs + diligenceLogs.
//
// Zapier polls this every ~15 min. It looks for new `id` values.
// Return newest 10 events so Zapier can detect what's new.

import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { verifyZapierApiKey } from "@/lib/zapierAuth"

export async function GET(request: NextRequest) {
  const user = await verifyZapierApiKey(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await dbPromise

  // ── 1. Get all spaces owned by this user ──────────────────────────
  const userSpaces = await db.collection("spaces")
    .find({ userId: user.userId })
    .project({ _id: 1, name: 1, publicAccess: 1 })
    .toArray()

  if (userSpaces.length === 0) return NextResponse.json([])

  const spaceIds = userSpaces.map((s: any) => s._id)

  // Build a map of spaceId → spaceName for enrichment
  const spaceNameMap: Record<string, string> = {}
  for (const s of userSpaces) {
    spaceNameMap[s._id.toString()] = s.name || "Untitled Space"
  }

  // ── 2. Pull latest meaningful activity from activityLogs ──────────
  const meaningfulEvents = ["portal_enter", "document_view", "download"]

  const logs = await db.collection("activityLogs")
    .find({
      spaceId: { $in: spaceIds },
      event: { $in: meaningfulEvents },
    })
    .sort({ timestamp: -1 })
    .limit(30)
    .toArray()

  // ── 3. For document_view events, enrich with time-on-doc from diligenceLogs
  const enriched = await Promise.all(
    logs.slice(0, 10).map(async (log: any) => {
      const spaceId = log.spaceId?.toString()
      const spaceName = spaceNameMap[spaceId] || "Untitled Space"

      // Get time spent on this doc in this session (from diligenceLogs)
      let timeOnDocSeconds: number | null = null
      if (log.event === "document_view" && log.documentId) {
        const diligence = await db.collection("diligenceLogs").findOne({
          spaceId: log.spaceId,
          visitorEmail: log.visitorEmail,
          documentId: log.documentId,
        })
        timeOnDocSeconds = diligence?.totalSeconds || null
      }

      // Count total visits by this visitor to this space
      const visitCount = log.visitorEmail
        ? await db.collection("activityLogs").countDocuments({
            spaceId: log.spaceId,
            visitorEmail: log.visitorEmail,
            event: "portal_enter",
          })
        : null

      // Determine if revisit
      const isRevisit = visitCount !== null && visitCount > 1

      // Map event to human-readable label
      const eventLabels: Record<string, string> = {
        portal_enter: "Opened Space",
        document_view: "Viewed Document",
        download: "Downloaded File",
      }

      return {
        // Zapier requires a unique `id` per item
        id: log._id.toString(),

        // Space info
        space_id: spaceId,
        space_name: spaceName,
        space_url: `${process.env.NEXT_PUBLIC_APP_URL}/spaces/${spaceId}`,

        // Event info
        event: log.event,
        event_label: eventLabels[log.event] || log.event,

        // Visitor info
        visitor_email: log.visitorEmail || null,
        visitor_name: log.visitorEmail
          ? log.visitorEmail.split("@")[0]
          : "Anonymous",
        is_anonymous: !log.visitorEmail,
        is_revisit: isRevisit,
        visit_count: visitCount || 1,

        // Document info (only for document_view + download events)
        document_name: log.documentName || null,
        document_id: log.documentId?.toString() || null,
        time_on_document_seconds: timeOnDocSeconds,
        time_on_document_readable: timeOnDocSeconds
          ? formatSeconds(timeOnDocSeconds)
          : null,

        // Metadata
        ip_address: log.ipAddress || null,
        occurred_at: log.timestamp?.toISOString() || new Date().toISOString(),

        // Deep link for follow-up
        analytics_url: `${process.env.NEXT_PUBLIC_APP_URL}/spaces/${spaceId}`,
      }
    })
  )

  return NextResponse.json(enriched)
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}