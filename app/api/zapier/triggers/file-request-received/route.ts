import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import jwt from "jsonwebtoken"

async function verifyZapierToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET!) as any
    if (decoded.type !== "zapier_access") return null
    return decoded.userId
  } catch { return null }
}

export async function GET(request: NextRequest) {
  const userId = await verifyZapierToken(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await dbPromise
  const requests = await db.collection("fileRequests")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray()

  return NextResponse.json(requests.map((r) => ({
    id: r._id.toString(),
    title: r.title,
    requester_name: r.requesterName || "Anonymous",
    requester_email: r.requesterEmail || null,
    file_name: r.fileName || null,
    received_at: r.createdAt?.toISOString(),
  })))
}