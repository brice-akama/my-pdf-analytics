// app/api/signature/create/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const { documentId, recipients, signatureFields, message, dueDate } = await request.json();
    
    const db = await dbPromise;

    // Verify document exists
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // Create signature requests for each recipient
    const signatureRequests = [];
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const signatureRequest = {
        uniqueId,
        documentId: documentId,
        recipient: {
          name: recipient.name,
          email: recipient.email,
          role: recipient.role || '',
        },
        recipientIndex: i,
        signatureFields: signatureFields.filter(f => f.recipientIndex === i),
        message: message || '',
        dueDate: dueDate || null,
        status: 'pending',
        createdAt: new Date(),
        signedAt: null,
        completedAt: null,
        signedFields: null,
      };

      const result = await db.collection("signature_requests").insertOne(signatureRequest);
      
      signatureRequests.push({
        id: result.insertedId,
        uniqueId,
        recipient: recipient.name,
        email: recipient.email,
        link: `${request.nextUrl.origin}/sign/${uniqueId}`,
        status: 'pending',
      });
    }

    // Update document status
    await db.collection("documents").updateOne(
      { _id: new ObjectId(documentId) },
      {
        $set: {
          status: 'pending_signature',
          sentForSignature: true,
          sentAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      signatureRequests,
    });
  } catch (error) {
    console.error("Error creating signature requests:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}