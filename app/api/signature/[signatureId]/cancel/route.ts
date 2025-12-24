//app/api/signature/[signatureId]/cancel/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { sendSignatureRequestCancelledEmail } from "@/lib/emailService";
import { ObjectId } from "mongodb";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const { reason } = await request.json();

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
        { success: false, message: "You don't have permission to cancel this request" },
        { status: 403 }
      );
    }

    if (signatureRequest.status === 'cancelled') {
      return NextResponse.json(
        { success: false, message: "Request already cancelled" },
        { status: 400 }
      );
    }

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    const allRequests = await db.collection("signature_requests")
      .find({ documentId: signatureRequest.documentId })
      .toArray();

    // ⭐ CHECK: Has anyone signed?
    const hasSigned = allRequests.some(req => req.status === 'signed');
    
    // ⭐ If signed, mark as "voided" instead of "cancelled"
    const newStatus = hasSigned ? 'voided' : 'cancelled';

    // Cancel/Void ALL signature requests for this document
    await db.collection("signature_requests").updateMany(
      { documentId: signatureRequest.documentId },
      {
        $set: {
          status: newStatus,
          cancelledAt: new Date(),
          cancellationReason: reason || null,
          voidedAfterSigning: hasSigned, // ⭐ Track if voided after signing
        },
      }
    );

    console.log(`✅ ${newStatus.toUpperCase()} ${allRequests.length} signature requests`);

    // Update document status
    await db.collection("documents").updateOne(
      { _id: new ObjectId(signatureRequest.documentId) },
      {
        $set: {
          status: newStatus,
          cancelledAt: new Date(),
        },
      }
    );

    // Send emails to ALL recipients (including those who signed)
    const emailPromises = allRequests.map(req =>
      sendSignatureRequestCancelledEmail({
        recipientEmail: req.recipient.email,
        recipientName: req.recipient.name,
        originalFilename: document?.originalFilename || 'Document',
        ownerName: user.email,
        reason: reason || 'No reason provided',
        wasVoided: hasSigned, //   Pass this to email template
      }).catch(err => {
        console.error('Failed to send cancellation email:', err);
        return null;
      })
    );

    await Promise.all(emailPromises);
    console.log('✅ Cancellation emails sent');

    return NextResponse.json({
      success: true,
      message: hasSigned 
        ? "Document voided successfully (some signatures were already collected)"
        : "Signature request cancelled successfully",
      status: newStatus,
      cancelledCount: allRequests.length,
    });

  } catch (error) {
    console.error("❌ Error cancelling signature request:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}