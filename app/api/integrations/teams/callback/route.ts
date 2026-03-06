import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

function redirectWithCookie(url: string, request: NextRequest) {
  const response = NextResponse.redirect(url)
  const tokenCookie = request.cookies.get('token')
  if (tokenCookie) {
    response.cookies.set('token', tokenCookie.value, COOKIE_OPTIONS)
  }
  return response
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      return redirectWithCookie(`${baseUrl}/dashboard?error=teams_auth_failed`, request)
    }

    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.OUTLOOK_CLIENT_ID!,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
          redirect_uri: process.env.TEAMS_REDIRECT_URI!,
          grant_type: "authorization_code",
        }),
      }
    )

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Teams token exchange failed:", tokenData)
      return redirectWithCookie(`${baseUrl}/dashboard?error=teams_token_failed`, request)
    }

    const { access_token, refresh_token, expires_in } = tokenData

    // Get user info
    const userInfoRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const userInfo = await userInfoRes.json()

    const db = await dbPromise
    const expiresAt = new Date(Date.now() + expires_in * 1000)

    await db.collection("integrations").updateOne(
      { userId: state, provider: "teams" },
      {
        $set: {
          userId: state,
          provider: "teams",
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          // channelId saved separately after user picks channel
          channelId: null,
          teamId: null,
          channelName: null,
          metadata: {
            email: userInfo.mail || userInfo.userPrincipalName,
            displayName: userInfo.displayName,
          },
          isActive: true,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    )

    console.log("✅ Teams connected for user:", state)

    // Redirect to dashboard with flag to open channel picker
    return redirectWithCookie(
      `${baseUrl}/dashboard?integration=teams&status=connected`,
      request
    )

  } catch (error) {
    console.error("Teams callback error:", error)
    return redirectWithCookie(`${baseUrl}/dashboard?error=teams_callback_failed`, request)
  }
}