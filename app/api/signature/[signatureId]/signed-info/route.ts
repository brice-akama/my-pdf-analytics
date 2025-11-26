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

    // Get signature request
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

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

    // Check if fully signed
    if (!document.signedPdfUrl) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Document signing is not yet complete. Please check back later." 
        },
        { status: 400 }
      );
    }

    // Get all signers
    const allRequests = await db.collection("signature_requests")
      .find({ documentId: signatureRequest.documentId })
      .toArray();

    const signers = allRequests
      .filter(r => r.status === 'signed')
      .map(r => ({
        name: r.recipient.name,
        email: r.recipient.email,
        signedAt: r.signedAt,
      }));

    return NextResponse.json({
      success: true,
      document: {
        filename: document.filename,
        numPages: document.numPages,
      },
      completedAt: document.completedAt,
      signers,
    });
  } catch (error) {
    console.error('❌ Error fetching signed info:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}