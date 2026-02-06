// app/api/signature/[signatureId]/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { parseUserAgent } from '@/lib/deviceParser';
import { 
  sendDocumentSignedNotification, 
  sendAllSignaturesCompleteEmail,
  sendSignatureRequestEmail, // ⭐ Add this import
  sendCCCompletionEmail
} from "@/lib/emailService";
import { generateSignedPDF } from "@/lib/pdfGenerator";
import { getLocationFromIP } from '@/lib/geoip';
import { createNotification } from "@/lib/notifications";

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

    // ⭐ NEW: CHECK IF USER DELEGATED SIGNING (BLOCK SIGNING)
if (signatureRequest.status === 'delegated') {
  return NextResponse.json(
    { 
      success: false, 
      message: `You delegated this document to ${signatureRequest.delegatedToName}. You can view but cannot sign.` 
    },
    { status: 403 }
  );
}

//   CHECK IF SCHEDULED FOR FUTURE
if (signatureRequest.scheduledSendDate) {
  const scheduledDate = new Date(signatureRequest.scheduledSendDate);
  const now = new Date();
  
  if (now < scheduledDate) {
    return NextResponse.json(
      { 
        success: false, 
        message: `This document is scheduled to be available on ${scheduledDate.toLocaleDateString()}. You cannot sign before this date.` 
      },
      { status: 403 }
    );
  }
}

    //   CHECK IF SELFIE IS REQUIRED AND VERIFIED
