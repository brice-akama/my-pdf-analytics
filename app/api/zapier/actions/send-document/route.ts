import { NextRequest, NextResponse } from "next/server"
 import { dbPromise } from "@/app/api/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

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
    const { document_id, recipient_email, recipient_name, message } = await request.json()

    if (!document_id || !recipient_email) {
      return NextResponse.json(
        { error: "document_id and recipient_email are required" },
        { status: 400 }
      )
    }

    const db = await dbPromise
    const doc = await db.collection("documents").findOne({
      _id: new ObjectId(document_id),
      userId,
    })

    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const docUrl = `${appUrl}/documents/${document_id}`

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com",
      to: recipient_email,
      subject: `Document shared with you: ${doc.originalFilename}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>A document has been shared with you</h2>
          ${message ? `<p>${message}</p>` : ""}
          <p><strong>Document:</strong> ${doc.originalFilename}</p>
          <a href="${docUrl}"
             style="display:inline-block; padding:12px 24px; background:#6366f1;
                    color:white; text-decoration:none; border-radius:8px; margin-top:16px;">
            View Document
          </a>
        </div>
      `,
    })

    // Log the share
    await db.collection("documents").updateOne(
      { _id: new ObjectId(document_id) },
      { $inc: { "tracking.shares": 1 } }
    )

    return NextResponse.json({
      id: `send_${Date.now()}`,
      document_id,
      document_name: doc.originalFilename,
      recipient_email,
      sent_at: new Date().toISOString(),
    })

  } catch (error) {
    return NextResponse.json({ error: "Failed to send document" }, { status: 500 })
  }
}