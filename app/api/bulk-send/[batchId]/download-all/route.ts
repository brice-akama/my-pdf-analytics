//app/api/bulk-send/[batchId]/download-all/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { verifyUserFromRequest } from "@/lib/auth";
import JSZip from "jszip";
import cloudinary from 'cloudinary';

// ✅ Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  
  try {
    // ✅ Verify user authentication
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Check if batchId is valid
    if (!batchId) {
      return NextResponse.json(
        { success: false, message: "Batch ID is required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // ✅ Get the bulk send record
    const bulkSend = await db.collection("bulk_sends").findOne({
      batchId: batchId,
      ownerId: user.id
    });

    // ✅ Check if bulk send exists and belongs to the user
    if (!bulkSend) {
      return NextResponse.json(
        { success: false, message: "Bulk send not found or you don't have permission" },
        { status: 404 }
      );
    }

    // ✅ Check if there are signed documents to download
    if (!bulkSend.signedDocuments || bulkSend.signedDocuments.length === 0) {
      return NextResponse.json(
        { success: false, message: "No signed documents available for download" },
        { status: 400 }
      );
    }

    console.log(`📦 Creating ZIP with ${bulkSend.signedDocuments.length} documents`);

    // ✅ Create ZIP file with all signed PDFs
    const zip = new JSZip();

    // ✅ Add each signed document to the ZIP
    for (const doc of bulkSend.signedDocuments) {
      try {
        console.log(`📄 Processing: ${doc.recipientName}`);

        // ✅ Extract public_id from Cloudinary URL
        const urlMatch = doc.signedPdfUrl.match(/\/signed_documents\/(.+?)\.pdf/);
        if (!urlMatch) {
          console.error(`❌ Could not extract public_id for ${doc.recipientName}`);
          continue;
        }

        const publicId = `signed_documents/${urlMatch[1]}`;
        console.log(`🔑 Public ID: ${publicId}`);

        // ✅ Generate authenticated Cloudinary download URL
        const authenticatedUrl = cloudinary.v2.utils.private_download_url(
          publicId,
          'pdf',
          {
            resource_type: 'image',
            type: 'upload',
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          }
        );

        // ✅ Fetch the PDF with authenticated URL
        const pdfResponse = await fetch(authenticatedUrl);
        
        if (!pdfResponse.ok) {
          console.error(`❌ Failed to fetch PDF for ${doc.recipientName}: ${pdfResponse.statusText}`);
          continue;
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        console.log(`✅ Downloaded ${doc.recipientName}: ${pdfBuffer.byteLength} bytes`);

        // ✅ Add to ZIP with sanitized filename
        const sanitizedName = doc.recipientName.replace(/[^a-z0-9]/gi, '_');
        zip.file(`${sanitizedName}_signed.pdf`, pdfBuffer);

      } catch (error) {
        console.error(`❌ Error processing document for ${doc.recipientName}:`, error);
        continue;
      }
    }

    // ✅ Check if ZIP has any files
    const fileCount = Object.keys(zip.files).length;
    if (fileCount === 0) {
      return NextResponse.json(
        { success: false, message: "No documents could be added to ZIP" },
        { status: 500 }
      );
    }

    console.log(`📦 ZIP contains ${fileCount} files`);

    // ✅ Generate the ZIP file as a Node.js Buffer
    const zipContent = await zip.generateAsync({ type: "nodebuffer" });

    // ✅ Convert to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(zipContent);

    console.log(`✅ ZIP generated: ${uint8Array.length} bytes`);

    // ✅ Return the ZIP file as a download
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="bulk_${batchId}_signed_documents.zip"`,
        'Content-Length': uint8Array.length.toString(),
      },
    });

  } catch (error) {
    console.error("❌ Download bulk send error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}