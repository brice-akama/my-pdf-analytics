import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get("session")
  const userId = searchParams.get("userId") // passed from your login page

  if (!sessionId || !userId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const db = await dbPromise

  // Look up the session
  const session = await db.collection("oauth_sessions").findOne({
    sessionId,
    expiresAt: { $gt: new Date() },
  })

  if (!session) {
    return NextResponse.json({ error: "Session expired. Please try again." }, { status: 400 })
  }

  // Generate auth code
  const code = crypto.randomBytes(24).toString("hex")

  await db.collection("zapier_auth_codes").insertOne({
    code,
    userId,
    isUsed: false,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    createdAt: new Date(),
  })

  // Clean up session
  await db.collection("oauth_sessions").deleteOne({ sessionId })

  // Redirect back to Zapier with the code
  const redirectUrl = new URL(session.redirectUri)
  redirectUrl.searchParams.set("code", code)
  if (session.state) redirectUrl.searchParams.set("state", session.state)

  return NextResponse.redirect(redirectUrl.toString())
}