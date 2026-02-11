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
    
    // Delete from database
    await db.collection("integrations").deleteOne({
      userId: user.id,
      provider: "hubspot",
    });

    console.log("✅ HubSpot disconnected for user:", user.id);

    return NextResponse.json({
      success: true,
      message: "HubSpot disconnected successfully",
    });
  } catch (error) {
    console.error("HubSpot disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}