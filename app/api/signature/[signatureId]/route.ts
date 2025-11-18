 // app/api/signature/[signatureId]/route.ts
// app/api/signature/[signatureId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    
    console.log('🔍 Looking for signature request with uniqueId:', signatureId);
    
    const db = await dbPromise;

    // Check if collection exists and has documents
    const count = await db.collection("signature_requests").countDocuments();
    console.log('📊 Total signature_requests in DB:', count);

    // Try to find any document to see the structure
    const anyDoc = await db.collection("signature_requests").findOne({});
    console.log('📄 Sample document structure:', anyDoc);

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    console.log('🔍 Find result:', signatureRequest ? 'Found' : 'NOT FOUND');

    if (!signatureRequest) {
      // List all uniqueIds to help debug
      const allRequests = await db.collection("signature_requests")
        .find({})
        .project({ uniqueId: 1 })
        .toArray();
      console.log('📋 All uniqueIds in DB:', allRequests.map(r => r.uniqueId));
      
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    if (signatureRequest.status === "signed") {
      return NextResponse.json(
        { success: false, message: "Document already signed" },
        { status: 400 }
      );
    }

    if (
      signatureRequest.dueDate &&
      new Date(signatureRequest.dueDate) < new Date()
    ) {
      return NextResponse.json(
        { success: false, message: "Signature request expired" },
        { status: 400 }
      );
    }

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      signatureRequest: {
        ...signatureRequest,
        document,
      },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}