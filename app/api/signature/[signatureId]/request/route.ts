// app/api/signature/[signatureId]/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    // Get signature request with all fields
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // ⭐ CHECK ACCESS CONTROL FOR REASSIGNED DOCUMENTS
    if (signatureRequest.wasReassigned) {
      const { allowOriginalToView, originalRecipient } = signatureRequest;
      
      // Get the requesting user's email from query params or headers
      const url = new URL(request.url);
      const requestingEmail = url.searchParams.get('recipient');
      
      // Check if this is the original recipient trying to access
      const isOriginalRecipient = requestingEmail === originalRecipient?.email;
      const isCurrentRecipient = requestingEmail === signatureRequest.recipientEmail;
      
      console.log('🔍 Access Check:', {
        requestingEmail,
        isOriginalRecipient,
        isCurrentRecipient,
        allowOriginalToView,
      });
      
      if (isOriginalRecipient && !isCurrentRecipient) {
        if (!allowOriginalToView) {
          // ⭐ ACCESS DENIED
          return NextResponse.json(
            { 
              success: false, 
              message: "This document has been reassigned and you no longer have access.",
              wasReassigned: true,
              accessDenied: true,
              newRecipient: {
                name: signatureRequest.recipientName,
                email: signatureRequest.recipientEmail,
              }
            },
            { status: 403 }
          );
        }
        
        // ⭐ VIEW-ONLY MODE
        console.log('👁️ Granting view-only access to original recipient');
      }
    }

    // Get document details
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // Get all shared signatures if in shared mode
    let allSharedSignatures: Record<string, any> = {};
    if (signatureRequest.viewMode === 'shared') {
      const allRequests = await db.collection("signature_requests")
        .find({ documentId: signatureRequest.documentId })
        .toArray();
      
      allRequests.forEach(req => {
        if (req.status === 'signed' && req.signedFields) {
          allSharedSignatures[req.recipientIndex] = {
            recipientName: req.recipient.name,
            recipientEmail: req.recipient.email,
            signedFields: req.signedFields,
            signedAt: req.signedAt,
          };
        }
      });
      
      console.log('📊 Shared mode: Found', Object.keys(allSharedSignatures).length, 'signed fields');
    }

    // ⭐ Add view-only flag if this is a reassigned document being viewed by original recipient
    const viewOnlyMode = signatureRequest.wasReassigned && 
                        signatureRequest.allowOriginalToView &&
                        request.url.includes(`recipient=${signatureRequest.originalRecipient?.email}`);

    return NextResponse.json({
      success: true,
      viewOnlyMode: viewOnlyMode, //   Add this flag
      wasReassigned: signatureRequest.wasReassigned || false, //   Add this
      originalRecipient: signatureRequest.originalRecipient || null, //   Add this
      signatureRequest: {
        uniqueId: signatureRequest.uniqueId,
        documentId: signatureRequest.documentId,
        status: signatureRequest.status,
        recipient: signatureRequest.recipient,
        recipientIndex: signatureRequest.recipientIndex,
        recipientName: signatureRequest.recipientName,  //   ADD THIS
  recipientEmail: signatureRequest.recipientEmail,  //   ADD THIS
        signatureFields: signatureRequest.signatureFields || [],
        viewMode: signatureRequest.viewMode || 'isolated',
        sharedSignatures: allSharedSignatures,
        expiresAt: signatureRequest.expiresAt,
        cancelledAt: signatureRequest.cancelledAt,
        declinedAt: signatureRequest.declinedAt,
        declineReason: signatureRequest.declineReason,
        cancellationReason: signatureRequest.cancellationReason,
        signedAt: signatureRequest.signedAt,
        signedFields: signatureRequest.signedFields || [],
        ipAddress: signatureRequest.ipAddress || null,
        message: signatureRequest.message,
        dueDate: signatureRequest.dueDate,
        createdAt: signatureRequest.createdAt,
        accessCodeRequired: signatureRequest.accessCodeRequired || false,
        accessCodeVerifiedAt: signatureRequest.accessCodeVerifiedAt || null,
        accessCodeType: signatureRequest.accessCodeType || null,
        accessCodeHint: signatureRequest.accessCodeHint || null,
        selfieVerificationRequired: signatureRequest.selfieVerificationRequired || false,
        selfieVerifiedAt: signatureRequest.selfieVerifiedAt || null,
        selfieVerification: signatureRequest.selfieVerification || null,
        document: {
          _id: document._id.toString(),
          filename: document.originalFilename || document.filename,
          numPages: document.numPages || 1,
          cloudinaryPdfUrl: document.cloudinaryPdfUrl,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching signature request:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}