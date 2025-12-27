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
//   Only block if PDF was already generated (true completion)
if (recipient.status === 'completed' && recipient.signedPdfUrl) {
  return NextResponse.json(
    { 
      success: true, // Changed to true since it's already done
      message: "Envelope already completed",
      signedPdfUrl: recipient.signedPdfUrl,
      downloadLink: `/envelope/${uniqueId}/download`
    },
    { status: 200 } // Changed to 200, not an error
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
    // Generate ONE signed PDF package for the ENTIRE envelope
console.log('📄 Generating signed envelope PDF package...');

// ⭐ Generate a single PDF containing ALL documents
const signedEnvelopePdfUrl = await generateEnvelopeSignedPDF(
  envelope.envelopeId,    // ✅ Pass envelope ID
  signedDocuments,        // ✅ Pass ALL signed documents
  recipient               // ✅ Pass recipient
);

console.log('✅ Signed envelope PDF generated:', signedEnvelopePdfUrl);
    // Check if all recipients completed
    // ⭐ Store the signed PDF URL in the envelope record
await db.collection("envelopes").updateOne(
  { envelopeId: envelope.envelopeId, "recipients.uniqueId": uniqueId },
  {
    $set: {
      "recipients.$.signedPdfUrl": signedEnvelopePdfUrl, // Store the signed PDF
    }
  }
);

//   ADD THIS: Fetch the updated envelope to check completion status
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
  signedPdfUrl: signedEnvelopePdfUrl, //   Return single URL
  downloadLink: `/envelope/${uniqueId}/download`, //   Add download link
});

  } catch (error) {
    console.error("❌ Error signing envelope:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}