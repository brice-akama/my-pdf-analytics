import { NextRequest } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // User ID

    if (!code || !state) {
      redirect("/dashboard?error=hubspot_auth_failed");
      return;
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
      redirect("/dashboard?error=hubspot_token_failed");
      return;
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
    redirect("/dashboard?integration=hubspot&status=connected");
  } catch (error) {
    console.error("HubSpot callback error:", error);
    redirect("/dashboard?error=hubspot_callback_failed");
  }
}