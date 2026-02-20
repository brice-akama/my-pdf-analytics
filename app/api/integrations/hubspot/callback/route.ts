import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";

// If we already have this integration saved, just redirect — don't reprocess
const existing = await db.collection("integrations").findOne({
  userId: state,
  provider: "hubspot",
  isActive: true,
});
if (existing) {
  const url = new URL("/dashboard", request.url);
  url.searchParams.set("integration", "hubspot");
  url.searchParams.set("status", "connected");
  return NextResponse.redirect(url);
}


 

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // User ID

    if (!code || !state) {
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "hubspot_auth_failed");
      return NextResponse.redirect(url);
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("HubSpot token error:", tokenData);
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "hubspot_token_failed");
      return NextResponse.redirect(url);
    }

    // Get account info
    const accountResponse = await fetch("https://api.hubapi.com/account-info/v3/details", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const accountData = await accountResponse.json();

    // Save to database
    const db = await dbPromise;
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await db.collection("integrations").updateOne(
      { userId: state, provider: "hubspot" },
      {
        $set: {
          userId: state,
          provider: "hubspot",
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt,
          metadata: {
            portalId: accountData.portalId,
            timeZone: accountData.timeZone,
            accountType: accountData.accountType,
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

    console.log("✅ HubSpot connected for user:", state);

    const url = new URL("/dashboard", request.url);
url.searchParams.set("integration", "hubspot");
url.searchParams.set("status", "connected");

const response = NextResponse.redirect(url);
// Forward the auth cookie explicitly so the redirect stays authenticated
const authCookie = request.cookies.get('auth_token') || request.cookies.get('token');
if (authCookie) {
  response.cookies.set(authCookie.name, authCookie.value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}
return response;
  } catch (error) {
    console.error("HubSpot callback error:", error);
    const url = new URL("/dashboard", request.url);
    url.searchParams.set("error", "hubspot_callback_failed");
    return NextResponse.redirect(url);
  }
}