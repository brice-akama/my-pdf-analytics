import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { sendSignatureRequestEmail } from "@/lib/emailService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    // Get the completed signature request
    const completedRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!completedRequest || !completedRequest.hasMultipleSigners) {
      return NextResponse.json({ success: true, message: "No routing needed" });
    }

    // Find next signer who is awaiting their turn
    const nextSigner = await db.collection("signature_requests").findOne({
      relatedToPrimaryRequest: signatureId,
      status: "awaiting_turn",
    });

    if (nextSigner) {
      // Activate next signer
      await db.collection("signature_requests").updateOne(
        { uniqueId: nextSigner.uniqueId },
        { 
          $set: { 
            status: "pending",
            notifiedAt: new Date()
          } 
        }
      );

      // Send email to next signer
      const signingLink = `${request.nextUrl.origin}/sign/${nextSigner.uniqueId}`;
      await sendSignatureRequestEmail({
        recipientName: nextSigner.recipient.name,
        recipientEmail: nextSigner.recipient.email,
        originalFilename: completedRequest.document?.filename || "Document",
        signingLink,
        senderName: completedRequest.ownerName,
        message: `${completedRequest.recipient.name} has signed. It's now your turn.`,
      });

      console.log(`✅ Notified next signer: ${nextSigner.recipient.email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Routing error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}