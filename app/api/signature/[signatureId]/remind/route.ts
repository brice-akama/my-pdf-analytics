// app/api/signature/[signatureId]/remind/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
 
  import { sendSignatureReminderEmail } from "@/lib/emailService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    // Get signature request
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // Check if already signed
    if (signatureRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, message: "Document already signed" },
        { status: 400 }
      );
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

    // Send reminder email
    
    
    await sendSignatureReminderEmail({
      recipientEmail: signatureRequest.recipient.email,
      recipientName: signatureRequest.recipient.name,
      documentName: document.filename,
      signingLink: `${request.nextUrl.origin}/sign/${signatureId}`,
      senderName: 'Document Owner', // Get from user session if available
    });
     

    // Log the reminder
    await db.collection("signature_reminders").insertOne({
      signatureId: signatureId,
      recipientEmail: signatureRequest.recipient.email,
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