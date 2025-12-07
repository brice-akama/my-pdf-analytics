import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyUserFromRequest } from "@/lib/auth";
import { sendSignatureRequestEmail } from "@/lib/emailService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    // ✅ Verify user authentication
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await dbPromise;

    // ✅ Get bulk send record
    const bulkSend = await db.collection("bulk_sends").findOne({
      batchId,
      ownerId: user.id,
    });

    if (!bulkSend) {
      return NextResponse.json(
        { success: false, message: "Bulk send not found" },
        { status: 404 }
      );
    }

    if (!bulkSend.failedRecipients || bulkSend.failedRecipients.length === 0) {
      return NextResponse.json(
        { success: false, message: "No failed recipients to retry" },
        { status: 400 }
      );
    }

    // ✅ Get document
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(bulkSend.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // ✅ Get user details
    const userDoc = await db.collection("users").findOne({
      _id: new ObjectId(user.id),
    });
    const ownerName =
      userDoc?.profile?.fullName || userDoc?.email || user.email;

    console.log(
      `🔄 Retrying ${bulkSend.failedRecipients.length} failed recipients for batch: ${batchId}`
    );

    let retriedCount = 0;
    let stillFailedCount = 0;
    const stillFailedRecipients: Array<{
      email: string;
      name: string;
      error: string;
    }> = [];

    // ✅ Retry each failed recipient
    for (const failedRecipient of bulkSend.failedRecipients) {
      try {
        // ✅ Find existing signature request
        const existingRequest = await db
          .collection("signature_requests")
          .findOne({
            bulkSendBatchId: batchId,
            "recipient.email": failedRecipient.email,
          });

        let signingLink: string;

        if (existingRequest) {
          // ✅ Use existing signature request
          signingLink = `${request.nextUrl.origin}/sign/${existingRequest.uniqueId}`;
        } else {
          // ✅ Create new signature request
          const uniqueId = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}-retry`;

          const signatureRequest = {
            uniqueId,
            documentId: bulkSend.documentId,
            ownerId: user.id,
            ownerEmail: user.email,
            recipient: {
              name: failedRecipient.name,
              email: failedRecipient.email,
              role: "Signer",
              customFields: {},
            },
            recipientIndex: 0,
            signatureFields: document.templateConfig?.signatureFields || [],
            viewMode: "isolated",
            signingOrder: "any",
            message: bulkSend.message || "",
            dueDate: null,
            expiresAt: bulkSend.expiresAt,
            status: "pending",
            isBulkSend: true,
            bulkSendBatchId: batchId,
            bulkSendBatchTimestamp: bulkSend.createdAt,
            createdAt: new Date(),
            viewedAt: null,
            signedAt: null,
            completedAt: null,
            signedFields: null,
            ipAddress: null,
          };

          await db
            .collection("signature_requests")
            .insertOne(signatureRequest);
          signingLink = `${request.nextUrl.origin}/sign/${uniqueId}`;
        }

        // ✅ Resend email
        await sendSignatureRequestEmail({
          recipientName: failedRecipient.name,
          recipientEmail: failedRecipient.email,
         originalFilename: document.filename,
          signingLink,
          senderName: ownerName,
          message: bulkSend.message || "",
          dueDate: undefined,
        });

        retriedCount++;
        console.log(`✅ Retry successful: ${failedRecipient.email}`);
      } catch (error: any) {
        stillFailedCount++;
        stillFailedRecipients.push({
          email: failedRecipient.email,
          name: failedRecipient.name,
          error: error.message || "Retry failed",
        });
        console.error(`❌ Retry failed for ${failedRecipient.email}:`, error);
      }
    }

    // ✅ Update bulk send record
    await db.collection("bulk_sends").updateOne(
      { batchId },
      {
        $set: {
          sentCount: bulkSend.sentCount + retriedCount,
          failedCount: stillFailedCount,
          failedRecipients: stillFailedRecipients,
          updatedAt: new Date(),
        },
      }
    );

    console.log(
      `✅ Retry completed: ${retriedCount} succeeded, ${stillFailedCount} still failed`
    );

    return NextResponse.json({
      success: true,
      message: `Retry completed: ${retriedCount} succeeded, ${stillFailedCount} still failed`,
      retriedCount,
      stillFailedCount,
      remainingFailures: stillFailedRecipients,
    });
  } catch (error) {
    console.error("❌ Retry error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}