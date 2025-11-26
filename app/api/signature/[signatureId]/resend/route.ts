import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { sendSignatureReminderEmail } from  "@/lib/emailService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    
    console.log('🔄 Resending signature request:', signatureId);
    
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

    if (signatureRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, message: "Document already signed" },
        { status: 400 }
      );
    }

    // Get document
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // Calculate days left if due date exists
    let daysLeft = null;
    if (signatureRequest.dueDate) {
      const now = new Date();
      const dueDate = new Date(signatureRequest.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Send reminder email
    await sendSignatureReminderEmail({
      recipientName: signatureRequest.recipient.name,
      recipientEmail: signatureRequest.recipient.email,
      documentName: document.filename,
      signingLink: `${request.nextUrl.origin}/sign/${signatureId}`,
      senderName: 'Document Owner', // Get from owner's profile
      daysLeft: daysLeft !== null && daysLeft > 0 ? daysLeft : undefined,
    });

    console.log('✅ Reminder email sent to:', signatureRequest.recipient.email);

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${signatureRequest.recipient.email}`,
    });
  } catch (error) {
    console.error("❌ Error resending signature request:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}