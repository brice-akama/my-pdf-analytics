import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "@/app/api/lib/mongodb";
import { generateEnvelopeSignedPDF } from "@/lib/pdfGenerator";
import cloudinary from 'cloudinary';
import JSZip from 'jszip';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ envelopeId: string }> }
) {
  try {
    const { envelopeId } = await params;
    
    // Verify user is the owner
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📥 Owner download request for envelope:', envelopeId);
    
    const db = await dbPromise;

    // Get envelope
    const envelope = await db.collection("envelopes").findOne({
      envelopeId: envelopeId,
    });

    if (!envelope) {
      return NextResponse.json(
        { success: false, message: "Envelope not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (envelope.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Get all completed recipients
    const completedRecipients = envelope.recipients.filter(
      (r: any) => r.status === 'completed'
    );

    if (completedRecipients.length === 0) {
      return NextResponse.json(
        { success: false, message: "No completed signatures yet" },
        { status: 400 }
      );
    }

    console.log(`📦 Found ${completedRecipients.length} completed recipient(s)`);

    // If only one recipient, return single PDF
    if (completedRecipients.length === 1) {
      const recipient = completedRecipients[0];
      
      let signedPdfUrl = recipient.signedPdfUrl;

      if (!signedPdfUrl) {
        console.log('🎨 Generating signed PDF...');
        signedPdfUrl = await generateEnvelopeSignedPDF(
          envelope.envelopeId,
          recipient.signedDocuments,
          recipient
        );

        await db.collection("envelopes").updateOne(
          { 
            envelopeId: envelope.envelopeId, 
            "recipients.uniqueId": recipient.uniqueId 
          },
          {
            $set: {
              "recipients.$.signedPdfUrl": signedPdfUrl,
            }
          }
        );
      }

      // Download and return
      const urlMatch = signedPdfUrl.match(/\/signed_envelopes\/(.+?)\.pdf/);
      if (!urlMatch) {
        throw new Error('Invalid PDF URL');
      }

      const publicId = `signed_envelopes/${urlMatch[1]}`;
      const authenticatedUrl = cloudinary.v2.utils.private_download_url(
        publicId,
        'pdf',
        {
          resource_type: 'image',
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }
      );

      const pdfResponse = await fetch(authenticatedUrl);
      if (!pdfResponse.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      const filename = `envelope_${envelopeId}_${recipient.name.replace(/\s+/g, '_')}.pdf`;

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.byteLength.toString(),
        },
      });
    }

    // Multiple recipients - create ZIP
    console.log('📦 Creating ZIP with multiple signed PDFs...');
    const zip = new JSZip();

    for (const recipient of completedRecipients) {
      try {
        let signedPdfUrl = recipient.signedPdfUrl;

        if (!signedPdfUrl) {
          console.log(`🎨 Generating PDF for ${recipient.name}...`);
          signedPdfUrl = await generateEnvelopeSignedPDF(
            envelope.envelopeId,
            recipient.signedDocuments,
            recipient
          );

          await db.collection("envelopes").updateOne(
            { 
              envelopeId: envelope.envelopeId, 
              "recipients.uniqueId": recipient.uniqueId 
            },
            {
              $set: {
                "recipients.$.signedPdfUrl": signedPdfUrl,
              }
            }
          );
        }

        // Download PDF
        const urlMatch = signedPdfUrl.match(/\/signed_envelopes\/(.+?)\.pdf/);
        if (!urlMatch) continue;

        const publicId = `signed_envelopes/${urlMatch[1]}`;
        const authenticatedUrl = cloudinary.v2.utils.private_download_url(
          publicId,
          'pdf',
          {
            resource_type: 'image',
            type: 'upload',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          }
        );

        const pdfResponse = await fetch(authenticatedUrl);
        if (!pdfResponse.ok) {
          console.error(`Failed to fetch PDF for ${recipient.name}`);
          continue;
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        
        // Add to ZIP
        const filename = `${recipient.name.replace(/\s+/g, '_')}_signed.pdf`;
        zip.file(filename, pdfBuffer);

        console.log(`✅ Added ${filename} to ZIP`);

      } catch (err) {
        console.error(`Failed to process ${recipient.name}:`, err);
      }
    }

    // Generate ZIP
    console.log('🗜️ Generating ZIP file...');
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    console.log('✅ ZIP created:', zipBuffer.byteLength, 'bytes');

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="envelope_${envelopeId}_all_signed.zip"`,
        'Content-Length': zipBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Owner download error:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}