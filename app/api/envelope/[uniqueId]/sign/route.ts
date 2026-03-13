// my-pdf-analytics/app/api/envelope/[uniqueId]/sign/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { generateEnvelopeSignedPDF } from "@/lib/pdfGenerator";
import { sendEnvelopeCompletedEmail, sendEnvelopeProgressEmail } from "@/lib/emailService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;
    const { signedDocuments } = await request.json();

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

    // ── HARD BLOCK: already signed — never allow signing twice ───────────────
    if (recipient.status === "completed") {
      return NextResponse.json(
        {
          success: false,
          alreadySigned: true,
          message: "You have already signed this envelope. Each signing link can only be used once.",
          signedPdfUrl:  recipient.signedPdfUrl  || null,
          downloadLink:  `/envelope/${uniqueId}/download`,
        },
        { status: 409 } // 409 Conflict — intentional, not a server error
      );
    }

    const now = new Date();

    // ── Mark recipient as completed ──────────────────────────────────────────
    await db.collection("envelopes").updateOne(
      { envelopeId: envelope.envelopeId, "recipients.uniqueId": uniqueId },
      {
        $set: {
          "recipients.$.status":          "completed",
          "recipients.$.completedAt":     now,
          "recipients.$.signedDocuments": signedDocuments,
        },
      }
    );

    // ── Send progress email if some docs still unsigned ──────────────────────
    const remainingDocs = envelope.documents
      .filter((d: any) => !signedDocuments.some((sd: any) => sd.documentId === d.documentId))
      .map((d: any) => d.filename);

    if (remainingDocs.length > 0) {
      await sendEnvelopeProgressEmail({
        recipientName:      recipient.name,
        recipientEmail:     recipient.email,
        completedCount:     signedDocuments.length,
        totalCount:         envelope.documents.length,
        remainingDocuments: remainingDocs,
        signingLink:        `${process.env.NEXT_PUBLIC_BASE_URL}/envelope/${uniqueId}`,
      }).catch((err: any) => console.error("Failed to send progress email:", err));
    }

    // ── Generate signed PDF package ──────────────────────────────────────────
    console.log("📄 Generating signed envelope PDF package...");

    const signedEnvelopePdfUrl = await generateEnvelopeSignedPDF(
      envelope.envelopeId,
      signedDocuments,
      recipient
    );

    console.log("✅ Signed envelope PDF generated:", signedEnvelopePdfUrl);

    // ── Store signed PDF URL ─────────────────────────────────────────────────
    await db.collection("envelopes").updateOne(
      { envelopeId: envelope.envelopeId, "recipients.uniqueId": uniqueId },
      {
        $set: {
          "recipients.$.signedPdfUrl": signedEnvelopePdfUrl,
        },
      }
    );

    // ── Check if ALL recipients are now done ─────────────────────────────────
    const updatedEnvelope = await db.collection("envelopes").findOne({
      envelopeId: envelope.envelopeId,
    });

    if (!updatedEnvelope) {
      return NextResponse.json(
        { success: false, message: "Envelope not found after update" },
        { status: 404 }
      );
    }

    const allCompleted = updatedEnvelope.recipients.every(
      (r: any) => r.status === "completed"
    );

    if (allCompleted) {
      await db.collection("envelopes").updateOne(
        { envelopeId: envelope.envelopeId },
        {
          $set: {
            status:      "completed",
            completedAt: now,
          },
        }
      );

      await sendEnvelopeCompletedEmail({
        ownerEmail:    envelope.ownerEmail,
        recipients:    envelope.recipients,
        documentCount: envelope.documents.length,
      }).catch((err: any) => console.error("Failed to send completion email:", err));
    }

    return NextResponse.json({
      success:        true,
      message:        "Envelope signed successfully",
      signedPdfUrl:   signedEnvelopePdfUrl,
      downloadLink:   `/envelope/${uniqueId}/download`,
    });

  } catch (error) {
    console.error("❌ Error signing envelope:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}