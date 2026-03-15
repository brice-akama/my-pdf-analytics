// app/api/signature/[signatureId]/signed-info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    console.log('🔍 Looking for signatureId:', signatureId);

    const db = await dbPromise;

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    console.log('📄 Found signature request:', signatureRequest ? 'YES' : 'NO');

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
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

    // ── All requests for this document (for progress + certificate) ──────────
    const allRequests = await db.collection("signature_requests")
      .find({ documentId: signatureRequest.documentId })
      .sort({ recipientIndex: 1 })
      .toArray();

    const totalRecipients = allRequests.length;
    const signedCount     = allRequests.filter(r => r.status === 'signed').length;
    const allSigned       = signedCount === totalRecipients;

    // ── Build signatures map: { fieldId: { data, type } } ────────────────────
    // Same shape as CC page — used by the signed-page overlay renderer
    const signatures: Record<string, { data: string; type: string }> = {};
    for (const req of allRequests) {
      if (req.status !== 'signed' || !req.signedFields) continue;
      for (const sf of req.signedFields) {
        const data = sf.signatureData || sf.dateValue || sf.textValue || '';
        if (data) signatures[String(sf.id)] = { type: sf.type, data };
      }
    }

    // ── Build detailed signer information ────────────────────────────────────
    // FIX: include audit fields (ipAddress, device, browser, location)
    // so the certificate React page matches the PDF certificate exactly
    const signers = allRequests.map(req => ({
      name:        req.recipient.name,
      email:       req.recipient.email,
      status:      req.status,
      signedAt:    req.signedAt    || null,
      signedFields: req.signedFields || null,
      // ── Audit trail fields ────────────────────────────────────────────────
      ipAddress:   req.ipAddress   || null,
      device:      req.device      || null,
      browser:     req.browser     || null,
      location:    req.location    || null,
    }));

    const response: any = {
      success: true,
      document: {
        filename: document.originalFilename || document.filename,
        numPages: document.numPages,
      },
      progress: {
        signed:     signedCount,
        total:      totalRecipients,
        percentage: Math.round((signedCount / totalRecipients) * 100),
        allSigned,
      },
      signers,
      currentSigner: {
        name:    signatureRequest.recipient.name,
        email:   signatureRequest.recipient.email,
        status:  signatureRequest.status,
        signedAt: signatureRequest.signedAt,
      },
      // ── Overlay fields (used by signed-page viewer) ───────────────────────
      signatureFields: signatureRequest.signatureFields || [],
      signatures,
    };

    // ── If ALL signed, include completion info ───────────────────────────────
    if (allSigned) {
      response.completedAt = document.completedAt || null;
      if (document.signedPdfUrl) response.signedPdfUrl = document.signedPdfUrl;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching signed info:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}