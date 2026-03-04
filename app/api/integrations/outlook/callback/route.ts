import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../../../lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state") // User ID

    if (!code || !state) {
      const url = new URL("/dashboard", request.url)
      url.searchParams.set("error", "outlook_auth_failed")
      return NextResponse.redirect(url)
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.OUTLOOK_CLIENT_ID!,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
          redirect_uri: process.env.OUTLOOK_REDIRECT_URI!,
          grant_type: "authorization_code",
        }),
      }
    )

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Outlook token exchange failed:", tokenData)
      const url = new URL("/dashboard", request.url)
      url.searchParams.set("error", "outlook_token_failed")
      return NextResponse.redirect(url)
    }

    const { access_token, refresh_token, expires_in } = tokenData

    // Get user's Outlook email via Microsoft Graph
    const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const userInfo = await userInfoResponse.json()

    // Save to integrations collection — same pattern as Gmail
    const db = await dbPromise
    const expiresAt = new Date(Date.now() + expires_in * 1000)

    await db.collection("integrations").updateOne(
      { userId: state, provider: "outlook" },
      {
        $set: {
          userId: state,
          provider: "outlook",
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          metadata: {
            email: userInfo.mail || userInfo.userPrincipalName,
            displayName: userInfo.displayName,
          },
          isActive: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    console.log("✅ Outlook connected for user:", state, "Email:", userInfo.mail)

    const url = new URL("/dashboard", request.url)
    url.searchParams.set("integration", "outlook")
    url.searchParams.set("status", "connected")
    return NextResponse.redirect(url)
  } catch (error) {
    console.error("Outlook callback error:", error)
    const url = new URL("/dashboard", request.url)
    url.searchParams.set("error", "outlook_callback_failed")
    return NextResponse.redirect(url)
  }
}