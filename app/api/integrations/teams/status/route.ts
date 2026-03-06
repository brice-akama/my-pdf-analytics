import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { dbPromise } from "@/app/api/lib/mongodb"
 

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ connected: false })

    const db = await dbPromise
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "teams",
      isActive: true,
    })

    if (!integration) return NextResponse.json({ connected: false })

    return NextResponse.json({
      connected: true,
      email: integration.metadata?.email,
      channelName: integration.channelName,
      channelPicked: !!integration.channelId,
    })

  } catch (error) {
    return NextResponse.json({ connected: false })
  }
}