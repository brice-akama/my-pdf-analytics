import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../../lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "gmail",
      isActive: true,
    });

    if (!integration) {
      return NextResponse.json({
        connected: false,
      });
    }

    return NextResponse.json({
      connected: true,
      email: integration.metadata?.email || "Unknown",
      connectedAt: integration.createdAt,
    });
  } catch (error) {
    console.error("Gmail status error:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}