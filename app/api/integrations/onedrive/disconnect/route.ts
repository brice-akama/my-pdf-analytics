import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { dbPromise } from "@/app/api/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = await dbPromise
    await db.collection("integrations").updateOne(
      { userId: user.id, provider: "onedrive" },
      { $set: { isActive: false, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("OneDrive disconnect error:", error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}