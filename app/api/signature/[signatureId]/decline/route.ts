// app/api/signature/[signatureId]/decline/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { sendSignatureDeclinedNotification } from "@/lib/emailService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const { reason, ipAddress } = await request.json();
    
    console.log('🚫 Processing decline for:', signatureId);
    
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: "Please provide a reason (at least 10 characters)" },
        { status: 400 }
      );
    }

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

    // Check if already declined or signed
    if (signatureRequest.status === 'declined') {
      return NextResponse.json(
        { success: false, message: "Document already declined" },
        { status: 400 }
      );
    }

    if (signatureRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, message: "Document already signed" },
        { status: 400 }
      );
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

    const now = new Date();

    // ⭐ Update THIS signature request to declined
    await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId },
      {
        $set: {
          status: "declined",
          declinedAt: now,
          declineReason: reason.trim(),
          ipAddress: ipAddress || null,
        },
      }
    );

    console.log('✅ Signature request marked as declined');

    // ⭐ Update ALL other signature requests for this document to "cancelled"
    const cancelReason = `${signatureRequest.recipient.name} declined to sign. Reason: ${reason.trim()}`;
    console.log('📝 Setting cancellation reason for other requests:', cancelReason);
    
    const updateResult = await db.collection("signature_requests").updateMany(
      { 
        documentId: signatureRequest.documentId,
        uniqueId: { $ne: signatureId },
        status: { $in: ['pending', 'awaiting_turn'] } // Only update pending ones
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: now,
          cancellationReason: cancelReason,
        },
      }
    );

    console.log('✅ Updated', updateResult.modifiedCount, 'signature requests with reason');

    console.log('✅ Other signature requests cancelled');

    // ⭐ Update document status to declined
    await db.collection("documents").updateOne(
      { _id: new ObjectId(signatureRequest.documentId) },
      {
        $set: {
          status: "declined",
          declinedAt: now,
          declinedBy: signatureRequest.recipient.name,
          declineReason: reason.trim(),
        },
      }
    );

    console.log('✅ Document status updated to declined');

    // ⭐ Get all recipients for notifications
    const allRequests = await db.collection("signature_requests")
      .find({ documentId: signatureRequest.documentId })
      .toArray();

    // ⭐ Send email to document owner
    if (signatureRequest.ownerEmail) {
      try {
        await sendSignatureDeclinedNotification({
          ownerEmail: signatureRequest.ownerEmail,
          ownerName: 'Document Owner',
          declinerName: signatureRequest.recipient.name,
          declinerEmail: signatureRequest.recipient.email,
          documentName: document.filename,
          reason: reason.trim(),
          statusLink: `${request.nextUrl.origin}/dashboard`,
        });
        console.log('✅ Owner notified of decline');
      } catch (err) {
        console.error('❌ Failed to notify owner:', err);
      }
    }

    // ⭐ Notify other recipients that document was declined
    const otherRecipients = allRequests.filter(
      req => req.uniqueId !== signatureId && 
      req.status !== 'signed' &&
      req.recipient.email !== signatureRequest.ownerEmail
    );

    const notificationPromises = otherRecipients.map(async (req) => {
      try {
        await sendSignatureDeclinedNotification({
          ownerEmail: req.recipient.email,
          ownerName: req.recipient.name,
          declinerName: signatureRequest.recipient.name,
          declinerEmail: signatureRequest.recipient.email,
          documentName: document.filename,
          reason: reason.trim(),
          statusLink: `${request.nextUrl.origin}/dashboard`,
        });
      } catch (err) {
        console.error(`❌ Failed to notify ${req.recipient.email}:`, err);
      }
    });

    await Promise.all(notificationPromises);
    console.log('✅ All parties notified');

    return NextResponse.json({
      success: true,
      message: "Document declined successfully. All parties have been notified.",
    });

  } catch (error) {
    console.error("❌ Error declining document:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}