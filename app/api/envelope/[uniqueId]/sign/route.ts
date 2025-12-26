// my-pdf-analytics/app/api/envelope/[uniqueId]/sign/route.ts


import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import { generateEnvelopeSignedPDF } from "@/lib/pdfGenerator";
import { sendEnvelopeCompletedEmail } from "@/lib/emailService";
import { sendEnvelopeProgressEmail } from "@/lib/emailService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;
    const { signedDocuments } = await request.json(); // Array of { documentId, signedFields }

    const db = await dbPromise;

    const envelope = await db.collection("envelopes").findOne({
      "recipients.uniqueId": uniqueId,
    });

    if (!envelope) {
      return NextResponse.json(
        { success: false, message: "Envelope not found" },
        { status: 404 }
      );
    }

    const recipient = envelope.recipients.find((r: any) => r.uniqueId === uniqueId);

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: "Recipient not found" },
        { status: 404 }
      );
    }

    if (recipient.status === 'completed') {
      return NextResponse.json(
        { success: false, message: "Envelope already signed" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update recipient status
    await db.collection("envelopes").updateOne(
      { envelopeId: envelope.envelopeId, "recipients.uniqueId": uniqueId },
      {
        $set: {
          "recipients.$.status": "completed",
          "recipients.$.completedAt": now,
          "recipients.$.signedDocuments": signedDocuments,
        }
      }
    );

    // ⭐ ADD THIS: Send progress email if partially complete


const completedDocs = signedDocuments.length;
const totalDocs = envelope.documents.length;
const remainingDocs = envelope.documents
  .filter((d: any) => !signedDocuments.some((sd: any) => sd.documentId === d.documentId))
  .map((d: any) => d.filename);

if (remainingDocs.length > 0) {
  // Still have documents to sign - send progress email
  await sendEnvelopeProgressEmail({
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    completedCount: completedDocs,
    totalCount: totalDocs,
    remainingDocuments: remainingDocs,
    signingLink: `${process.env.NEXT_PUBLIC_BASE_URL}/envelope/${uniqueId}`,
  }).catch((err: any) => console.error('Failed to send progress email:', err));
}

    // Generate signed PDFs for all documents
    console.log(' Generating signed envelope PDF package...');
    const signedPdfUrls: string[] = [];
    for (const signedDoc of signedDocuments) {
      const pdfUrl = await generateEnvelopeSignedPDF(
        signedDoc.documentId,
        signedDoc.signedFields,
        recipient
      );
      
      signedPdfUrls.push(pdfUrl);
    }
    console.log('Signed PDFs generated:', signedPdfUrls);
    // Check if all recipients completed
    const updatedEnvelope = await db.collection("envelopes").findOne({
      envelopeId: envelope.envelopeId,
    });

    if (!updatedEnvelope) {
      return NextResponse.json(
        { success: false, message: "Envelope not found" },
        { status: 404 }
      );
    }

    const allCompleted = updatedEnvelope.recipients.every((r: any) => r.status === 'completed');

    if (allCompleted) {
      await db.collection("envelopes").updateOne(
        { envelopeId: envelope.envelopeId },
        {
          $set: {
            status: 'completed',
            completedAt: now,
          }
        }
      );

      // Send completion emails
      await sendEnvelopeCompletedEmail({
        ownerEmail: envelope.ownerEmail,
        recipients: envelope.recipients,
        documentCount: envelope.documents.length,
      }).catch(err => console.error('Failed to send completion email:', err));
    }

    return NextResponse.json({
      success: true,
      message: "Envelope signed successfully",
      signedPdfUrls: signedPdfUrls,
    });

  } catch (error) {
    console.error("❌ Error signing envelope:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}