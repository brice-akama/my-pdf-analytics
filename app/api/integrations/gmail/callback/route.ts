import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // User ID

    if (!code || !state) {
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "gmail_auth_failed");
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
        redirect_uri: process.env.GMAIL_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Gmail token exchange failed:", tokenData);
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "gmail_token_failed");
      return NextResponse.redirect(url);
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user's Gmail email
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    // Save to database
    const db = await dbPromise;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await db.collection("integrations").updateOne(
      { userId: state, provider: "gmail" },
      {
        $set: {
          userId: state,
          provider: "gmail",
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          metadata: {
            email: userInfo.email,
            scope: "gmail.send gmail.readonly",
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

    console.log("✅ Gmail connected for user:", state, "Email:", userInfo.email);

    const url = new URL("/dashboard", request.url);
    url.searchParams.set("integration", "gmail");
    url.searchParams.set("status", "connected");
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Gmail callback error:", error);
    const url = new URL("/dashboard", request.url);
    url.searchParams.set("error", "gmail_callback_failed");
    return NextResponse.redirect(url);
  }
}