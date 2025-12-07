import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { verifyUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    // ✅ Verify user authentication
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await dbPromise;

    // ✅ Get bulk send record
    const bulkSend = await db.collection("bulk_sends").findOne({
      batchId,
      ownerId: user.id,
    });

    if (!bulkSend) {
      return NextResponse.json(
        { success: false, message: "Bulk send not found" },
        { status: 404 }
      );
    }

    // ✅ Return status
    return NextResponse.json({
      success: true,
      status: {
        batchId: bulkSend.batchId,
        total: bulkSend.totalRecipients,
        sent: bulkSend.sentCount,
        failed: bulkSend.failedCount,
        pending: bulkSend.pendingCount,
        status: bulkSend.status,
        failedRecipients: bulkSend.failedRecipients || [],
        createdAt: bulkSend.createdAt,
        completedAt: bulkSend.completedAt,
      },
    });
  } catch (error) {
    console.error("❌ Status check error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}