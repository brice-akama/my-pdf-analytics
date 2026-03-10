// app/api/zapier/triggers/document-downloaded/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { verifyZapierApiKey } from "@/lib/zapierAuth"

export async function GET(request: NextRequest) {
  const user = await verifyZapierApiKey(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await dbPromise

  // Get all shares belonging to this user
  const userShares = await db.collection("shares")
    .find({ userId: user.userId })
    .project({ documentId: 1, shareToken: 1, _id: 1 })
    .toArray()

  const userTokens = new Set(userShares.map((s: any) => s.shareToken))

  // Pull download events from document_views (downloaded: true)
  const downloads = await db.collection("document_views")
    .find({
      shareToken: { $in: Array.from(userTokens) },
      downloaded: true,
    })
    .sort({ viewedAt: -1 })
    .limit(10)
    .toArray()

  // Also check shares.tracking.downloadEvents for richer data
  const shareDownloadEvents: any[] = []
  for (const share of userShares) {
    const shareDoc = await db.collection("shares").findOne({ _id: share._id })
    const events = shareDoc?.tracking?.downloadEvents || []
    for (const ev of events) {
      if (ev.allowed !== false) {
        const doc = await db.collection("documents").findOne({ _id: share.documentId }).catch(() => null)
        shareDownloadEvents.push({
          shareToken: share.shareToken,
          documentId: share.documentId?.toString(),
          documentName: doc?.originalFilename || doc?.filename || "Unknown document",
          viewerId: ev.viewerId,
          email: ev.email || null,
          timestamp: ev.timestamp,
        })
      }
    }
  }

  // Merge both sources, prefer share download events as they are richer
  // Deduplicate by viewerId + documentId + rough timestamp
  const results = shareDownloadEvents.slice(0, 10).map((ev: any, index: number) => {
    const locationParts: string[] = []

    return {
      id: `${ev.documentId}-${ev.viewerId}-${ev.timestamp?.getTime?.() || index}`,
      document_id: ev.documentId || "",
      document_name: ev.documentName,
      document_url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${ev.documentId}`,
      analytics_url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${ev.documentId}`,
      downloader_email: ev.email || null,
      downloader_name: ev.email ? ev.email.split("@")[0] : "Anonymous",
      is_anonymous: !ev.email,
      share_token: ev.shareToken || null,
      downloaded_at: ev.timestamp?.toISOString() || new Date().toISOString(),
    }
  })

  // Fallback to document_views if no share download events found
  if (results.length === 0) {
    const fallback = await Promise.all(
      downloads.map(async (d: any) => {
        const doc = await db.collection("documents")
          .findOne({ _id: d.documentId })
          .catch(() => null)

        return {
          id: d._id.toString(),
          document_id: d.documentId?.toString() || "",
          document_name: doc?.originalFilename || doc?.filename || "Unknown document",
          document_url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${d.documentId}`,
          analytics_url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${d.documentId}`,
          downloader_email: d.email || null,
          downloader_name: d.email ? d.email.split("@")[0] : "Anonymous",
          is_anonymous: !d.email,
          device: d.device || null,
          location: d.country || null,
          share_token: d.shareToken || null,
          downloaded_at: d.viewedAt?.toISOString() || new Date().toISOString(),
        }
      })
    )
    return NextResponse.json(fallback)
  }

  return NextResponse.json(results)
}