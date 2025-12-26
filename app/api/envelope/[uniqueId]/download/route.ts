import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { generateEnvelopeSignedPDF } from "@/lib/pdfGenerator";
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;
    
    console.log('📥 Envelope download request for:', uniqueId);
    
    const db = await dbPromise;

    // Find envelope by recipient uniqueId
    const envelope = await db.collection("envelopes").findOne({
      "recipients.uniqueId": uniqueId,
    });

    if (!envelope) {
      return NextResponse.json(
        { success: false, message: "Envelope not found" },
        { status: 404 }
      );
    }

    // Find this specific recipient
    const recipient = envelope.recipients.find((r: any) => r.uniqueId === uniqueId);

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: "Recipient not found" },
        { status: 404 }
      );
    }

    // Check if recipient has completed signing
    if (recipient.status !== 'completed') {
      return NextResponse.json(
        { 
          success: false, 
          message: "Envelope not yet completed. Please finish signing all documents first." 
        },
        { status: 400 }
      );
    }

    // Check if signed PDF already exists
    let signedPdfUrl = recipient.signedPdfUrl;

    if (!signedPdfUrl) {
      console.log('🎨 Generating signed envelope PDF (first time)...');
      
      // Generate signed PDF package
      signedPdfUrl = await generateEnvelopeSignedPDF(
        envelope.envelopeId,
        recipient.signedDocuments,
        recipient
      );

      // Save to database
      await db.collection("envelopes").updateOne(
        { 
          envelopeId: envelope.envelopeId, 
          "recipients.uniqueId": uniqueId 
        },
        {
          $set: {
            "recipients.$.signedPdfUrl": signedPdfUrl,
          }
        }
      );

      console.log('✅ Signed PDF generated and saved:', signedPdfUrl);
    } else {
      console.log('✅ Using existing signed PDF:', signedPdfUrl);
    }

    // Extract public_id from the generated URL
    const urlMatch = signedPdfUrl.match(/\/signed_envelopes\/(.+?)\.pdf/);
    if (!urlMatch) {
      console.error('❌ Could not extract public_id from URL');
      return NextResponse.json(
        { success: false, message: "Invalid PDF URL format" },
        { status: 500 }
      );
    }

    const publicId = `signed_envelopes/${urlMatch[1]}`;
    console.log('🔑 PDF Public ID:', publicId);

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
        { success: false, message: "Failed to retrieve signed envelope" },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('✅ Downloaded:', pdfBuffer.byteLength, 'bytes');

    // Create filename
    const filename = `envelope_${envelope.envelopeId}_signed.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Envelope download error:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}