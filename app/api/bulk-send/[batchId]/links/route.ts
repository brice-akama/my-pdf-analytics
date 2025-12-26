// my-pdf-analytics/app/api/bulk-send/[batchId]/links/route.ts

import { NextRequest, NextResponse } from "next/server";
 
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await dbPromise;

    // ✅ Verify batch belongs to user
    const bulkSend = await db.collection("bulk_sends").findOne({
      batchId,
      ownerId: user.id,
    });

    if (!bulkSend) {
      return NextResponse.json(
        { success: false, message: "Batch not found" },
        { status: 404 }
      );
    }

    // ✅ Get all signature requests for this batch
    const signatureRequests = await db
      .collection("signature_requests")
      .find({ bulkSendBatchId: batchId })
      .toArray();

    // ✅ Format links for frontend
    const links = signatureRequests.map((req) => ({
      recipient: req.recipient.name,
      email: req.recipient.email,
      link: `${request.nextUrl.origin}/sign/${req.uniqueId}`,
      status: req.status === "completed" ? "Sent" : req.status === "pending" ? "Sent" : "Failed",
    }));

    return NextResponse.json({
      success: true,
      links,
    });
  } catch (error) {
    console.error("Error fetching bulk send links:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}