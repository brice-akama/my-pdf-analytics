
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      // ✅ FIXED: Use absolute URL
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "missing_code");
      return NextResponse.redirect(url);
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_DRIVE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData);
      // ✅ FIXED: Use absolute URL
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "token_failed");
      return NextResponse.redirect(url);
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user's Google email
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    // Save to database
    const db = await dbPromise;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await db.collection("integrations").updateOne(
      { userId: state, provider: "google_drive" },
      {
        $set: {
          userId: state,
          provider: "google_drive",
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          metadata: {
            email: userInfo.email,
            scope: "drive.readonly",
          },
          isActive: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log("✅ Google Drive connected for user:", state);

    // ✅ FIXED: Use absolute URL
    const url = new URL("/dashboard", request.url);
    url.searchParams.set("integration", "google_drive");
    url.searchParams.set("status", "connected");
    return NextResponse.redirect(url);
    
  } catch (error) {
    console.error("Google Drive callback error:", error);
    // ✅ FIXED: Use absolute URL
    const url = new URL("/dashboard", request.url);
    url.searchParams.set("error", "callback_failed");
    return NextResponse.redirect(url);
  }
}