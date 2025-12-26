import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;
    const db = await dbPromise;

    // Find envelope by recipient uniqueId
    const envelope = await db.collection("envelopes").findOne({
      "recipients.uniqueId": uniqueId,
    });

    if (!envelope) {
      return NextResponse.json(
        { success: false, message: "Envelope not found" },
        { status: 404 }
      );
    }

    // Find this specific recipient
    const recipient = envelope.recipients.find((r: any) => r.uniqueId === uniqueId);

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: "Recipient not found" },
        { status: 404 }
      );
    }

    // Check expiration
    if (envelope.expiresAt) {
      const expirationDate = new Date(envelope.expiresAt);
      const now = new Date();
      
      if (now > expirationDate) {
        return NextResponse.json(
          { 
            success: false, 
            message: `This envelope expired on ${expirationDate.toLocaleDateString()}` 
          },
          { status: 403 }
        );
      }
    }

    // Track view
    if (recipient.status === 'pending') {
      await db.collection("envelopes").updateOne(
        { envelopeId: envelope.envelopeId, "recipients.uniqueId": uniqueId },
        {
          $set: {
            "recipients.$.status": "viewed",
            "recipients.$.viewedAt": new Date(),
          }
        }
      );
    }

    // Get all documents
    const documents = await db.collection("documents").find({
      _id: { $in: envelope.documents.map((d: any) => new ObjectId(d.documentId)) }
    }).toArray();

    return NextResponse.json({
      success: true,
      envelope: {
        envelopeId: envelope.envelopeId,
        documents: envelope.documents.map((envDoc: any) => {
          const fullDoc = documents.find(d => d._id.toString() === envDoc.documentId.toString());
          return {
            ...envDoc,
            cloudinaryPdfUrl: fullDoc?.cloudinaryPdfUrl,
          };
        }),
        recipient: recipient,
        signatureFields: envelope.signatureFields.filter((f: any) => 
          f.recipientIndex === recipient.recipientIndex
        ),
        message: envelope.message,
        dueDate: envelope.dueDate,
      }
    });

  } catch (error) {
    console.error("❌ Error fetching envelope:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}