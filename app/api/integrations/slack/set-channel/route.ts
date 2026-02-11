//app/api/integrations/slack/set-channel/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../../lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, channelName } = body;

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
    }

    // Update integration with selected channel
    const db = await dbPromise;
    await db.collection("integrations").updateOne(
      { userId: user.id, provider: "slack" },
      {
        $set: {
          "metadata.channelId": channelId,
          "metadata.channelName": channelName,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set Slack channel error:", error);
    return NextResponse.json({ error: "Failed to set channel" }, { status: 500 });
  }
}