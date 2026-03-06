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
  const signatures = await db.collection("signatures")
    .find({ documentOwnerId: userId, status: "completed" })
    .sort({ completedAt: -1 })
    .limit(10)
    .toArray()

  return NextResponse.json(signatures.map((s) => ({
    id: s._id.toString(),
    document_id: s.documentId,
    document_name: s.documentName,
    signer_name: s.signerName,
    signer_email: s.signerEmail,
    signed_at: s.completedAt?.toISOString(),
    document_url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${s.documentId}`,
  })))
}