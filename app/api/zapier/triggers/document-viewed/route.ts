import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import jwt from "jsonwebtoken"

async function verifyZapierToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  try {
    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (decoded.type !== "zapier_access") return null
    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const userId = await verifyZapierToken(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await dbPromise

  // Return last 10 document views for this user's documents
  const views = await db.collection("document_views")
    .find({ documentOwnerId: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray()

  // Zapier needs a unique id field on every item
  const results = views.map((view) => ({
    id: view._id.toString(),
    document_id: view.documentId,
    document_name: view.documentName,
    document_url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${view.documentId}`,
    viewer_name: view.viewerName || "Anonymous",
    viewer_email: view.viewerEmail || null,
    viewer_location: view.viewerLocation || null,
    page_count: view.pageCount || null,
    viewed_at: view.createdAt?.toISOString(),
  }))

  return NextResponse.json(results)
}