import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { verifyUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Only allow admin to run this
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;

    // Create indexes for bulk_sends collection
    await db.collection("bulk_sends").createIndex({ batchId: 1 }, { unique: true });
    await db.collection("bulk_sends").createIndex({ ownerId: 1, createdAt: -1 });
    await db.collection("bulk_sends").createIndex({ status: 1 });

    // Create indexes for signature_requests collection
    await db.collection("signature_requests").createIndex({ bulkSendBatchId: 1 });
    await db.collection("signature_requests").createIndex({ isBulkSend: 1, ownerId: 1 });

    console.log("✅ Bulk send indexes created successfully");

    return NextResponse.json({
      success: true,
      message: "Bulk send indexes created successfully",
    });
  } catch (error) {
    console.error("❌ Index creation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create indexes" },
      { status: 500 }
    );
  }
}