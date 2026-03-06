import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { dbPromise } from "@/app/api/lib/mongodb"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clientId = searchParams.get("client_id")
  const redirectUri = searchParams.get("redirect_uri")
  const state = searchParams.get("state")
  const responseType = searchParams.get("response_type")

  // Validate client_id matches your Zapier app
  if (clientId !== process.env.ZAPIER_CLIENT_ID) {
    return NextResponse.json({ error: "Invalid client_id" }, { status: 401 })
  }

  if (responseType !== "code") {
    return NextResponse.json({ error: "response_type must be code" }, { status: 400 })
  }

  // Store state + redirect_uri temporarily so callback can use them
  const db = await dbPromise
  const sessionId = crypto.randomBytes(16).toString("hex")

  await db.collection("oauth_sessions").insertOne({
    sessionId,
    redirectUri,
    state,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  })

  // Redirect to your app's login page, passing sessionId
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const loginUrl = new URL(`${baseUrl}/zapier-login`)
  loginUrl.searchParams.set("session", sessionId)

  return NextResponse.redirect(loginUrl.toString())
}