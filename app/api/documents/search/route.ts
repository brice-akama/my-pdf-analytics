import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    // ✅ FIX 1: Pass req directly (not authHeader string)
    const user = await verifyUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const spaceId = searchParams.get("spaceId")
    const query = searchParams.get("query")

    if (!spaceId || !query) {
      return NextResponse.json({ success: false, message: "Missing parameters" }, { status: 400 })
    }

    const db = await dbPromise

    const regex = { $regex: query, $options: "i" }

    //   Search spaceId as plain string AND ObjectId (covers both storage formats)
    //   Search across name, originalFilename, title, AND folders
    const [documents, folders] = await Promise.all([
     db.collection("documents").find({
  $and: [
    {
      $or: [
        { spaceId: spaceId },
        { spaceId: new ObjectId(spaceId) },
      ]
    },
    { archived: { $ne: true } },
    {
      $or: [
        { name: regex },
        { originalFilename: regex },
        { title: regex },
      ]
    }
  ]
}).sort({ updatedAt: -1 }).toArray(),

      db.collection("space_folders").find({
        $or: [
          { spaceId: spaceId },
          { spaceId: new ObjectId(spaceId) },
        ],
        name: regex,
      }).sort({ updatedAt: -1 }).toArray(),
    ])

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id.toString(),
        name: doc.originalFilename || doc.name || doc.title || "Untitled",
        type: doc.originalFormat?.toUpperCase() || doc.fileType?.toUpperCase() || "PDF",
        size: formatSize(doc.size || doc.fileSize || 0),
        views: doc.tracking?.views ?? doc.views ?? 0,
        downloads: doc.tracking?.downloads ?? doc.downloads ?? 0,
        lastUpdated: formatDate(doc.updatedAt || doc.createdAt),
        folder: doc.folder || doc.folderId?.toString() || null,
        cloudinaryPdfUrl: doc.cloudinaryPdfUrl || null,
        canDownload: doc.canDownload !== false,
      })),
      folders: folders.map(f => ({
        id: f._id.toString(),
        name: f.name,
        documentCount: f.documentCount || 0,
        lastUpdated: formatDate(f.updatedAt || f.createdAt),
      })),
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ success: false, message: "Search failed" }, { status: 500 })
  }
}

function formatSize(bytes: any): string {
  if (!bytes || isNaN(bytes)) return "—"
  const b = Number(bytes)
  if (b < 1024) return b + " B"
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB"
  return (b / (1024 * 1024)).toFixed(1) + " MB"
}

function formatDate(date: any): string {
  if (!date) return "Unknown"
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}
