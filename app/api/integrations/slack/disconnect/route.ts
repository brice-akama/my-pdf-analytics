import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../../lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;
    
    // Get integration first to revoke token
    const integration = await db.collection("integrations").findOne({
      userId: user.id, // ⭐ FIXED: Use user.id
      provider: "slack",
      isActive: true,
    });

    if (integration) {
      // Optionally revoke the token with Slack API
      try {
        await fetch("https://slack.com/api/auth.revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            token: integration.accessToken,
          }),
        });
        console.log("✅ Slack token revoked");
      } catch (err) {
        console.error("Failed to revoke Slack token:", err);
        // Continue anyway
      }
    }

    // Delete from database
    await db.collection("integrations").deleteOne({
      userId: user.id,
      provider: "slack",
    });

    console.log("✅ Slack disconnected for user:", user.id);

    return NextResponse.json({
      success: true,
      message: "Slack disconnected successfully",
    });
  } catch (error) {
    console.error("Slack disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}