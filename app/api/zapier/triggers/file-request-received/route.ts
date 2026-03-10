// app/api/zapier/triggers/file-request-received/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { verifyZapierApiKey } from "@/lib/zapierAuth"

export async function GET(request: NextRequest) {
  const user = await verifyZapierApiKey(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await dbPromise

  // Get all file requests owned by this user
  const fileRequests = await db.collection("file_requests")
    .find({ userId: user.userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray()

  // For each request, get the uploaded files
  const results: any[] = []

  for (const req of fileRequests) {
    const uploadedFiles = req.uploadedFiles || []

    if (uploadedFiles.length === 0) continue

    for (const file of uploadedFiles) {
      results.push({
        id: `${req._id.toString()}-${file._id?.toString() || file.originalName}`,
        request_id: req._id.toString(),
        request_title: req.title || "File Request",
        request_description: req.description || null,

        // File info
        file_name: file.originalName || file.filename || "Unknown file",
        file_size_bytes: file.size || null,
        file_size_readable: file.size ? formatBytes(file.size) : null,
        file_type: file.mimetype || file.contentType || null,

        // Uploader info
        uploader_name: file.uploadedBy?.name || null,
        uploader_email: file.uploadedBy?.email || null,

        // Request recipients (who you sent the request to)
        recipient_emails: (req.recipients || []).map((r: any) => r.email).join(", "),

        // Dates
        received_at: file.uploadedAt?.toISOString() || req.updatedAt?.toISOString() || new Date().toISOString(),
        request_due_date: req.dueDate ? new Date(req.dueDate).toISOString() : null,
        request_created_at: req.createdAt?.toISOString() || null,

        // Progress
        files_received: req.filesReceived || uploadedFiles.length,
        files_expected: req.expectedFiles || req.totalFiles || null,
        request_status: req.status || "active",

        // Link to view the request in DocMetrics
        request_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?page=file-requests&openRequest=${req._id.toString()}`,

        // Public upload link (in case you want to send it again via Zap)
        upload_link: req.shareToken
          ? `${process.env.NEXT_PUBLIC_APP_URL}/public/file-request/${req.shareToken}`
          : null,
      })
    }
  }

  // Sort by received_at descending, return last 10
  results.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())

  return NextResponse.json(results.slice(0, 10))
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}