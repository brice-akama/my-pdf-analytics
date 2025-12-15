// app/api/signature/[signatureId]/merged-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
 
import { mergePDFWithAttachments, addPageNumbers } from "@/lib/pdfMerger";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    // 1. Get signature request
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // 2. Check if document is fully signed
    if (signatureRequest.status !== "completed") {
      return NextResponse.json(
        { 
          success: false, 
          message: "Document must be fully signed before generating merged PDF" 
        },
        { status: 400 }
      );
    }

    // 3. Get the signed PDF URL (from your document storage)
    const document = await db.collection("documents").findOne({
      _id: signatureRequest.documentId,
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    const signedPdfUrl = document.cloudinaryUrl; // Your signed PDF URL

    // 4. Get all attachments for this signature request
    const attachments = await db
      .collection("signature_attachments")
      .find({ signatureRequestId: signatureId })
      .sort({ uploadedAt: 1 })
      .toArray();

    console.log(`📎 Found ${attachments.length} attachments to merge`);

    // 5. Format attachments for merger
    const formattedAttachments = attachments.map((att) => ({
      url: att.cloudinaryUrl,
      filename: att.filename,
      fileType: att.fileType,
      uploadedBy: att.recipientName || att.recipientEmail,
      uploadedAt: att.uploadedAt,
    }));

    // 6. Merge PDFs
    console.log('🔄 Starting PDF merge...');
    let mergedPdfBytes = await mergePDFWithAttachments(
      signedPdfUrl,
      formattedAttachments
    );

    // 7. Optional: Add page numbers
    const { searchParams } = new URL(request.url);
    const addPages = searchParams.get('pageNumbers') === 'true';
    
    if (addPages) {
      console.log('📄 Adding page numbers...');
      mergedPdfBytes = await addPageNumbers(mergedPdfBytes);
    }

    // 8. Return the merged PDF
   // 8. Return the merged PDF
return new NextResponse(Buffer.from(mergedPdfBytes), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="signed-${document.filename}"`,
  },
});


  } catch (error) {
    console.error("❌ Error generating merged PDF:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate merged PDF" },
      { status: 500 }
    );
  }
}