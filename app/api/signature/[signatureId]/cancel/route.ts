//app/api/signature/[signatureId]/cancel/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { sendSignatureRequestCancelledEmail } from "@/lib/emailService";
import { ObjectId } from "mongodb";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function POST(
 request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }  // ✅ Add Promise
) {
  try {
    const { signatureId } = await params;  // ✅ Add await
    // Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const { reason } = await request.json(); // Optional cancellation reason

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

    // Verify ownership
    if (signatureRequest.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to cancel this request" },
        { status: 403 }
      );
    }

    // Can't cancel if already signed
    if (signatureRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, message: "Cannot cancel - document already signed" },
        { status: 400 }
      );
    }

    // Can't cancel if already cancelled
    if (signatureRequest.status === 'cancelled') {
      return NextResponse.json(
        { success: false, message: "Request already cancelled" },
        { status: 400 }
      );
    }

    // Get document info
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    // Get all signature requests for this document
    const allRequests = await db.collection("signature_requests")
      .find({ documentId: signatureRequest.documentId })
      .toArray();

    // Cancel ALL signature requests for this document
    await db.collection("signature_requests").updateMany(
      { documentId: signatureRequest.documentId },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason || null,
        },
      }
    );

    console.log('✅ Cancelled', allRequests.length, 'signature requests');

    // Update document status
    await db.collection("documents").updateOne(
      { _id: new ObjectId(signatureRequest.documentId) },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      }
    );

    // Send cancellation emails to all pending recipients
    const emailPromises = allRequests
      .filter(req => req.status !== 'signed') // Don't email people who already signed
      .map(req =>
        sendSignatureRequestCancelledEmail({
          recipientEmail: req.recipient.email,
          recipientName: req.recipient.name,
          originalFilename: document?.originalFilename || 'Document',
          ownerName: user.email,
          reason: reason || 'No reason provided',
        }).catch(err => {
          console.error('Failed to send cancellation email:', err);
          return null;
        })
      );

    await Promise.all(emailPromises);
    console.log('✅ Cancellation emails sent');

    return NextResponse.json({
      success: true,
      message: "Signature request cancelled successfully",
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