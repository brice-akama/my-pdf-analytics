import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { verifyUserFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

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

    // Get bulk send record
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

    // Get all signature requests for this batch
    const signatureRequests = await db
      .collection("signature_requests")
      .find({ bulkSendBatchId: batchId })
      .sort({ "recipient.name": 1 })
      .toArray();

    // Get document info
    const documentIds = [
      ...new Set(signatureRequests.map((sr) => sr.documentId)),
    ];
    const documents = await db
      .collection("documents")
      .find({
        _id: { $in: documentIds.map((id) => new ObjectId(id)) },
      })
      .toArray();

    // Organize by groups if grouped bulk send
    const groupedData: Record<string, any[]> = {};
    signatureRequests.forEach((sr) => {
      const groupKey = sr.groupId || sr.recipient.email;
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = [];
      }
      groupedData[groupKey].push(sr);
    });

    // Build response with signed document URLs
    const recipients = signatureRequests.map((sr) => {
      const doc = documents.find((d) => d._id.toString() === sr.documentId);
      return {
        name: sr.recipient.name,
        email: sr.recipient.email,
        status: sr.status,
        signedAt: sr.signedAt,
        viewedAt: sr.viewedAt,
        uniqueId: sr.uniqueId,
        groupId: sr.groupId,
        isGroupSigning: sr.isGroupSigning,
        documentId: sr.documentId,
        signedPdfUrl: doc?.signedPdfUrl || null,
        hasSignedCopy: !!doc?.signedPdfUrl,
      };
    });

    return NextResponse.json({
      success: true,
      bulkSend: {
        ...bulkSend,
        recipients,
        groups: groupedData,
        documents,
      },
    });
  } catch (error) {
    console.error("Error fetching batch details:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}