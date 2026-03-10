// app/api/zapier/me/route.ts
// Zapier calls this endpoint to verify the connection is working.
// It must support BOTH API key auth (dashboard users) and JWT auth (OAuth flow).
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import { verifyZapierApiKey } from "@/lib/zapierAuth"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const db = await dbPromise

    // ── Try API key first ─────────────────────────────────────
    const apiKeyUser = await verifyZapierApiKey(request)
    if (apiKeyUser) {
      const profile = await db.collection("profiles").findOne({
        user_id: apiKeyUser.userId,
      })

      return NextResponse.json({
        id: apiKeyUser.userId,
        email: apiKeyUser.email,
        name: profile?.full_name || profile?.first_name || apiKeyUser.email,
        auth_type: "api_key",
      })
    }

    // ── Fallback: JWT token (OAuth flow) ──────────────────────
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.type !== "zapier_access") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await db.collection("users").findOne({ _id: decoded.userId })
    const profile = await db.collection("profiles").findOne({ user_id: decoded.userId })

    return NextResponse.json({
      id: decoded.userId,
      email: user?.email,
      name: profile?.full_name || profile?.first_name || user?.email,
      auth_type: "oauth",
    })

  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}