// app/api/signature/[signatureId]/remind/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { sendSignatureReminderEmail } from "@/lib/emailService";
import { verifyUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    // ✅ Verify user owns this signature request
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { signatureId } = await params;
    const db = await dbPromise;

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // ✅ Verify user owns this request
    if (signatureRequest.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    if (signatureRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, message: "Document already signed" },
        { status: 400 }
      );
    }

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // Get sender name
    const userDoc = await db.collection('users').findOne({ 
      _id: new ObjectId(user.id) 
    });
    const senderName = userDoc?.profile?.fullName || user.email;

    await sendSignatureReminderEmail({
      recipientEmail: signatureRequest.recipient.email,
      recipientName: signatureRequest.recipient.name,
      documentName: document.filename,
      signingLink: `${request.nextUrl.origin}/sign/${signatureId}`,
      senderName: senderName,
    });

    await db.collection("signature_reminders").insertOne({
      signatureId: signatureId,
      recipientEmail: signatureRequest.recipient.email,
      sentBy: user.id,
      sentAt: new Date(),
    });

    console.log(`✅ Reminder sent to ${signatureRequest.recipient.email}`);

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${signatureRequest.recipient.email}`,
    });
  } catch (error) {
    console.error("❌ Error sending reminder:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
