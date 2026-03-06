import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    let body: any = {}

    if (contentType.includes("application/json")) {
      body = await request.json()
    } else {
      const text = await request.text()
      body = Object.fromEntries(new URLSearchParams(text))
    }

    const { grant_type, code, client_id, client_secret, redirect_uri, refresh_token } = body

    // Validate client credentials
    if (
      client_id !== process.env.ZAPIER_CLIENT_ID ||
      client_secret !== process.env.ZAPIER_CLIENT_SECRET
    ) {
      return NextResponse.json({ error: "invalid_client" }, { status: 401 })
    }

    const db = await dbPromise

    if (grant_type === "authorization_code") {
      // Look up the auth code
      const authCode = await db.collection("zapier_auth_codes").findOne({
        code,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      })

      if (!authCode) {
        return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
      }

      // Mark code as used
      await db.collection("zapier_auth_codes").updateOne(
        { code },
        { $set: { isUsed: true } }
      )

      // Generate access token + refresh token
      const accessToken = jwt.sign(
        { userId: authCode.userId, type: "zapier_access" },
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
      )

      const newRefreshToken = jwt.sign(
        { userId: authCode.userId, type: "zapier_refresh" },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" }
      )

      // Save refresh token
      await db.collection("zapier_tokens").updateOne(
        { userId: authCode.userId },
        {
          $set: {
            userId: authCode.userId,
            refreshToken: newRefreshToken,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      )

      return NextResponse.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: newRefreshToken,
      })
    }

    if (grant_type === "refresh_token") {
      // Verify refresh token
      let decoded: any
      try {
        decoded = jwt.verify(refresh_token, process.env.JWT_SECRET!)
      } catch {
        return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
      }

      if (decoded.type !== "zapier_refresh") {
        return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
      }

      // Issue new access token
      const newAccessToken = jwt.sign(
        { userId: decoded.userId, type: "zapier_access" },
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
      )

      return NextResponse.json({
        access_token: newAccessToken,
        token_type: "Bearer",
        expires_in: 3600,
      })
    }

    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 })

  } catch (error) {
    console.error("Zapier token error:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}