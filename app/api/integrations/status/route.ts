import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;
    const integrations = await db.collection("integrations")
      .find({ userId: user.email, isActive: true })
      .toArray();

    const status: Record<string, any> = {};
    
    integrations.forEach((integration) => {
      status[integration.provider] = {
        connected: true,
        email: integration.metadata?.email,
        connectedAt: integration.createdAt,
      };
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error("Integration status error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}