// app/api/envelope/[uniqueId]/complete-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;

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

    // ── Guard: must be signed to view complete page ──────────────────────────
    if (recipient.status !== "completed") {
      return NextResponse.json(
        { success: false, message: "This envelope has not been signed yet." },
        { status: 403 }
      );
    }

    // ── Sanitise recipients for response (strip internal uniqueIds) ──────────
    const safeRecipients = envelope.recipients.map((r: any) => ({
      name:        r.name,
      email:       r.email,
      status:      r.status,
      completedAt: r.completedAt   || null,
      ipAddress:   r.ipAddress     || null,
      device:      r.device        || null,
      browser:     r.browser       || null,
      location:    r.location      || null,
      // Include signed documents only for the requesting recipient
      signedDocuments: r.uniqueId === uniqueId ? (r.signedDocuments || []) : undefined,
    }));

    return NextResponse.json({
      success: true,
      envelope: {
        envelopeId:      envelope.envelopeId,
        title:           envelope.title           || null,
        status:          envelope.status,
        completedAt:     envelope.completedAt     || null,
        documents:       (envelope.documents || []).map((d: any) => ({
          documentId: d.documentId,
          filename:   d.filename,
          numPages:   d.numPages || null,
        })),
        recipients:      safeRecipients,
        signatureFields: envelope.signatureFields || [],
      },
      // Current requesting recipient (full data including signedDocuments)
      recipient: {
        name:            recipient.name,
        email:           recipient.email,
        status:          recipient.status,
        completedAt:     recipient.completedAt     || null,
        signedDocuments: recipient.signedDocuments || [],
        signedPdfUrl:    recipient.signedPdfUrl    || null,
      },
    });

  } catch (error) {
    console.error("❌ Error fetching envelope complete info:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}