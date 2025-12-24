//app/api/signature/[signatureId]/reassign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "@/app/api/lib/mongodb";
import { sendEmail } from "@/lib/email";
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const body = await request.json();
    const { newEmail, newName, allowOriginalToView = false } = body;

    if (!newEmail || !newName) {
      return NextResponse.json(
        { success: false, message: "New recipient name and email are required" },
        { status: 400 }
      );
    }

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Get original signature request
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    if (signatureRequest.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to reassign this request" },
        { status: 403 }
      );
    }

    if (signatureRequest.status === 'completed' || signatureRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, message: "Cannot reassign - document already signed" },
        { status: 400 }
      );
    }

    //   CANCEL ALL PREVIOUS REASSIGNMENTS IN THE CHAIN
const cancelAllPreviousReassignments = async (currentUniqueId: string) => {
  const current = await db.collection("signature_requests").findOne({
    uniqueId: currentUniqueId
  });
  
  if (!current) return;
  
  // If this was reassigned to someone, cancel that person's request
  if (current.reassignedTo) {
    console.log(`🔄 Cancelling previous reassignment: ${current.reassignedTo}`);
    
    await db.collection("signature_requests").updateOne(
      { uniqueId: current.reassignedTo },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: `Document reassigned to ${newName} (${newEmail})`,
          cancelledAt: new Date(),
        }
      }
    );
    
    // Recursively cancel the next one in the chain
    await cancelAllPreviousReassignments(current.reassignedTo);
  }
};

await cancelAllPreviousReassignments(signatureId);
console.log('✅ Cancelled all previous reassignments');



    const oldEmail = signatureRequest.recipientEmail;
    const oldName = signatureRequest.recipient?.name || signatureRequest.recipientName;

    // ⭐ STEP 1: Create NEW signature request with NEW uniqueId
    const newUniqueId = uuidv4();
    
    const newSignatureRequest = {
      ...signatureRequest,
      _id: undefined, // Let MongoDB generate new _id
      uniqueId: newUniqueId, // ⭐ NEW LINK
      recipientEmail: newEmail,
      recipientName: newName,
      'recipient.name': newName,
      'recipient.email': newEmail,
      recipient: {
        name: newName,
        email: newEmail,
        index: signatureRequest.recipientIndex,
      },
      status: 'pending',
      wasReassigned: true,
      reassignedFrom: signatureId, // ⭐ Track original link
      reassignedAt: new Date(),
      reassignedBy: user.id,
      createdAt: new Date(),
      viewedAt: null,
      signedAt: null,
      signedFields: null,
    };

    await db.collection("signature_requests").insertOne(newSignatureRequest);

    // ⭐ STEP 2: Update OLD signature request based on access control
    if (allowOriginalToView) {
      // VIEW-ONLY: Keep old request but mark as view-only
      await db.collection("signature_requests").updateOne(
        { uniqueId: signatureId },
        {
          $set: {
            status: 'view_only', // ⭐ New status
            wasReassigned: true,
            reassignedTo: newUniqueId,
            reassignedToEmail: newEmail,
            reassignedToName: newName,
            allowOriginalToView: true,
            reassignedAt: new Date(),
          }
        }
      );
    } else {
      // REVOKED: Mark old request as cancelled
      await db.collection("signature_requests").updateOne(
        { uniqueId: signatureId },
        {
          $set: {
            status: 'cancelled',
            wasReassigned: true,
            reassignedTo: newUniqueId,
            reassignedToEmail: newEmail,
            reassignedToName: newName,
            allowOriginalToView: false,
            cancellationReason: `Reassigned to ${newName} (${newEmail})`,
            cancelledAt: new Date(),
            reassignedAt: new Date(),
          }
        }
      );
    }

    // Get document info for emails
    const document = await db.collection("documents").findOne({
      _id: signatureRequest.documentId,
    });

    // ⭐ STEP 3: Send email to NEW recipient with NEW link
    const newSigningLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/sign/${newUniqueId}`;
    
    try {
      await sendEmail({
        to: newEmail,
        subject: `Signature Request: ${document?.originalFilename || 'Document'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Document Signature Request</h2>
            <p>Hi ${newName},</p>
            <p>You have been assigned to sign the following document:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">${document?.originalFilename || 'Document'}</p>
            </div>
            <p>This request was reassigned to you from <strong>${oldName}</strong>.</p>
            <a href="${newSigningLink}" 
               style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Review & Sign Document
            </a>
            <p style="color: #6b7280; font-size: 14px;">
              If the button doesn't work, copy and paste this link:<br/>
              ${newSigningLink}
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send reassignment email:', emailError);
    }

    // ⭐ STEP 4: Notify old recipient
    try {
      const accessMessage = allowOriginalToView 
        ? `You can still view the document at your original link, but you cannot sign it.`
        : "Your access to this document has been revoked and your signing link is no longer valid.";
      
      await sendEmail({
        to: oldEmail,
        subject: `Signature Request Reassigned: ${document?.originalFilename || 'Document'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Signature Request Reassigned</h2>
            <p>Hi ${oldName},</p>
            <p>The signature request for <strong>${document?.originalFilename || 'Document'}</strong> has been reassigned to <strong>${newName}</strong> (${newEmail}).</p>
            <p style="background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0;">
              ${accessMessage}
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send notification to old recipient:', emailError);
    }

    console.log(`✅ Created NEW signature request: ${newUniqueId}`);
    console.log(`✅ Old link (${signatureId}): ${allowOriginalToView ? 'VIEW-ONLY' : 'CANCELLED'}`);

    return NextResponse.json({
      success: true,
      message: "Signature request reassigned successfully",
      newUniqueId: newUniqueId, // ⭐ Return NEW ID
      oldUniqueId: signatureId,
      newRecipient: {
        name: newName,
        email: newEmail,
      }
    });

  } catch (error) {
    console.error("❌ Error reassigning signature:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}