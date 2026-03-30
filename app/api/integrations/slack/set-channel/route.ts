// app/api/integrations/slack/set-channel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../../lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        error: "Unauthorized",
        debug: "verifyUserFromRequest returned null"
      }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, channelName } = body;

    if (!channelId) {
      return NextResponse.json({ 
        error: "Channel ID required",
        debug: "channelId was empty"
      }, { status: 400 });
    }

    const db = await dbPromise;
    
    // Check if integration exists first
    const existing = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "slack",
    });

    if (!existing) {
      return NextResponse.json({ 
        error: "Slack not connected",
        debug: `No integration found for userId: ${user.id}`
      }, { status: 404 });
    }

    const result = await db.collection("integrations").updateOne(
      { userId: user.id, provider: "slack" },
      {
        $set: {
          "metadata.channelId": channelId,
          "metadata.channelName": channelName,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ 
      success: true,
      debug: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        userId: user.id,
        channelId,
        channelName,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to set channel",
      debug: error.message
    }, { status: 500 });
  }
}