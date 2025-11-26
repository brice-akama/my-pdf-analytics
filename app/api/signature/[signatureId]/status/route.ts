import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    
    const db = await dbPromise;

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // Get all requests for this document
    const allRequests = await db.collection("signature_requests")
      .find({ documentId: signatureRequest.documentId })
      .toArray();

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    const totalRecipients = allRequests.length;
    const signedCount = allRequests.filter(r => r.status === 'signed').length;
    const pendingCount = totalRecipients - signedCount;

    return NextResponse.json({
      success: true,
      status: {
        documentName: document?.filename,
        totalRecipients,
        signedCount,
        pendingCount,
        isComplete: signedCount === totalRecipients,
        signedPdfUrl: document?.signedPdfUrl || null,
        recipients: allRequests.map(r => ({
          name: r.recipient.name,
          email: r.recipient.email,
          status: r.status,
          signedAt: r.signedAt,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching status:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}