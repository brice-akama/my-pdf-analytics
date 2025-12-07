import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { verifyUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // ✅ Verify user authentication
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await dbPromise;

    // ✅ Get all bulk sends for this user, sorted by most recent
    const bulkSends = await db
      .collection("bulk_sends")
      .find({ ownerId: user.id })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to 50 most recent
      .toArray();

    return NextResponse.json({
      success: true,
      bulkSends,
    });
  } catch (error) {
    console.error("❌ List bulk sends error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}