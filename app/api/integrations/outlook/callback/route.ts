 import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../../../lib/mongodb"

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
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
    const state = searchParams.get("state") // User ID

    if (!code || !state) {
      return redirectWithCookie(
        `${baseUrl}/dashboard?error=outlook_auth_failed`,
        request
      )
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
      return redirectWithCookie(
        `${baseUrl}/dashboard?error=outlook_token_failed`,
        request
      )
    }

    const { access_token, refresh_token, expires_in } = tokenData

    // Get user's Outlook email via Microsoft Graph
    const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const userInfo = await userInfoResponse.json()

    // Save to integrations collection
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

    console.log("✅ Outlook connected for user:", state, "Email:", userInfo.mail || userInfo.userPrincipalName)

    return redirectWithCookie(
      `${baseUrl}/dashboard?integration=outlook&status=connected`,
      request
    )

  } catch (error) {
    console.error("Outlook callback error:", error)
    return redirectWithCookie(
      `${baseUrl}/dashboard?error=outlook_callback_failed`,
      request
    )
  }
}