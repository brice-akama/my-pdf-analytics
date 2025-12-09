// app/api/signature/[signatureId]/request/route.ts
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

    // Get signature request with all fields
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // Get document details
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

  
// Get all shared signatures if in shared mode
let allSharedSignatures: Record<string, any> = {};
if (signatureRequest.viewMode === 'shared') {
  // Get all signature requests for this document
  const allRequests = await db.collection("signature_requests")
    .find({ documentId: signatureRequest.documentId })
    .toArray();
  
  // Build a map of all signatures
  allRequests.forEach(req => {
    if (req.status === 'signed' && req.signedFields) {
      allSharedSignatures[req.recipientIndex] = {
        recipientName: req.recipient.name,
        recipientEmail: req.recipient.email,
        signedFields: req.signedFields,
        signedAt: req.signedAt,
      };
    }
  });
  
  console.log('📊 Shared mode: Found', Object.keys(allSharedSignatures).length, 'signed fields');
}

return NextResponse.json({
  success: true,
  signatureRequest: {
    uniqueId: signatureRequest.uniqueId,
    documentId: signatureRequest.documentId,
    status: signatureRequest.status,
    recipient: signatureRequest.recipient,
    recipientIndex: signatureRequest.recipientIndex,
    signatureFields: signatureRequest.signatureFields || [],
    viewMode: signatureRequest.viewMode || 'isolated', // ⭐ ADD THIS
    sharedSignatures: allSharedSignatures, // ⭐ ADD THIS
    expiresAt: signatureRequest.expiresAt, // ⭐ ADD THIS
    cancelledAt: signatureRequest.cancelledAt, // ⭐ ADD THIS
    declinedAt: signatureRequest.declinedAt, // ⭐ ADD THIS
    declineReason: signatureRequest.declineReason, // ⭐ ADD THIS
    cancellationReason: signatureRequest.cancellationReason, // ⭐ ADD THIS
    signedAt: signatureRequest.signedAt,
    signedFields: signatureRequest.signedFields || [],
    ipAddress: signatureRequest.ipAddress || null,
    message: signatureRequest.message,
    dueDate: signatureRequest.dueDate,
    createdAt: signatureRequest.createdAt,
    document: {
      _id: document._id.toString(),
      filename: document.originalFilename || document.filename,
      numPages: document.numPages || 1,
      cloudinaryPdfUrl: document.cloudinaryPdfUrl,
    },
  },
});
  } catch (error) {
    console.error("❌ Error fetching signature request:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}