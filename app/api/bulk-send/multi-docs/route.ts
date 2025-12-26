// my-pdf-analytics/app/api/bulk-send/multi-docs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { verifyUserFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { documentIds, recipient, message } = body;

    // Validate input
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Document IDs are required" },
        { status: 400 }
      );
    }

    if (!recipient?.email || !recipient?.name) {
      return NextResponse.json(
        { success: false, message: "Recipient email and name are required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;
    const batchId = uuidv4();
    const groupId = uuidv4();

    // Verify all documents exist and belong to user
    const documents = await db
      .collection("documents")
      .find({
        _id: { $in: documentIds.map((id: string) => new ObjectId(id)) },
        ownerId: user.id,
      })
      .toArray();

    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        { success: false, message: "Some documents not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create signature requests for each document
    const signatureRequests = documents.map((doc) => ({
      documentId: doc._id.toString(),
      recipient: {
        name: recipient.name,
        email: recipient.email,
      },
      uniqueId: uuidv4(),
      status: "pending",
      createdAt: new Date(),
      ownerId: user.id,
      bulkSendBatchId: batchId,
      groupId: groupId,
      isGroupSigning: true,
      message: message || "",
    }));

    await db.collection("signature_requests").insertMany(signatureRequests);

    // Create bulk send record
    await db.collection("bulk_sends").insertOne({
      batchId,
      ownerId: user.id,
      type: "multiple_documents_one_recipient",
      recipient: {
        name: recipient.name,
        email: recipient.email,
      },
      documentIds: documentIds,
      documentCount: documentIds.length,
      status: "pending",
      createdAt: new Date(),
      message: message || "",
    });

    return NextResponse.json({
      success: true,
      batchId,
      groupId,
      signatureRequests: signatureRequests.map((sr) => ({
        uniqueId: sr.uniqueId,
        documentId: sr.documentId,
      })),
    });
  } catch (error) {
    console.error("Error creating multi-doc bulk send:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}