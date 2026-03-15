// app/api/envelope/[uniqueId]/certificate/download/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { generateCertificatePDFBuffer } from "@/lib/pdfGenerator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;
    const db = await dbPromise;

    // ── Fetch envelope ───────────────────────────────────────────────────────
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

    if (!recipient || recipient.status !== "completed") {
      return NextResponse.json(
        { success: false, message: "Envelope has not been signed yet" },
        { status: 400 }
      );
    }

    // ── Build a synthetic signatureRequest shape that generateCertificatePDFBuffer expects ──
    // It needs: uniqueId, recipient, signedAt, status, ipAddress, device, browser, location
    const syntheticRequest = {
      uniqueId:        uniqueId,
      documentId:      envelope.envelopeId,
      recipient: {
        name:  recipient.name,
        email: recipient.email,
      },
      status:    "signed",
      signedAt:  recipient.completedAt || new Date(),
      ipAddress: recipient.ipAddress   || null,
      device:    recipient.device      || null,
      browser:   recipient.browser     || null,
      location:  recipient.location    || null,
    };

    // ── Build a synthetic document shape ─────────────────────────────────────
    const syntheticDocument = {
      originalFilename: envelope.title
        || envelope.documents?.map((d: any) => d.filename).join(', ')
        || 'Envelope',
      filename:  envelope.title || 'Envelope',
      numPages:  envelope.documents?.reduce((sum: number, d: any) => sum + (d.numPages || 1), 0) || 1,
    };

    // ── Generate certificate PDF ──────────────────────────────────────────────
    const certBuffer = await generateCertificatePDFBuffer(syntheticRequest, syntheticDocument);

    const safeTitle = (envelope.title || 'Envelope')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const safeName = recipient.name?.replace(/\s+/g, '_') || uniqueId;
    const filename = `Certificate_${safeTitle}_${safeName}.pdf`;

     return new NextResponse(new Uint8Array(certBuffer), {
           status: 200,
           headers: {
             'Content-Type':        'application/pdf',
             'Content-Disposition': `attachment; filename="${filename}"`,
             'Content-Length':      certBuffer.length.toString(),
             'Cache-Control':       'no-store',
           },
         });

  } catch (error) {
    console.error("❌ Envelope certificate download error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}