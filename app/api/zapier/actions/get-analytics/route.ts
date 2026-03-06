import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"

async function verifyZapierToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET!) as any
    if (decoded.type !== "zapier_access") return null
    return decoded.userId
  } catch { return null }
}

export async function POST(request: NextRequest) {
  const userId = await verifyZapierToken(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { document_id } = await request.json()
    if (!document_id) return NextResponse.json({ error: "document_id required" }, { status: 400 })

    const db = await dbPromise
    const doc = await db.collection("documents").findOne({
      _id: new ObjectId(document_id),
      userId,
    })

    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

    return NextResponse.json({
      id: document_id,
      document_name: doc.originalFilename,
      views: doc.tracking?.views || 0,
      downloads: doc.tracking?.downloads || 0,
      shares: doc.tracking?.shares || 0,
      health_score: doc.analytics?.healthScore || 0,
      page_count: doc.numPages || 0,
      word_count: doc.wordCount || 0,
      last_viewed: doc.tracking?.lastViewed?.toISOString() || null,
      created_at: doc.createdAt?.toISOString(),
    })

  } catch (error) {
    return NextResponse.json({ error: "Failed to get analytics" }, { status: 500 })
  }
}