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
    
    // Get integration to revoke token
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "gmail",
      isActive: true,
    });

    if (integration) {
      // Revoke Google token
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${integration.accessToken}`, {
          method: 'POST',
        });
        console.log("✅ Gmail token revoked");
      } catch (err) {
        console.error("Failed to revoke Gmail token:", err);
      }
    }

    // Delete from database
    await db.collection("integrations").deleteOne({
      userId: user.id,
      provider: "gmail",
    });

    console.log("✅ Gmail disconnected for user:", user.id);

    return NextResponse.json({
      success: true,
      message: "Gmail disconnected successfully",
    });
  } catch (error) {
    console.error("Gmail disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}