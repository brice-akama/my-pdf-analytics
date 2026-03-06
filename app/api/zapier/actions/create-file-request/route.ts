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

export async function POST(request: NextRequest) {
  const userId = await verifyZapierToken(request)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { title, recipient_email, message } = await request.json()
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 })

    const db = await dbPromise
    const result = await db.collection("fileRequests").insertOne({
      userId,
      title,
      recipientEmail: recipient_email || null,
      message: message || null,
      source: "zapier",
      createdAt: new Date(),
    })

    return NextResponse.json({
      id: result.insertedId.toString(),
      title,
      recipient_email: recipient_email || null,
      created_at: new Date().toISOString(),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/file-requests/${result.insertedId}`,
    })

  } catch (error) {
    return NextResponse.json({ error: "Failed to create file request" }, { status: 500 })
  }
}