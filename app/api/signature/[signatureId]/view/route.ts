import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { generateSignedPDF } from "@/lib/pdfGenerator";
import cloudinary from 'cloudinary';
import { notifyDocumentView } from "@/lib/notifications";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract Cloudinary public_id from a secure_url and fetch the bytes
// ─────────────────────────────────────────────────────────────────────────────
async function fetchCloudinaryPdf(signedUrl: string): Promise<ArrayBuffer | null> {
  try {
    // URL pattern:  .../image/upload/v.../signed_documents/XXX.pdf
    const urlMatch = signedUrl.match(/\/(?:image|raw)\/upload\/(?:v\d+\/)?(.+?)(?:\.pdf)?$/);
    if (!urlMatch) {
      console.error('❌ Cannot parse public_id from URL:', signedUrl);
      return null;
    }

    let publicId = urlMatch[1];
    // Strip any trailing .pdf that slipped through
    publicId = publicId.replace(/\.pdf$/, '');
    console.log('🔑 Public ID for fetch:', publicId);

    const authenticatedUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

    const res = await fetch(authenticatedUrl);
    if (!res.ok) {
      console.error('❌ Cloudinary fetch failed:', res.status, res.statusText);
      return null;
    }

    return res.arrayBuffer();
  } catch (err) {
    console.error('❌ fetchCloudinaryPdf error:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/signature/[signatureId]/view
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    console.log('👁️ View request for signature:', signatureId);

    const db = await dbPromise;

    const isCCRequest = signatureId.startsWith('cc-');
    let signatureRequest: any;
    let document: any;

    // ── Resolve signature request + document ──────────────────────────────────
    if (isCCRequest) {
      console.log('📧 CC Recipient view request');

      const ccRecord = await db.collection('cc_recipients').findOne({ uniqueId: signatureId });
      if (!ccRecord) return NextResponse.json({ success: false, message: 'CC record not found' }, { status: 404 });

      document = await db.collection('documents').findOne({ _id: new ObjectId(ccRecord.documentId) });
      if (!document) return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });

      signatureRequest = await db.collection('signature_requests').findOne({ documentId: ccRecord.documentId });
      if (!signatureRequest) return NextResponse.json({ success: false, message: 'No signature requests found' }, { status: 404 });

      console.log('✅ CC recipient verified');
    } else {
      signatureRequest = await db.collection('signature_requests').findOne({ uniqueId: signatureId });
      if (!signatureRequest) return NextResponse.json({ success: false, message: 'Signature request not found' }, { status: 404 });

      document = await db.collection('documents').findOne({ _id: new ObjectId(signatureRequest.documentId) });
      if (!document) return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    // ── Determine signers to include ──────────────────────────────────────────
    let signaturesToInclude: any[];

    if (isCCRequest || !signatureRequest.isBulkSend) {
      // All signed requests for this document
      signaturesToInclude = await db.collection('signature_requests')
        .find({ documentId: signatureRequest.documentId, status: 'signed' })
        .toArray();
      console.log(`🤝 Including all ${signaturesToInclude.length} signed signers`);
    } else {
      // Bulk send — only this signer
      signaturesToInclude = [signatureRequest];
      console.log('📧 Bulk send mode - only this signer');
    }

    // ── Serve the ORIGINAL unsigned PDF (same as CC route) ───────────────────
    // The signed page draws overlays on top using signature data from signed-info
    // This guarantees overlay positions match exactly — same approach as CC page
    if (!document.cloudinaryPdfUrl) {
      return NextResponse.json({ success: false, message: 'PDF not found' }, { status: 404 });
    }

    const fileUrl    = document.cloudinaryPdfUrl;
    const urlParts   = fileUrl.split('/upload/');
    const afterUpload = urlParts[1];
    const pathParts  = afterUpload.split('/');
    pathParts.shift(); // remove version
    let publicId     = pathParts.join('/').replace('.pdf', '');
    publicId         = decodeURIComponent(publicId);

    const downloadUrl = cloudinary.v2.utils.private_download_url(
      publicId, 'pdf',
      {
        resource_type: 'image',
        type:          'upload',
        attachment:    false,
        expires_at:    Math.floor(Date.now() / 1000) + 3600,
      }
    );

    const cloudinaryResponse = await fetch(downloadUrl);
    if (!cloudinaryResponse.ok) {
      return NextResponse.json({ success: false, message: 'Failed to fetch PDF' }, { status: 500 });
    }

    const pdfBuffer = await cloudinaryResponse.arrayBuffer();
    
    // ── Notifications + tracking (fire-and-forget, don't block response) ──────
    const viewerName  = signatureRequest.recipient?.name  || signatureRequest.signerName  || 'Unknown User';
    const viewerEmail = signatureRequest.recipient?.email || signatureRequest.signerEmail || '';

    if (document.userId) {
      notifyDocumentView(
        document.userId,
        document.originalFilename || document.filename || 'document.pdf',
        signatureRequest.documentId,
        viewerName,
        viewerEmail,
        signatureRequest.uniqueId,
        true
      ).catch(() => {});
    }

    db.collection('documents').updateOne(
      { _id: new ObjectId(signatureRequest.documentId) },
      {
        $inc: { 'tracking.views': 1 },
        $set: { 'tracking.lastViewed': new Date() },
      }
    ).catch(() => {});

    console.log('✅ Returning PDF,', pdfBuffer.byteLength, 'bytes');
    return buildPdfResponse(pdfBuffer, document);

  } catch (error) {
    console.error('❌ View error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build the PDF inline response
// ─────────────────────────────────────────────────────────────────────────────
function buildPdfResponse(buffer: ArrayBuffer, document: any): NextResponse {
  const filename = `signed_${document.originalFilename || document.filename || 'document.pdf'}`;
  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length':      buffer.byteLength.toString(),
      'Cache-Control':       'private, max-age=3600',
    },
  });
}