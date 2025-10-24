// app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { dbPromise } from "../../lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    console.log("📍 /api/auth/me called");

    // 1️⃣ Get Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ No token in Authorization header");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: No token provided",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 Token received");

    // 2️⃣ Verify JWT
    let decoded;
    try {
      // ✅ FIXED: expect 'userId', not 'id' — matches your signup/login tokens
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
      };
      console.log("✅ Token verified for user:", decoded.email);
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    if (!decoded?.userId) {
      console.error("❌ Token payload missing userId");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token payload",
        },
        { status: 401 }
      );
    }

    // 3️⃣ Connect to DB
    const db = await dbPromise;
    console.log("📦 DB connected");

    // 4️⃣ Fetch user data (exclude password)
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { passwordHash: 1, email: 1, provider: 1, profile: 1, created_at: 1 } }
    );

    if (!user) {
      console.error("❌ User not found in DB:", decoded.userId);
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    console.log("✅ User found:", user.email);

    // 5️⃣ Fetch associated profile (if exists)
    const profile = await db.collection("profiles").findOne({ user_id: decoded.userId });
    console.log("📝 Profile found:", profile ? "Yes" : "No");

    // 6️⃣ Combine data cleanly
    const userData = {
      id: decoded.userId,
      email: user.email,
      provider: user.provider,
      profile: {
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
        fullName:
          profile?.full_name ||
          `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
        companyName: profile?.company_name || "",
        avatarUrl: profile?.avatar_url || "",
        plan: profile?.plan || "Free Plan",
        createdAt: profile?.created_at || user?.created_at || null,
      },
    };

    console.log("✅ Returning user data");
    return NextResponse.json({ success: true, user: userData }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error in /api/auth/me:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}