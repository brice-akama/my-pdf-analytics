// app/api/zapier/triggers/document-viewed/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { verifyZapierApiKey } from "@/lib/zapierAuth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  const user = await verifyZapierApiKey(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await dbPromise

  // ── 1. Get all shares belonging to this user ──────────────────────
  const userShares = await db.collection("shares")
    .find({ userId: user.userId })
    .project({ documentId: 1, shareToken: 1 })
    .toArray()

  const userDocumentIds = new Set(userShares.map((s: any) => s.documentId?.toString()))
  const userTokens = new Set(userShares.map((s: any) => s.shareToken))

  // ── 2. Pull latest document_viewed events (written by session_start) ─
  const views = await db.collection("analytics_logs")
    .find({ action: "document_viewed" })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray()

  const filtered = views.filter((v: any) =>
    userTokens.has(v.shareToken) || userDocumentIds.has(v.documentId?.toString())
  )

  // ── 3. Enrich each view ───────────────────────────────────────────
  const enriched = await Promise.all(
    filtered.slice(0, 10).map(async (view: any) => {
      const documentId = view.documentId?.toString() || ""
      const viewerId = view.viewerId
      const sessionId = view.sessionId
      const viewerEmail = view.email || null

      // ── Document ──────────────────────────────────────────────────
      let doc: any = null
      try {
        if (documentId) {
          doc = await db.collection("documents").findOne({ _id: new ObjectId(documentId) })
        }
      } catch {}

      // ── Session (pagesViewed array + duration from session_end) ───
      const session = await db.collection("analytics_sessions").findOne({ sessionId })

      // ── Page logs (page_time event updates viewTime on these) ─────
      const pageLogs = await db.collection("analytics_logs").find({
        documentId,
        sessionId,
        action: "page_view",
      }).toArray()

      // Build per-page time map
      const pageTimeMap = new Map<number, number>()
      pageLogs.forEach((l: any) => {
        const existing = pageTimeMap.get(l.pageNumber) || 0
        pageTimeMap.set(l.pageNumber, existing + (l.viewTime || 0))
      })

      // Time per page string e.g. "Page 1: 45s | Page 2: 1m 20s"
      const timePerPage = pageTimeMap.size > 0
        ? Array.from(pageTimeMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([p, s]) => `Page ${p}: ${formatSeconds(s)}`)
            .join(" | ")
        : null

      // Total time: session.duration (set on session_end) OR sum of page logs
      const totalSeconds: number =
        (session?.duration && session.duration > 0)
          ? session.duration
          : pageLogs.reduce((sum: number, l: any) => sum + (l.viewTime || 0), 0)

      // Pages viewed from session.pagesViewed array e.g. [1, 2, 3]
      const pagesViewedArray: number[] = session?.pagesViewed || []
      const pagesViewedCount = pagesViewedArray.length

      // Page they spent most time on
      let mostTimeOnPage: number | null = null
      let mostTimeOnPageDuration: string | null = null
      if (pageTimeMap.size > 0) {
        const [topPage, topSecs] = Array.from(pageTimeMap.entries()).sort((a, b) => b[1] - a[1])[0]
        mostTimeOnPage = topPage
        mostTimeOnPageDuration = formatSeconds(topSecs)
      }

      // ── Viewer identity ───────────────────────────────────────────
      const identity = await db.collection("viewer_identities").findOne({ viewerId, documentId })
      const totalVisits = await db.collection("analytics_sessions").countDocuments({ documentId, viewerId })

      // ── Location ──────────────────────────────────────────────────
      const locationParts = [view.location?.city, view.location?.country].filter(Boolean)

      return {
        id: view._id.toString(),

        // Document
        document_id:        documentId,
        document_name:      doc?.originalFilename || doc?.filename || "Unknown document",
        document_url:       `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
        analytics_url:      `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
        pages_in_document:  doc?.numPages || null,

        // Viewer
        viewer_email:  viewerEmail,
        viewer_name:   viewerEmail ? viewerEmail.split("@")[0] : "Anonymous",
        is_anonymous:  !viewerEmail,

        // Visit
        is_revisit:   session?.isRevisit || false,
        visit_count:  totalVisits || 1,

        // Time analytics
        total_time_seconds:          totalSeconds > 0 ? totalSeconds : null,
        total_time_readable:         totalSeconds > 0 ? formatSeconds(totalSeconds) : null,
        pages_viewed:                pagesViewedCount || null,
        pages_viewed_list:           pagesViewedArray.sort((a, b) => a - b).join(", ") || null,
        time_per_page:               timePerPage,
        most_time_on_page:           mostTimeOnPage,
        most_time_on_page_duration:  mostTimeOnPageDuration,
        completion_percent:          doc?.numPages && pagesViewedCount
                                       ? Math.round((pagesViewedCount / doc.numPages) * 100)
                                       : null,

        // Engagement
        intent_score: identity?.intentScore || 0,

        // Device + Location
        device:           view.device || "desktop",
        location:         locationParts.length > 0 ? locationParts.join(", ") : null,
        location_country: view.location?.country || null,
        location_city:    view.location?.city || null,

        // Share
        share_token: view.shareToken || null,
        viewed_at:   view.timestamp?.toISOString() || new Date().toISOString(),
      }
    })
  )

  return NextResponse.json(enriched)
}

function formatSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s"
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}