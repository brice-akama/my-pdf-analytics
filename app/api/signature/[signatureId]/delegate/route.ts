//app/api/signature/[signatureId]/delegate/route.ts
import { NextRequest, NextResponse } from "next/server";
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
    const { delegateName, delegateEmail, reason } = body;

    if (!delegateName || !delegateEmail) {
      return NextResponse.json(
        { success: false, message: "Delegate name and email are required" },
        { status: 400 }
      );
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

    if (signatureRequest.status === 'completed' || signatureRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, message: "Cannot delegate - document already signed" },
        { status: 400 }
      );
    }

    if (signatureRequest.status === 'declined') {
      return NextResponse.json(
        { success: false, message: "Cannot delegate - document was declined" },
        { status: 400 }
      );
    }

    const originalEmail = signatureRequest.recipientEmail;
    const originalName = signatureRequest.recipient?.name || signatureRequest.recipientName;

    // ⭐ STEP 1: Cancel any previous delegations in the chain
    const cancelPreviousDelegations = async (currentUniqueId: string) => {
      const current = await db.collection("signature_requests").findOne({
        uniqueId: currentUniqueId
      });
      
      if (!current) return;
      
      if (current.delegatedTo) {
        console.log(`🔄 Cancelling previous delegation: ${current.delegatedTo}`);
        
        await db.collection("signature_requests").updateOne(
          { uniqueId: current.delegatedTo },
          {
            $set: {
              status: 'cancelled',
              cancellationReason: `Re-delegated to ${delegateName} (${delegateEmail})`,
              cancelledAt: new Date(),
            }
          }
        );
        
        await cancelPreviousDelegations(current.delegatedTo);
      }
    };

    await cancelPreviousDelegations(signatureId);

    // ⭐ STEP 2: Create NEW signature request for delegate with NEW uniqueId
    const newUniqueId = uuidv4();
    
    const delegateRequest = {
      ...signatureRequest,
      _id: undefined,
      uniqueId: newUniqueId, // ⭐ NEW LINK
      recipientEmail: delegateEmail,
      recipientName: delegateName,
      recipient: {
        name: delegateName,
        email: delegateEmail,
        index: signatureRequest.recipientIndex,
      },
      status: 'pending',
      isDelegated: true,
      delegatedFrom: signatureId,
      originalSigner: {
        name: originalName,
        email: originalEmail,
        delegatedAt: new Date(),
        reason: reason || 'Not specified',
      },
      createdAt: new Date(),
      viewedAt: null,
      signedAt: null,
      signedFields: null,
    };

    await db.collection("signature_requests").insertOne(delegateRequest);

    // ⭐ STEP 3: Mark original request as 'delegated' (view-only)
    await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId },
      {
        $set: {
          status: 'delegated', // ⭐ NEW STATUS
          delegatedTo: newUniqueId,
          delegatedToName: delegateName,
          delegatedToEmail: delegateEmail,
          delegationReason: reason || 'Not specified',
          delegatedAt: new Date(),
        }
      }
    );

    // Get document info
    const document = await db.collection("documents").findOne({
      _id: signatureRequest.documentId,
    });

    // ⭐ STEP 4: Send email to delegate with NEW link
    const newSigningLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/sign/${newUniqueId}`;
    
    try {
      await sendEmail({
        to: delegateEmail,
        subject: `Delegated Signature Request: ${document?.filename || 'Document'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Delegated Signature Request</h2>
            <p>Hi ${delegateName},</p>
            <p><strong>${originalName}</strong> has delegated the signing authority for the following document to you:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">${document?.filename || 'Document'}</p>
            </div>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>You are now authorized to sign this document on behalf of <strong>${originalName}</strong>.</p>
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
      console.error('Failed to send delegation email:', emailError);
    }

    // ⭐ STEP 5: Notify original signer
    try {
      await sendEmail({
        to: originalEmail,
        subject: `You Delegated Signing: ${document?.filename || 'Document'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Signing Authority Delegated</h2>
            <p>Hi ${originalName},</p>
            <p>You have successfully delegated your signing authority for <strong>${document?.filename || 'Document'}</strong> to:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>${delegateName}</strong></p>
              <p style="margin: 0; color: #6b7280;">${delegateEmail}</p>
            </div>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p style="background: #dbeafe; padding: 10px; border-left: 4px solid #3b82f6;">
              ℹ️ You can still view the document at your original link, but you cannot sign it.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to notify original signer:', emailError);
    }

    // ⭐ STEP 6: Notify document owner
    try {
      const owner = await db.collection("users").findOne({ id: signatureRequest.ownerId });
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: `Signature Delegated: ${document?.filename || 'Document'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">Signature Authority Delegated</h2>
              <p>Hi,</p>
              <p><strong>${originalName}</strong> (${originalEmail}) has delegated their signing authority for <strong>${document?.filename || 'Document'}</strong> to:</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>${delegateName}</strong></p>
                <p style="margin: 0; color: #6b7280;">${delegateEmail}</p>
              </div>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              <p>The delegate has been notified and can now sign on behalf of the original recipient.</p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error('Failed to notify owner:', emailError);
    }

    console.log(`✅ Created NEW delegation request: ${newUniqueId}`);
    console.log(`✅ Original link (${signatureId}): VIEW-ONLY (delegated)`);

    return NextResponse.json({
      success: true,
      message: "Signature successfully delegated",
      newUniqueId: newUniqueId, // ⭐ Return NEW ID
      oldUniqueId: signatureId,
      delegate: {
        name: delegateName,
        email: delegateEmail,
      }
    });

  } catch (error) {
    console.error("❌ Error delegating signature:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}