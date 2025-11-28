//app/api/signature/[signatureId]/download/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import cloudinary from 'cloudinary';

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
    
    console.log('📥 Download request for signature:', signatureId);
    
    const db = await dbPromise;

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

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

    if (!document.signedPdfUrl) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Signed document not yet available." 
        },
        { status: 400 }
      );
    }

    // Extract public_id from the URL
    const urlMatch = document.signedPdfUrl.match(/\/signed_documents\/(.+?)\.pdf/);
    if (!urlMatch) {
      console.error('❌ Could not extract public_id from URL');
      return NextResponse.json(
        { success: false, message: "Invalid document URL" },
        { status: 500 }
      );
    }

    const publicId = `signed_documents/${urlMatch[1]}`;
    console.log('🔑 Public ID:', publicId);

    // Generate authenticated download URL
    const authenticatedUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
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

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="signed_${document.filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}