//app/api/integrations/slack/channels/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../../lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Slack integration
    const db = await dbPromise;
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "slack",
      isActive: true,
    });

    if (!integration) {
      return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
    }

    // Fetch channels from Slack
    const channelsResponse = await fetch(
      "https://slack.com/api/conversations.list?types=public_channel,private_channel",
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    );

    const channelsData = await channelsResponse.json();

    if (!channelsData.ok) {
      console.error("Failed to fetch Slack channels:", channelsData.error);
      return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      channels: channelsData.channels.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        isPrivate: ch.is_private,
        isMember: ch.is_member,
      })),
    });
  } catch (error) {
    console.error("Slack channels error:", error);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}