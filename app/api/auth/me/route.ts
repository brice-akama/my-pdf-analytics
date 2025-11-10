// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { dbPromise } from "../../lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    console.log("📍 /api/auth/me called");

    // ✅ FIXED: Get token from HTTP-only cookie instead of Authorization header
    const token = req.cookies.get("token")?.value;

    if (!token) {
      console.error("❌ No token in cookies");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: No token provided",
        },
        { status: 401 }
      );
    }

    console.log("🔑 Token found in cookie");

    // 2️⃣ Verify JWT
    let decoded;
    try {
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
      { 
        projection: { 
          passwordHash: 0 // Exclude password hash
        } 
      }
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
      provider: user.provider || "local",
      emailVerified: user.email_verified || false,
      profile: {
        firstName: profile?.first_name || user.profile?.firstName || "",
        lastName: profile?.last_name || user.profile?.lastName || "",
        fullName:
          profile?.full_name ||
          user.profile?.fullName ||
          `${profile?.first_name || user.profile?.firstName || ""} ${profile?.last_name || user.profile?.lastName || ""}`.trim(),
        companyName: profile?.company_name || user.profile?.companyName || "",
        avatarUrl: profile?.avatar_url || user.profile?.avatarUrl || "",
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