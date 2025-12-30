// app/api/documents/recent/route.ts

import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    // ✅ FIXED: Use HTTP-only cookies instead of Authorization header
    const user = await verifyUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get("spaceId")
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!spaceId) {
      return NextResponse.json(
        { success: false, message: "Missing spaceId" }, 
        { status: 400 }
      )
    }

    const db = await dbPromise

    // ✅ Verify user has access to this space
    const space = await db.collection("spaces").findOne({
      _id: new ObjectId(spaceId),
      userId: user.id
    })

    if (!space) {
      return NextResponse.json(
        { success: false, message: "Space not found or access denied" }, 
        { status: 404 }
      )
    }

    // ✅ Fetch recent documents sorted by last updated
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
        folderId: doc.folderId?.toString() || null,
        cloudinaryPdfUrl: doc.cloudinaryPdfUrl || null
      }))
    })
  } catch (error) {
    console.error("Recent files error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch recent files" }, 
      { status: 500 }
    )
  }
}

function formatDate(date: Date): string {
  if (!date) return "Unknown"
  
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - new Date(date).getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}