// Only enforce selfie if access code was also used and verified
if (signatureRequest.selfieVerificationRequired && 
    signatureRequest.accessCodeRequired && 
    signatureRequest.accessCodeVerifiedAt && 
    !signatureRequest.selfieVerifiedAt) {
  return NextResponse.json(
    { success: false, message: "Selfie verification required before signing" },
    { status: 400 }
  );
}

     // Track device, browser, OS, and user agent when signing
    const userAgent = request.headers.get('user-agent') || '';
    const deviceInfo = parseUserAgent(userAgent);
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';


    // ✅ Get geographic location
    const geoLocation = await getLocationFromIP(ip);
    
    // ⭐ Get the document FIRST (moved up to avoid undefined error)
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
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
          device: deviceInfo.device, // Add this
          browser: deviceInfo.browser, // Add this
          os: deviceInfo.os, // Add this
          userAgent: userAgent, // Add this
          // ✅ Add geographic data
          location: geoLocation ? {
            city: geoLocation.city,
            region: geoLocation.region,
            country: geoLocation.country,
            countryCode: geoLocation.countryCode,
            latitude: geoLocation.latitude,
            longitude: geoLocation.longitude,
          } : null,
        },
      }
    );

    console.log('✅ Signature saved for:', signatureRequest.recipient.name);

    await createNotification({
  userId: document.userId,
  type: 'signature',
  title: 'Document Signed',
  message: `${signatureRequest.recipient.name} signed "${document.originalFilename || 'document'}"`,
  documentId: signatureRequest.documentId,
  actorName: signatureRequest.recipient.name,
  actorEmail: signatureRequest.recipient.email,
  metadata: {
    signedAt: now,
    signatureRequestId: signatureRequest._id.toString(),
  },
}).catch(err => console.error('Notification error:', err));


  

    // ⭐ Handle sequential signing
    if (signatureRequest.signingOrder === 'sequential') {
      console.log('🔄 Sequential mode: Checking for next signer...');
      
      // Find the next person in line
      const nextRecipient = await db.collection("signature_requests").findOne({
        documentId: signatureRequest.documentId,
        
        recipientIndex: signatureRequest.recipientIndex + 1,
        status: 'awaiting_turn',
      });

      if (nextRecipient) {
        // Activate next recipient
        await db.collection("signature_requests").updateOne(
          { _id: nextRecipient._id },
          { $set: { status: 'pending', notifiedAt: new Date() } }
        );

        console.log('✅ Next signer activated:', nextRecipient.recipient.name);

        // Send email to next signer
        const nextSigningLink = `${request.nextUrl.origin}/sign/${nextRecipient.uniqueId}`;
        
        // ⭐ Fixed: Proper async/await
        try {
          await sendSignatureRequestEmail({
            recipientName: nextRecipient.recipient.name,
            recipientEmail: nextRecipient.recipient.email,
             originalFilename: document.filename,
            signingLink: nextSigningLink,
            senderName: signatureRequest.recipient.name,
            message: `${signatureRequest.recipient.name} has signed. It's now your turn to sign.`,
            dueDate: nextRecipient.dueDate,
          });
          console.log('✅ Next signer notified via email');
        } catch (err) {
          console.error('❌ Failed to notify next signer:', err);
        }
      } else {
        console.log('✅ No more signers - this was the last one');
      }
    }

    // If shared mode, update ALL signature requests for this document with the new signature
    if (signatureRequest.viewMode === 'shared') {
      console.log('🔄 Shared mode: Updating all recipients with new signature...');
      
      await db.collection("signature_requests").updateMany(
        { 
          documentId: signatureRequest.documentId,
          
          uniqueId: { $ne: signatureId }
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

    
    // Notify owner that someone signed
    if (signatureRequest.ownerEmail) {
      await sendDocumentSignedNotification({
        ownerEmail: signatureRequest.ownerEmail,
        ownerName: 'Document Owner',
        signerName: signatureRequest.recipient.name,
        signerEmail: signatureRequest.recipient.email,
        originalFilename: document.filename,
        statusLink: `${request.nextUrl.origin}/dashboard`,
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
        
// ✅ Update bulk send record with signed document
if (signatureRequest.isBulkSend && signedPdfUrl) {
  await db.collection("bulk_sends").updateOne(
    { batchId: signatureRequest.bulkSendBatchId },
    {
      $push: {
        signedDocuments: {
          recipientName: signatureRequest.recipient.name,
          recipientEmail: signatureRequest.recipient.email,
          documentId: signatureRequest.documentId,
          signedPdfUrl: signedPdfUrl,
          signedAt: new Date(),
        }
      }
    } as any // ✅ Add type assertion
  );
  console.log('✅ Updated bulk send record with signed document');
}
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
           originalFilename: document.filename,
            downloadLink: downloadLink,
            allSigners: allSigners,
          }).catch(err => console.error('Failed to send completion email:', err))
        );

        

        // ⭐ ADD THIS: Send to CC recipients who want completion notification
    if (document.ccRecipients) {
      const completionCCs = document.ccRecipients.filter(
        (cc: any) => cc.notifyWhen === 'completed'
      );
      
      if (completionCCs.length > 0) {
        console.log('📤 Sending completion CC to', completionCCs.length, 'recipients');
        
        const ccEmailPromises = completionCCs.map((cc: any) =>
          sendCCCompletionEmail({
            ccName: cc.name,
            ccEmail: cc.email,
            originalFilename: document.filename,
            downloadLink: `${request.nextUrl.origin}/api/signature/${signatureId}/download`,
            allSigners: allSigners,
          }).catch(err => {
            console.error(`Failed to send CC completion to ${cc.email}:`, err);
            return null;
          })
        );
        
        emailPromises.push(...ccEmailPromises);
      }
    }
    
    await Promise.all(emailPromises);

        // Also send to owner if different from signers
        if (signatureRequest.ownerEmail && 
            !allRequests.some(r => r.recipient.email === signatureRequest.ownerEmail)) {
          emailPromises.push(
            sendAllSignaturesCompleteEmail({
              recipientEmail: signatureRequest.ownerEmail,
              recipientName: 'Document Owner',
               originalFilename: document.filename,
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
          downloadLink: `/signed/${signatureId}`,
        });
      } catch (pdfError) {
        console.error('❌ Failed to generate signed PDF:', pdfError);
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