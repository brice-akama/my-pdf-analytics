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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    
    console.log('👁️ View request for signature:', signatureId);
    
    const db = await dbPromise;

    // ⭐ Check if this is a CC recipient request
    const isCCRequest = signatureId.startsWith('cc-');
    let signatureRequest;
    let document;

    if (isCCRequest) {
      console.log('📧 CC Recipient view request');
      
      // Get CC recipient record
      const ccRecord = await db.collection("cc_recipients").findOne({
        uniqueId: signatureId,
      });

      if (!ccRecord) {
        return NextResponse.json(
          { success: false, message: "CC record not found" },
          { status: 404 }
        );
      }

      // Get document
      document = await db.collection("documents").findOne({
        _id: new ObjectId(ccRecord.documentId),
      });

      if (!document) {
        return NextResponse.json(
          { success: false, message: "Document not found" },
          { status: 404 }
        );
      }

      // Get any signature request for this document
      signatureRequest = await db.collection("signature_requests").findOne({
        documentId: ccRecord.documentId,
      });

      if (!signatureRequest) {
        return NextResponse.json(
          { success: false, message: "No signature requests found for this document" },
          { status: 404 }
        );
      }

      console.log('✅ CC recipient verified, document found');
    } else {
      // Regular signature request
      signatureRequest = await db.collection("signature_requests").findOne({
        uniqueId: signatureId,
      });

      if (!signatureRequest) {
        return NextResponse.json(
          { success: false, message: "Signature request not found" },
          { status: 404 }
        );
      }

      document = await db.collection("documents").findOne({
        _id: new ObjectId(signatureRequest.documentId),
      });

      if (!document) {
        return NextResponse.json(
          { success: false, message: "Document not found" },
          { status: 404 }
        );
      }
    }

    // ✅ DETERMINE WHICH SIGNATURES TO INCLUDE
    let signaturesToInclude;

    if (isCCRequest) {
      // CC RECIPIENT: Include ALL signed signatures
      signaturesToInclude = await db.collection("signature_requests")
        .find({ 
          documentId: signatureRequest.documentId,
          status: "signed"
        })
        .toArray();
      console.log(`📧 CC mode - PDF with all ${signaturesToInclude.length} signers`);
    } else if (signatureRequest.isBulkSend === true) {
      // BULK SEND: Only this person's signature
      signaturesToInclude = [signatureRequest];
      console.log('📧 Bulk send mode - PDF with only this signer');
    } else {
      // SHARED/ISOLATED: All signatures
      signaturesToInclude = await db.collection("signature_requests")
        .find({ 
          documentId: signatureRequest.documentId,
          status: "signed"
        })
        .toArray();
      console.log(`🤝 Shared/Isolated mode - PDF with all ${signaturesToInclude.length} signers`);
    }

    // ✅ GENERATE PDF WITH APPROPRIATE SIGNATURES
    console.log('🎨 Generating signed PDF...');
    const signedPdfUrl = await generateSignedPDF(
      signatureRequest.documentId,
      signaturesToInclude
    );

    console.log('✅ PDF generated:', signedPdfUrl);

    // Extract public_id from the generated URL
    const urlMatch = signedPdfUrl.match(/\/signed_documents\/(.+?)\.pdf/);
    if (!urlMatch) {
      console.error('❌ Could not extract public_id from generated URL');
      return NextResponse.json(
        { success: false, message: "Invalid generated PDF URL" },
        { status: 500 }
      );
    }

    const publicId = `signed_documents/${urlMatch[1]}`;
    console.log('🔑 Generated PDF Public ID:', publicId);

    // Generate authenticated download URL
    const authenticatedUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

    console.log('✅ Fetching with authenticated URL');

    // Fetch the PDF
    const pdfResponse = await fetch(authenticatedUrl);

    if (!pdfResponse.ok) {
      console.error('❌ Failed:', pdfResponse.status, pdfResponse.statusText);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve signed document" },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('✅ Downloaded:', pdfBuffer.byteLength, 'bytes');

    // ✅✅✅ ADD VIEW NOTIFICATION (NOT DOWNLOAD)
    const viewerName = isCCRequest 
      ? (signatureRequest.recipient?.name || 'CC Recipient')
      : (signatureRequest.recipient?.name || signatureRequest.signerName || 'Unknown User');
    const viewerEmail = isCCRequest 
      ? (signatureRequest.recipient?.email || signatureRequest.signerEmail)
      : (signatureRequest.recipient?.email || signatureRequest.signerEmail);

    console.log('📊 View Info:', { viewerName, viewerEmail, uniqueId: signatureRequest.uniqueId });

    if (document.userId) {
      await notifyDocumentView(
        document.userId,
        document.originalFilename || document.filename || 'document.pdf',
        signatureRequest.documentId,
        viewerName,
        viewerEmail,
        signatureRequest.uniqueId,
        true
      );
      console.log('✅ View notification sent to document owner');
    }

    // ✅ Track view in document (separate from downloads)
    await db.collection('documents').updateOne(
      { _id: new ObjectId(signatureRequest.documentId) },
      {
        $inc: { 'tracking.views': 1 },
        $set: { 'tracking.lastViewed': new Date() }
      }
    );

    // Return PDF for viewing (inline, not attachment)
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="signed_${document.originalFilename || document.filename || 'document.pdf'}"`, // ⭐ inline instead of attachment
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('❌ View error:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}