import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../../../lib/mongodb"
import { verifyUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "outlook",
      isActive: true,
    })

    if (!integration) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      email: integration.metadata?.email,
      displayName: integration.metadata?.displayName,
    })
  } catch (error) {
    console.error("Outlook status error:", error)
    return NextResponse.json({ connected: false })
  }
}