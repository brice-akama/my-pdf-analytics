// app/api/signature/[signatureId]/certificate/download/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { dbPromise } from "@/app/api/lib/mongodb";
import { generateCertificatePDFBuffer } from "@/lib/pdfGenerator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    // ── Fetch signature request ──────────────────────────────────────────────
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    if (signatureRequest.status !== "signed") {
      return NextResponse.json(
        { success: false, message: "Document has not been signed yet" },
        { status: 400 }
      );
    }

    // ── Fetch document ───────────────────────────────────────────────────────
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // ── Generate certificate PDF buffer ──────────────────────────────────────
    const certBuffer = await generateCertificatePDFBuffer(signatureRequest, document);

    const filename = `Certificate_${(document.originalFilename || document.filename || 'Document')
      .replace('.pdf', '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')}_${signatureRequest.recipient?.name?.replace(/\s+/g, '_') || signatureId}.pdf`;

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
    console.error("❌ Certificate download error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}