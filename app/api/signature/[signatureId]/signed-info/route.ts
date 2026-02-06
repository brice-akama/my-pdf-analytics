// app/api/signature/[signatureId]/signed-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    console.log('🔍 Looking for signatureId:', signatureId);
    
    const db = await dbPromise;

    // Get signature request
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    console.log('📄 Found signature request:', signatureRequest ? 'YES' : 'NO');

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // Get document
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // ✅ Get all signature requests for this document
    const allRequests = await db.collection("signature_requests")
      .find({ documentId: signatureRequest.documentId })
      .sort({ recipientIndex: 1 })
      .toArray();

    const totalRecipients = allRequests.length;
    const signedCount = allRequests.filter(r => r.status === 'signed').length;
    const allSigned = signedCount === totalRecipients;

    // ✅ Build detailed signer information
    const signers = allRequests.map(req => ({
      name: req.recipient.name,
      email: req.recipient.email,
      status: req.status, // 'pending', 'signed', 'viewed', etc.
      signedAt: req.signedAt || null,
      signedFields: req.signedFields || null, // ✅ Include their signature data
      ipAddress: req.ipAddress || null,
      device: req.device || null,
      browser: req.browser || null,
      location: req.location || null,
    }));

    // ✅ Determine what to show based on signing status
    const response: any = {
      success: true,
      document: {
        filename: document.originalFilename || document.filename,
        numPages: document.numPages,
      },
      progress: {
        signed: signedCount,
        total: totalRecipients,
        percentage: Math.round((signedCount / totalRecipients) * 100),
        allSigned,
      },
      signers,
      // ✅ Show the current signer's info
      currentSigner: {
        name: signatureRequest.recipient.name,
        email: signatureRequest.recipient.email,
        status: signatureRequest.status,
        signedAt: signatureRequest.signedAt,
      },
    };

    // ✅ If ALL signed, include the final PDF
    if (allSigned && document.signedPdfUrl) {
      response.signedPdfUrl = document.signedPdfUrl;
      response.completedAt = document.completedAt;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching signed info:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}