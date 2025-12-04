 // app/api/signature/[signatureId]/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { 
  sendDocumentSignedNotification, 
  sendAllSignaturesCompleteEmail 
} from "@/lib/emailService";
import { generateSignedPDF } from "@/lib/pdfGenerator";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const { signedFields, ipAddress } = await request.json();
    
    console.log('📝 Processing signature for:', signatureId);
    
    const db = await dbPromise;

    // Get the signature request
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    if (signatureRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, message: "Document already signed" },
        { status: 400 }
      );
    }

    // Update this recipient's signature
    const now = new Date();
    await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId },
      {
        $set: {
          status: "signed",
          signedFields: signedFields,
          signedAt: now,
          completedAt: now,
          ipAddress: ipAddress || null,
        },
      }
    );

    

    console.log('✅ Signature saved for:', signatureRequest.recipient.name);

    // If shared mode, update ALL signature requests for this document with the new signature
if (signatureRequest.viewMode === 'shared') {
  console.log('🔄 Shared mode: Updating all recipients with new signature...');
  
  await db.collection("signature_requests").updateMany(
    { 
      documentId: signatureRequest.documentId,
      uniqueId: { $ne: signatureId } // Don't update the current one again
    },
    {
      $set: {
        [`sharedSignatures.${signatureRequest.recipientIndex}`]: {
          recipientName: signatureRequest.recipient.name,
          recipientEmail: signatureRequest.recipient.email,
          signedFields: signedFields,
          signedAt: now,
        }
      }
    }
  );
  
  console.log('✅ All recipients updated with new signature');
}

    // Get the document
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // Notify owner that someone signed
    if (signatureRequest.ownerEmail) {
      await sendDocumentSignedNotification({
        ownerEmail: signatureRequest.ownerEmail,
        ownerName: 'Document Owner',
        signerName: signatureRequest.recipient.name,
        signerEmail: signatureRequest.recipient.email,
        documentName: document.filename,
        statusLink: `${request.nextUrl.origin}/dashboard`, // Update with actual status page
      }).catch(err => console.error('Failed to send owner notification:', err));
    }

    // Check if ALL recipients have signed
    const allRequests = await db.collection("signature_requests")
      .find({ documentId: signatureRequest.documentId })
      .toArray();

    const totalRecipients = allRequests.length;
    const signedCount = allRequests.filter(r => r.status === 'signed').length;

    console.log(`📊 Progress: ${signedCount}/${totalRecipients} signatures collected`);

    // Update document's signed count
    await db.collection("documents").updateOne(
      { _id: new ObjectId(signatureRequest.documentId) },
      {
        $set: {
          signedCount: signedCount,
          status: signedCount === totalRecipients ? 'completed' : 'pending_signature',
        },
      }
    );

    
    // If ALL signed, generate final PDF and notify everyone
    if (signedCount === totalRecipients) {
      console.log('🎉 All signatures collected! Generating final PDF...');

      try {
        
        // Generate signed PDF
        const signedPdfUrl = await generateSignedPDF(
          signatureRequest.documentId,
          allRequests
        );

        console.log('✅ Signed PDF generated:', signedPdfUrl);

        // Update document with signed PDF URL
        await db.collection("documents").updateOne(
          { _id: new ObjectId(signatureRequest.documentId) },
          {
            $set: {
              signedPdfUrl: signedPdfUrl,
              status: 'completed',
              completedAt: new Date(),
            },
          }
        );

        // Send completion emails to ALL parties (owner + all signers)
        const downloadLink = `${request.nextUrl.origin}/api/signature/${signatureId}/download`;
        
        const allSigners = allRequests.map(req => ({
          name: req.recipient.name,
          email: req.recipient.email,
          signedAt: req.signedAt,
        }));

        // Send to all recipients
        const emailPromises = allRequests.map(req =>
          sendAllSignaturesCompleteEmail({
            recipientEmail: req.recipient.email,
            recipientName: req.recipient.name,
            documentName: document.filename,
            downloadLink: downloadLink,
            allSigners: allSigners,
          }).catch(err => console.error('Failed to send completion email:', err))
        );

        // Also send to owner if different from signers
        if (signatureRequest.ownerEmail && 
            !allRequests.some(r => r.recipient.email === signatureRequest.ownerEmail)) {
          emailPromises.push(
            sendAllSignaturesCompleteEmail({
              recipientEmail: signatureRequest.ownerEmail,
              recipientName: 'Document Owner',
              documentName: document.filename,
              downloadLink: downloadLink,
              allSigners: allSigners,
            }).catch(err => console.error('Failed to send owner completion email:', err))
          );
        }

        await Promise.all(emailPromises);
        console.log('✅ All completion emails sent');

        return NextResponse.json({
          success: true,
          message: "Document signed successfully! All signatures collected.",
          allComplete: true,
          signedPdfUrl: signedPdfUrl,
          downloadLink: `/signed/${signatureId}`, // ← Add this for user to download
        });
      } catch (pdfError) {
        console.error('❌ Failed to generate signed PDF:', pdfError);
        // Still return success for the signature, but log the PDF error
        return NextResponse.json({
          success: true,
          message: "Document signed successfully, but PDF generation failed. Please contact support.",
          allComplete: true,
          pdfError: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Document signed successfully",
      allComplete: false,
      progress: {
        signed: signedCount,
        total: totalRecipients,
      },
    });
  } catch (error) {
    console.error("❌ Error signing document:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}