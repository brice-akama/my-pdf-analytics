import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploaderEmail = searchParams.get('email');

    if (!uploaderEmail) {
      return NextResponse.json(
        { success: false, message: "Email required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Get all documents uploaded by this user
    const documents = await db.collection("documents")
      .find({ 
        uploaderEmail: uploaderEmail,
        status: "completed" // Only completed/signed documents
      })
      .sort({ uploadedAt: -1 })
      .toArray();

    // Get signature requests for each document
    const documentsWithStatus = await Promise.all(
      documents.map(async (doc) => {
        const signatureRequests = await db.collection("signature_requests")
          .find({ documentId: doc._id.toString() })
          .toArray();

        return {
          _id: doc._id.toString(),
          filename: doc.filename,
          uploadedAt: doc.uploadedAt,
          signedPdfUrl: doc.signedPdfUrl,
          completedAt: doc.completedAt,
          numPages: doc.numPages,
          signers: signatureRequests.map((req: any) => ({
            name: req.recipient.name,
            email: req.recipient.email,
            status: req.status,
            signedAt: req.signedAt
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      documents: documentsWithStatus
    });

  } catch (error) {
    console.error('❌ Error fetching user documents:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}