// app/api/envelope/[uniqueId]/download/route.ts
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

    // ⭐ ALWAYS REGENERATE PDF (like single signature download does)
    console.log('🎨 Regenerating signed envelope PDF...');
    
    const signedPdfUrl = await generateEnvelopeSignedPDF(
      envelope.envelopeId,
      recipient.signedDocuments,
      recipient
    );

    console.log('✅ Signed PDF generated:', signedPdfUrl);

    // ⭐ Extract public_id from the NEWLY generated URL
    const urlMatch = signedPdfUrl.match(/\/signed_envelopes\/(.+?)\.pdf/);
    if (!urlMatch) {
      console.error('❌ Could not extract public_id from URL:', signedPdfUrl);
      return NextResponse.json(
        { success: false, message: "Invalid PDF URL format" },
        { status: 500 }
      );
    }

    const publicId = `signed_envelopes/${urlMatch[1]}`;
    console.log('🔑 PDF Public ID:', publicId);

    // ⭐ Generate authenticated download URL
    const authenticatedUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      }
    );

    console.log('🔐 Generated authenticated URL');

    // ⭐ Fetch the PDF with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let pdfResponse;
    try {
      pdfResponse = await fetch(authenticatedUrl, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch error:', fetchError.message);
      
      // ⭐ Fallback: Try direct URL if authenticated fails
      console.log('🔄 Trying direct URL fallback...');
      try {
        pdfResponse = await fetch(signedPdfUrl, {
          signal: controller.signal,
        });
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return NextResponse.json(
          { success: false, message: "Failed to fetch PDF from Cloudinary" },
          { status: 500 }
        );
      }
    }

    if (!pdfResponse.ok) {
      console.error('❌ PDF fetch failed:', pdfResponse.status, pdfResponse.statusText);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve signed envelope" },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('✅ Downloaded:', pdfBuffer.byteLength, 'bytes');

    // Create filename
    const filename = `envelope_${envelope.envelopeId.replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error: any) {
    console.error('❌ Envelope download error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { success: false, message: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}