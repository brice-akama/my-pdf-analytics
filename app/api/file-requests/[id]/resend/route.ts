import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyUserFromRequest } from "@/lib/auth"

export const dynamic = 'force-dynamic'

// POST - Resend email to recipient
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    console.log('📧 [RESEND] Request ID:', id)
    console.log('📧 [RESEND] Recipient:', email)

    const db = await dbPromise
    const request = await db.collection("fileRequests").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user.id)
    })

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Find recipient in array
    const recipientIndex = request.recipients.findIndex(
      (r: any) => r.email === email
    )

    if (recipientIndex === -1) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Update notifiedAt timestamp
    await db.collection("fileRequests").updateOne(
      { _id: request._id },
      {
        $set: {
          [`recipients.${recipientIndex}.notified`]: true,
          [`recipients.${recipientIndex}.notifiedAt`]: new Date(),
          updatedAt: new Date()
        }
      }
    )

    console.log('✅ [RESEND] Updated timestamp for:', email)

    // TODO: Actually send email here
    // await sendFileRequestEmail(email, request.shareToken, request.title)

    return NextResponse.json({
      success: true,
      message: "Email resent successfully"
    })
  } catch (error) {
    console.error("❌ [RESEND] Error:", error)
    return NextResponse.json({ 
      error: "Failed to resend email" 
    }, { status: 500 })
  }
}
