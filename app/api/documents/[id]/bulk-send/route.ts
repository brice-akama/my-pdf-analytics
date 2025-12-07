import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyUserFromRequest } from "@/lib/auth";
import { sendSignatureRequestEmail } from "@/lib/emailService";

interface BulkRecipient {
  name: string;
  email: string;
  customFields: Record<string, string>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ✅ Verify user authentication
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await dbPromise;
    const { recipients, message, expirationDays } = await request.json();

    // ✅ Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, message: "No recipients provided" },
        { status: 400 }
      );
    }

    if (recipients.length > 1000) {
      return NextResponse.json(
        { success: false, message: "Maximum 1000 recipients per bulk send" },
        { status: 400 }
      );
    }

    // ✅ Verify document ownership
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(id),
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // ✅ Verify document is a template
    if (!document.isTemplate) {
      return NextResponse.json(
        {
          success: false,
          message: "Document must be a template to use bulk send",
        },
        { status: 400 }
      );
    }

    // ✅ Get user details
    const userDoc = await db.collection("users").findOne({
      _id: new ObjectId(user.id),
    });
    const ownerName =
      userDoc?.profile?.fullName || userDoc?.email || user.email;

    // ✅ Calculate expiration date
    let expiresAt = null;
    if (expirationDays && expirationDays !== "never") {
      const days = parseInt(expirationDays.toString());
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    // ✅ Generate unique batch ID
    const batchId = `bulk_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const batchTimestamp = new Date();

    console.log(
      `📤 Starting bulk send: ${batchId} for ${recipients.length} recipients`
    );

    // ✅ Create bulk send record
    const bulkSendRecord = {
      batchId,
      documentId: id,
      ownerId: user.id,
      ownerEmail: user.email,
      ownerName,
      totalRecipients: recipients.length,
      status: "processing",
      sentCount: 0,
      failedCount: 0,
      pendingCount: recipients.length,
      failedRecipients: [],
      message: message || "",
      expiresAt,
      createdAt: batchTimestamp,
      updatedAt: batchTimestamp,
      completedAt: null,
    };

    await db.collection("bulk_sends").insertOne(bulkSendRecord);

    // ✅ Process recipients in batches (async)
    processRecipientsAsync(
      db,
      batchId,
      id,
      user.id,
      user.email,
      ownerName,
      document,
      recipients,
      message,
      expiresAt,
      batchTimestamp,
      request.nextUrl.origin
    );

    return NextResponse.json({
      success: true,
      message: "Bulk send initiated successfully",
      batchId,
      totalRecipients: recipients.length,
    });
  } catch (error) {
    console.error("❌ Bulk send initiation error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Async function to process recipients without blocking the response
async function processRecipientsAsync(
  db: any,
  batchId: string,
  documentId: string,
  ownerId: string,
  ownerEmail: string,
  ownerName: string,
  document: any,
  recipients: BulkRecipient[],
  message: string,
  expiresAt: Date | null,
  batchTimestamp: Date,
  origin: string
) {
  let sentCount = 0;
  let failedCount = 0;
  const failedRecipients: Array<{
    email: string;
    name: string;
    error: string;
  }> = [];

  // ✅ Process in batches of 10 to avoid overwhelming the server
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const promises = batch.map((recipient, batchIndex) =>
      processSingleRecipient(
        db,
        batchId,
        documentId,
        ownerId,
        ownerEmail,
        ownerName,
        document,
        recipient,
        i + batchIndex,
        message,
        expiresAt,
        batchTimestamp,
        origin
      )
    );

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.success) {
        sentCount++;
      } else {
        failedCount++;
        const recipient = batch[index];
        failedRecipients.push({
          email: recipient.email,
          name: recipient.name,
          error:
            result.status === "rejected"
              ? result.reason?.message || "Unknown error"
              : result.value?.error || "Failed to send",
        });
      }
    });

    // ✅ Update bulk send progress
    await db.collection("bulk_sends").updateOne(
      { batchId },
      {
        $set: {
          sentCount,
          failedCount,
          pendingCount: recipients.length - sentCount - failedCount,
          failedRecipients,
          updatedAt: new Date(),
          status:
            sentCount + failedCount === recipients.length
              ? "completed"
              : "processing",
          completedAt:
            sentCount + failedCount === recipients.length
              ? new Date()
              : null,
        },
      }
    );

    console.log(
      `📊 Bulk send progress: ${sentCount}/${recipients.length} sent, ${failedCount} failed`
    );

    // ✅ Small delay between batches to avoid rate limits
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `✅ Bulk send completed: ${batchId} - ${sentCount} sent, ${failedCount} failed`
  );
}

// ✅ Process a single recipient
async function processSingleRecipient(
  db: any,
  batchId: string,
  documentId: string,
  ownerId: string,
  ownerEmail: string,
  ownerName: string,
  document: any,
  recipient: BulkRecipient,
  recipientIndex: number,
  message: string,
  expiresAt: Date | null,
  batchTimestamp: Date,
  origin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // ✅ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient.email)) {
      throw new Error("Invalid email format");
    }

    // ✅ Generate unique ID for this signature request
    const uniqueId = `${batchTimestamp.getTime()}-${Math.random()
      .toString(36)
      .substr(2, 9)}-bulk-${recipientIndex}`;

    // ✅ Get signature fields from template
    const signatureFields =
      document.templateConfig?.signatureFields || [];

    // ✅ Enrich signature fields with recipient names
    const enrichedFields = signatureFields.map((field: any) => ({
      ...field,
      recipientName:
        document.templateConfig?.recipients?.[field.recipientIndex]?.name ||
        `Recipient ${field.recipientIndex + 1}`,
      recipientEmail: recipient.email,
    }));

    // ✅ Create signature request
    const signatureRequest = {
      uniqueId,
      documentId,
      ownerId,
      ownerEmail,
      recipient: {
        name: recipient.name,
        email: recipient.email,
        role: "Signer",
        customFields: recipient.customFields || {},
      },
      recipientIndex: 0, // All bulk send recipients are primary signers
      signatureFields: enrichedFields,
      viewMode: "isolated",
      signingOrder: "any",
      message: message || `Please review and sign: ${document.filename}`,
      dueDate: null,
      expiresAt,
      status: "pending",
      isBulkSend: true,
      bulkSendBatchId: batchId,
      bulkSendBatchTimestamp: batchTimestamp,
      createdAt: new Date(),
      viewedAt: null,
      signedAt: null,
      completedAt: null,
      signedFields: null,
      ipAddress: null,
    };

    // ✅ Insert signature request
    await db.collection("signature_requests").insertOne(signatureRequest);

    // ✅ Generate signing link
    const signingLink = `${origin}/sign/${uniqueId}`;

    // ✅ Send email
    await sendSignatureRequestEmail({
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      originalFilename: document.filename,
      signingLink,
      senderName: ownerName,
      message: message || `Please review and sign: ${document.filename}`,
      dueDate: undefined,
    });

    console.log(`✅ Sent to: ${recipient.email}`);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Failed to send to ${recipient.email}:`, error);
    return { success: false, error: error.message };
  }
}