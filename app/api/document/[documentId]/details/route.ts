import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await params;
    const db = await dbPromise;

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(documentId),
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // Get all signature requests for this document
    const signatureRequests = await db.collection("signature_requests")
      .find({ documentId: documentId })
      .toArray();

    return NextResponse.json({
      success: true,
      document: {
        id: document._id.toString(),
        filename: document.originalFilename || document.filename,
        numPages: document.numPages,
        status: document.status,
        signedPdfUrl: document.signedPdfUrl,
        cloudinaryPdfUrl: document.cloudinaryPdfUrl,
        totalRecipients: signatureRequests.length,
        signedCount: signatureRequests.filter(r => r.status === 'signed').length,
        createdAt: document.createdAt,
      },
      signers: signatureRequests.map(r => ({
        name: r.recipient.name,
        email: r.recipient.email,
        status: r.status,
        uniqueId: r.uniqueId,
        viewedAt: r.viewedAt,
        signedAt: r.signedAt,
      })),
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}