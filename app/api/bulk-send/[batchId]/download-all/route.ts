//app/api/bulk-send/[batchId]/download-all/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { verifyUserFromRequest } from "@/lib/auth";
import JSZip from "jszip";
 

export async function GET(request: NextRequest, { params }: { params: { batchId: string } }) {
  try {
    // ✅ Verify user authentication
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { batchId } = params;

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

    // ✅ Create ZIP file with all signed PDFs
    const zip = new JSZip();

    // ✅ Add each signed document to the ZIP
    for (const doc of bulkSend.signedDocuments) {
      try {
        // ✅ Fetch the PDF from the URL
        const pdfResponse = await fetch(doc.signedPdfUrl);
        if (!pdfResponse.ok) {
          console.error(`Failed to fetch PDF for ${doc.recipientName}: ${pdfResponse.statusText}`);
          continue; // Skip this document if fetch fails
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        zip.file(`${doc.recipientName.replace(/[^a-z0-9]/gi, '_')}_signed.pdf`, pdfBuffer);
      } catch (error) {
        console.error(`Error processing document for ${doc.recipientName}:`, error);
        continue; // Skip this document if there's an error
      }
    }

    // ✅ Generate the ZIP file as a Node.js Buffer
    const zipContent = await zip.generateAsync({ type: "nodebuffer" });

    // ✅ Convert to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(zipContent);

    // ✅ Return the ZIP file as a download
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="bulk_${batchId}_signed_documents.zip"`,
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
