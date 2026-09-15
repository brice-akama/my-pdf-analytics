//app/api/integrations/slack/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "slack_auth_failed");
      return NextResponse.redirect(url);
    }

    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error("Slack token exchange failed:", tokenData);
      const url = new URL("/dashboard", request.url);
      url.searchParams.set("error", "slack_token_failed");
      return NextResponse.redirect(url);
    }

    // Try to auto-select a default channel so novice users
// get working notifications immediately, no extra step required
let defaultChannelId = null;
let defaultChannelName = null;

try {
  const channelsRes = await fetch(
    'https://slack.com/api/conversations.list?types=public_channel&limit=50',
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const channelsData = await channelsRes.json();

  if (channelsData.ok && channelsData.channels?.length > 0) {
    // Prefer general if it exists, otherwise just take the first channel
    const general = channelsData.channels.find((c: any) => c.name === 'general');
    const chosen = general || channelsData.channels[0];
    defaultChannelId = chosen.id;
    defaultChannelName = chosen.name;
  }
} catch {
  // If this fails, channelId stays null — user falls back to manual picker
}

    const db = await dbPromise;
    await db.collection("integrations").updateOne(
      { userId: state, provider: "slack" },
      {
        $set: {
          userId: state,
          provider: "slack",
          accessToken: tokenData.access_token,
          metadata: {
            teamId: tokenData.team.id,
            teamName: tokenData.team.name,
            botUserId: tokenData.bot_user_id,
            scope: tokenData.scope,
            channelId: defaultChannelId,
            channelName: defaultChannelName,
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

    console.log("✅ Slack connected for user:", state);

    const url = new URL("/dashboard", request.url);
    url.searchParams.set("integration", "slack");
    url.searchParams.set("status", "connected");
    
    return NextResponse.redirect(url);
    
  } catch (error) {
    console.error("Slack callback error:", error);
    const url = new URL("/dashboard", request.url);
    url.searchParams.set("error", "slack_callback_failed");
    return NextResponse.redirect(url);
  }
}