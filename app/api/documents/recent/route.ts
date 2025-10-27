import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
 
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    // ✅ FIX: extract the Authorization header
    const authHeader = req.headers.get("authorization")
    const user = await verifyUserFromRequest(authHeader)

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const spaceId = searchParams.get("spaceId")
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!spaceId) {
      return NextResponse.json({ success: false, message: "Missing spaceId" }, { status: 400 })
    }

    const db = await dbPromise

    // ✅ FIX: match the correct field name from your auth payload (`user.id`, not user.userId)
    const space = await db.collection("spaces").findOne({
      _id: new ObjectId(spaceId),
      userId: new ObjectId(user.id)
    })

    if (!space) {
      return NextResponse.json({ success: false, message: "Space not found or access denied" }, { status: 404 })
    }

    const documents = await db
      .collection("documents")
      .find({ spaceId: new ObjectId(spaceId) })
      .sort({ updatedAt: -1 })
      .limit(limit)
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
        folderId: doc.folderId?.toString() || null
      }))
    })
  } catch (error) {
    console.error("Recent files error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch recent files" }, { status: 500 })
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
