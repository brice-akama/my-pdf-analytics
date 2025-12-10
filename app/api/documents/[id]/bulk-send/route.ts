import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyUserFromRequest } from "@/lib/auth";
import { sendSignatureRequestEmail } from "@/lib/emailService";

interface BulkRecipient {
  name: string;
  email: string;
  customFields: Record<string, string>;
  group?: string; // Optional group identifier
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await dbPromise;
    const { 
      recipients, 
      message, 
      expirationDays, 
      additionalSigners = [],   
      hasMultipleSigners = false 
    } = await request.json();

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

    if (!document.isTemplate) {
      return NextResponse.json(
        {
          success: false,
          message: "Document must be a template to use bulk send",
        },
        { status: 400 }
      );
    }

    const userDoc = await db.collection("users").findOne({
      _id: new ObjectId(user.id),
    });
    const ownerName = userDoc?.profile?.fullName || userDoc?.email || user.email;

    let expiresAt = null;
    if (expirationDays && expirationDays !== "never") {
      const days = parseInt(expirationDays.toString());
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    const batchId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batchTimestamp = new Date();

    // ✅ DETECT MODE: Grouped or Individual
    const hasGroups = recipients.some(r => r.group);
    
    let recipientGroups: Map<string, BulkRecipient[]>;
    let totalDocuments: number;

    if (hasGroups) {
      // GROUP MODE: Group recipients by 'group' field
      recipientGroups = new Map();
      recipients.forEach(recipient => {
        const groupKey = recipient.group || 'default';
        if (!recipientGroups.has(groupKey)) {
          recipientGroups.set(groupKey, []);
        }
        recipientGroups.get(groupKey)!.push(recipient);
      });
      totalDocuments = recipientGroups.size;
      console.log(`📤 GROUP MODE: ${totalDocuments} groups, ${recipients.length} total recipients`);
    } else {
      // INDIVIDUAL MODE: Each person gets their own document
      recipientGroups = new Map();
      recipients.forEach((recipient, index) => {
        recipientGroups.set(`individual_${index}`, [recipient]);
      });
      totalDocuments = recipients.length;
      console.log(`📤 INDIVIDUAL MODE: ${totalDocuments} individual documents`);
    }

    const bulkSendRecord = {
      batchId,
      documentId: id,
      ownerId: user.id,
      ownerEmail: user.email,
      ownerName,
      totalRecipients: recipients.length,
      totalDocuments,
      mode: hasGroups ? "grouped" : "individual",
      status: "processing",
      sentCount: 0,
      failedCount: 0,
      pendingCount: totalDocuments,
      failedRecipients: [],
      message: message || "",
      expiresAt,
      createdAt: batchTimestamp,
      updatedAt: batchTimestamp,
      completedAt: null,
    };

    await db.collection("bulk_sends").insertOne(bulkSendRecord);

    // Process groups
    processGroupsAsync(
      db,
      batchId,
      id,
      user.id,
      user.email,
      ownerName,
      document,
      recipientGroups,
      message,
      expiresAt,
      batchTimestamp,
      request.nextUrl.origin,
      additionalSigners,
      hasMultipleSigners
    );

    return NextResponse.json({
      success: true,
      message: "Bulk send initiated successfully",
      batchId,
      totalRecipients: recipients.length,
      totalDocuments,
      mode: hasGroups ? "grouped" : "individual",
    });
  } catch (error) {
    console.error("❌ Bulk send initiation error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

async function processGroupsAsync(
  db: any,
  batchId: string,
  documentId: string,
  ownerId: string,
  ownerEmail: string,
  ownerName: string,
  document: any,
  recipientGroups: Map<string, BulkRecipient[]>,
  message: string,
  expiresAt: Date | null,
  batchTimestamp: Date,
  origin: string,
  additionalSigners: Array<{name: string; email: string; role: string}>,
  hasMultipleSigners: boolean
) {
  let sentCount = 0;
  let failedCount = 0;
  const failedRecipients: Array<{ email: string; name: string; error: string; }> = [];

  let groupIndex = 0;
  for (const [groupKey, groupMembers] of recipientGroups.entries()) {
    try {
      await processGroup(
        db,
        batchId,
        documentId,
        ownerId,
        ownerEmail,
        ownerName,
        document,
        groupMembers,
        groupIndex,
        message,
        expiresAt,
        batchTimestamp,
        origin,
        additionalSigners,
        hasMultipleSigners
      );
      sentCount++;
      console.log(`✅ Group ${groupKey} processed (${groupMembers.length} signers)`);
    } catch (error: any) {
      failedCount++;
      groupMembers.forEach(member => {
        failedRecipients.push({
          email: member.email,
          name: member.name,
          error: error.message || "Failed to process group",
        });
      });
      console.error(`❌ Group ${groupKey} failed:`, error);
    }

    groupIndex++;

    // Update progress
    await db.collection("bulk_sends").updateOne(
      { batchId },
      {
        $set: {
          sentCount,
          failedCount,
          pendingCount: recipientGroups.size - sentCount - failedCount,
          failedRecipients,
          updatedAt: new Date(),
          status: sentCount + failedCount === recipientGroups.size ? "completed" : "processing",
          completedAt: sentCount + failedCount === recipientGroups.size ? new Date() : null,
        },
      }
    );

    // Small delay between groups
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`✅ Bulk send completed: ${batchId} - ${sentCount} groups sent, ${failedCount} failed`);
}

async function processGroup(
  db: any,
  batchId: string,
  documentId: string,
  ownerId: string,
  ownerEmail: string,
  ownerName: string,
  document: any,
  groupMembers: BulkRecipient[],
  groupIndex: number,
  message: string,
  expiresAt: Date | null,
  batchTimestamp: Date,
  origin: string,
  additionalSigners: Array<{name: string; email: string; role: string}>,
  hasMultipleSigners: boolean
): Promise<void> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Validate all emails in group
  for (const member of groupMembers) {
    if (!emailRegex.test(member.email)) {
      throw new Error(`Invalid email format: ${member.email}`);
    }
  }

  // ✅ CREATE A UNIQUE DOCUMENT COPY FOR THIS GROUP
  const groupDocumentId = `${documentId}_group_${groupIndex}_${batchTimestamp.getTime()}`;
  
  // Clone the original document for this group
  const groupDocument = {
    ...document,
    _id: new ObjectId(),
    originalTemplateId: documentId,
    isGroupCopy: true,
    groupId: `group_${batchTimestamp.getTime()}_${groupIndex}`,
    groupIndex,
    groupMembers: groupMembers.map(m => ({ name: m.name, email: m.email })),
    createdAt: new Date(),
    status: 'pending_signature',
  };
  
  await db.collection("documents").insertOne(groupDocument);
  
  console.log(`✅ Created document copy for group ${groupIndex}: ${groupDocument._id}`);

  const signatureFields = document.templateConfig?.signatureFields || [];
  const groupId = `group_${batchTimestamp.getTime()}_${groupIndex}`;

  // ✅ MAP SIGNATURE FIELDS TO GROUP MEMBERS (use only available fields)
  const fieldsToUse = Math.min(signatureFields.length, groupMembers.length);
  
  // Create signature requests for each group member
  const signatureRequests = [];
  
  for (let i = 0; i < fieldsToUse; i++) {
    const member = groupMembers[i];
    const uniqueId = `${batchTimestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}-grp${groupIndex}-mbr${i}`;
    
    // ✅ ENRICH SIGNATURE FIELDS WITH ACTUAL NAMES
    const enrichedFields = signatureFields.map((field: any, fieldIndex: number) => {
      const assignedMember = groupMembers[fieldIndex] || null;
      return {
        ...field,
        recipientName: assignedMember ? assignedMember.name : `Signer ${fieldIndex + 1}`,
        recipientEmail: assignedMember ? assignedMember.email : null,
        assignedTo: assignedMember ? assignedMember.email : null,
      };
    });
    
    const sigRequest = {
      uniqueId,
      documentId: groupDocument._id.toString(), // ✅ USE GROUP DOCUMENT ID
      originalTemplateId: documentId,
      ownerId,
      ownerEmail,
      groupId,
      recipient: {
        name: member.name,
        email: member.email,
        role: `Signer ${i + 1}`,
        customFields: member.customFields || {},
      },
      recipientIndex: i,
      signatureFields: enrichedFields, // ✅ USE ENRICHED FIELDS
      viewMode: "shared",
      signingOrder: "sequential",
      message,
      expiresAt,
      status: i === 0 ? "pending" : "awaiting_turn",
      isBulkSend: true,
      isGroupSigning: true,
      groupSize: fieldsToUse,
      bulkSendBatchId: batchId,
      bulkSendBatchTimestamp: batchTimestamp,
      createdAt: new Date(),
    };

    signatureRequests.push(sigRequest);
    await db.collection("signature_requests").insertOne(sigRequest);
  }

  // Send email to first signer only
  const firstSigner = signatureRequests[0];
  const signingLink = `${origin}/sign/${firstSigner.uniqueId}`;
  
  await sendSignatureRequestEmail({
    recipientName: firstSigner.recipient.name,
    recipientEmail: firstSigner.recipient.email,
    originalFilename: document.filename,
    signingLink,
    senderName: ownerName,
    message: message || `Please review and sign: ${document.filename}`,
    dueDate: undefined,
  });

  console.log(`✅ Group ${groupIndex}: Created ${fieldsToUse} signature requests (${groupMembers.length} members, ${signatureFields.length} fields available)`);
}