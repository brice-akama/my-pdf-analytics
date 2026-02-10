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
    
    // ✅ Mark integration as inactive
    await db.collection("integrations").updateOne(
      { userId: user.email, provider: "google_drive" },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: "Google Drive disconnected" 
    });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}