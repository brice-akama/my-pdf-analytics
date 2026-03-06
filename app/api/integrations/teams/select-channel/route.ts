import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { dbPromise } from "@/app/api/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { teamId, channelId, teamName, channelName } = await request.json()

    if (!teamId || !channelId) {
      return NextResponse.json({ error: "teamId and channelId required" }, { status: 400 })
    }

    const db = await dbPromise
    await db.collection("integrations").updateOne(
      { userId: user.id, provider: "teams" },
      {
        $set: {
          teamId,
          channelId,
          channelName: `${teamName} → ${channelName}`,
          updatedAt: new Date(),
        }
      }
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Teams select channel error:", error)
    return NextResponse.json({ error: "Failed to save channel" }, { status: 500 })
  }
}