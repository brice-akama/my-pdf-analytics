import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "@/app/api/lib/mongodb"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.type !== "zapier_access") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await dbPromise
    const user = await db.collection("users").findOne({ _id: decoded.userId })
    const profile = await db.collection("profiles").findOne({ user_id: decoded.userId })

    return NextResponse.json({
      id: decoded.userId,
      email: user?.email,
      name: profile?.name || user?.email,
    })

  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}