import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    // ✅ FIX: extract the authorization header as a string
    const authHeader = req.headers.get("authorization")

    const user = await verifyUserFromRequest(authHeader) // ✅ pass string, not req

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

    const documents = await db
      .collection("documents")
      .find({
        spaceId: new ObjectId(spaceId),
        name: { $regex: query, $options: "i" },
      })
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id.toString(),
        name: doc.name,
        type: doc.type || "PDF",
        size: doc.size || "0 MB",
        views: doc.views || 0,
        downloads: doc.downloads || 0,
        lastUpdated: formatDate(doc.updatedAt),
        folderId: doc.folderId?.toString() || null,
      })),
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ success: false, message: "Search failed" }, { status: 500 })
  }
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}
