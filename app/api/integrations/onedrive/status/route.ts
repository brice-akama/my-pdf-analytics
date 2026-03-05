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
      provider: "onedrive",
      isActive: true,
    })

    if (!integration) return NextResponse.json({ connected: false })

    return NextResponse.json({
      connected: true,
      email: integration.metadata?.email,
      displayName: integration.metadata?.displayName,
    })

  } catch (error) {
    console.error("OneDrive status error:", error)
    return NextResponse.json({ connected: false })
  }
}