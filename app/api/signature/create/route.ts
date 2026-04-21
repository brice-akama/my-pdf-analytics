// app/api/signature/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { ObjectId, Db } from "mongodb";
import { sendCCNotificationEmail, sendSignatureRequestEmail } from "@/lib/emailService";
import { verifyUserFromRequest } from '@/lib/auth';
import { hashAccessCode } from "@/lib/accessCodeConfig";
import { checkAccess } from '@/lib/checkAccess'
import { getPlanLimits } from '@/lib/planLimits'

// ─── Helper: save recipients to contacts collection ───────────────────────────
//
// Called after a successful signature send.
// Uses upsert so existing contacts are updated (name refreshed) but not duplicated.
//
async function saveRecipientsAsContacts(
  db: Db,
  userId: string,
  recipients: Array<{ name: string; email: string; role?: string }>,
  ccRecipients?: Array<{ name: string; email: string }>,
) {
  const now = new Date();
  const allPeople = [
    ...recipients.map((r) => ({ name: r.name, email: r.email })),
    ...(ccRecipients || []).map((c) => ({ name: c.name, email: c.email })),
  ];

  const ops = allPeople
    .filter((p) => p.email && p.email.trim())
    .map((p) => ({
      updateOne: {
        filter: {
          userId,
          email: p.email.toLowerCase().trim(),
        },
        update: {
          $set: {
            email:          p.email.toLowerCase().trim(),
            userId,
            updatedAt:      now,
            // Only overwrite name if we actually have one
            ...(p.name?.trim() ? { name: p.name.trim() } : {}),
          },
          $setOnInsert: {
            createdAt:  now,
            source:     'signature_request',
          },
          // Increment times sent to — useful for sorting suggestions later
          $inc: { signatureCount: 1 },
        },
        upsert: true,
      },
    }));

  if (ops.length === 0) return;

  try {
    const result = await db.collection('contacts').bulkWrite(ops, { ordered: false });
    console.log(
      `📇 [contacts] Saved ${ops.length} recipient(s) — ` +
      `${result.upsertedCount} new, ${result.modifiedCount} updated`
    );
  } catch (err) {
    // Never let contact saving break the signature flow
    console.warn('⚠️ [contacts] bulkWrite failed (non-fatal):', err);
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
   // ── Step 1: Authenticate and get effective plan ───────────────────────────
const access = await checkAccess(request)
if (!access.ok) return access.response

const { user, plan, limits } = access

    const {
      documentId, recipients, signatureFields, message, dueDate,
      viewMode, signingOrder, expirationDays, ccRecipients,
      accessCodeRequired, accessCodeType, accessCodeHint,
      scheduledSendDate, accessCode, spaceId, intentVideoRequired,
    } = await request.json();

    const db = await dbPromise;

    // ── Step 2: Enforce monthly eSignature limit ──────────────────────────────
// Count how many signature requests this user has sent this calendar month.
// -1 means unlimited (Pro/Business). Free = 2, Starter = 10.
// We count by createdAt within the current month so the limit resets
// automatically on the 1st of each month without any cron job needed.
if (limits.maxESignaturesPerMonth !== -1) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const usedThisMonth = await db.collection('signature_requests').countDocuments({
    ownerId: user._id.toString(),
    createdAt: { $gte: startOfMonth },
  })

  // Each send creates one request per recipient — check if adding
  // this batch would push them over the limit
  const incomingCount = recipients?.length || 1
  
  if (usedThisMonth + incomingCount > limits.maxESignaturesPerMonth) {
    const remaining = Math.max(0, limits.maxESignaturesPerMonth - usedThisMonth)
    return NextResponse.json(
      {
        success: false,
        message: `You have used ${usedThisMonth} of your ${limits.maxESignaturesPerMonth} eSignatures this month. You have ${remaining} remaining. Upgrade your plan for more.`,
        code: 'ESIGNATURE_LIMIT_REACHED',
        used: usedThisMonth,
        limit: limits.maxESignaturesPerMonth,
        remaining,
        plan,
      },
      { status: 403 }
    )
  }
}

     const ownerId    = user._id.toString();
    const ownerEmail = user.email;

    const userDoc = await db.collection('users').findOne({
      _id: new ObjectId(ownerId),
    });
    const ownerName = userDoc?.profile?.fullName || userDoc?.email || user.email;

    // Hash access code if provided
    let accessCodeHash = null;
    if (accessCodeRequired && accessCode) {
      accessCodeHash = await hashAccessCode(accessCode);
      console.log(`🔒 Access code hashed for document ${documentId}`);
    }

    // Verify document belongs to user
      
const document = await db.collection("documents").findOne({
  _id: new ObjectId(documentId),
})

if (!document) {
  return NextResponse.json(
    { success: false, message: "Document not found" },
    { status: 404 }
  )
}

// Then check ownership separately — gives Team a clear message
if (document.userId !== ownerId) {
  return NextResponse.json(
    { 
      success: false, 
      message: "Only the document owner can perform this action",
      code: "NOT_OWNER"
    },
    { status: 403 }
  )
}

    const signatureRequests = [];
const emailPromises    = [];
const ccRecipientLinks = [];
const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const uniqueId  = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;

      const now           = new Date();
      const scheduledDate = scheduledSendDate ? new Date(scheduledSendDate) : null;
      const shouldSendNow = !scheduledDate || scheduledDate <= now;

      let expiresAt = null;
      if (expirationDays && expirationDays !== 'never') {
        const days = parseInt(expirationDays);
        expiresAt  = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      const initialStatus = signingOrder === 'sequential'
        ? (i === 0 ? 'pending' : 'awaiting_turn')
        : 'pending';

      const enrichedSignatureFields = viewMode === 'shared'
        ? signatureFields.map((f: any) => ({
            ...f,
            recipientName:  recipients[f.recipientIndex]?.name  || `Recipient ${f.recipientIndex + 1}`,
            recipientEmail: recipients[f.recipientIndex]?.email || '',
          }))
        : signatureFields
            .filter((f: any) => f.recipientIndex === i)
            .map((f: any) => ({
              ...f,
              recipientName:  recipients[f.recipientIndex]?.name  || `Recipient ${f.recipientIndex + 1}`,
              recipientEmail: recipients[f.recipientIndex]?.email || '',
            }));

      const signatureRequest = {
        uniqueId,
        documentId,
        spaceId:      spaceId || null,
        batchId,
        ownerId,
        ownerEmail,
        recipient: {
          name:  recipient.name,
          email: recipient.email,
          role:  recipient.role || '',
        },
        recipientIndex:   i,
        signingOrder:     signingOrder || 'any',
        expirationDays:   expirationDays || '30',
        signatureFields:  enrichedSignatureFields,
        viewMode:         viewMode || 'isolated',
        message:          message || '',
        dueDate:          dueDate || null,
        expiresAt,
        status:           initialStatus,
        createdAt:        new Date(),
        viewedAt:         null,
        signedAt:         null,
        completedAt:      null,
        signedFields:     null,
        ipAddress:        null,
        accessCodeRequired:      accessCodeRequired || false,
        accessCodeHash,
        accessCodeType,
        accessCodeHint,
        accessCodeFailedAttempts: 0,
        accessCodeLockoutUntil:   null,
        selfieVerificationRequired: accessCodeRequired || false,
        scheduledSendDate: scheduledDate,
        sendStatus:        shouldSendNow ? 'sent'      : 'scheduled',
        sendAt:            shouldSendNow ? new Date()  : null,
        notifiedAt:        shouldSendNow ? new Date()  : null,
        intentVideoRequired:  intentVideoRequired || false,
        intentVideoUrl:       null,
        intentVideoRecordedAt: null,
      };

      const result = await db.collection("signature_requests").insertOne(signatureRequest);
      const signingLink = `${request.nextUrl.origin}/sign/${uniqueId}`;

      signatureRequests.push({
        id:        result.insertedId,
        uniqueId,
        recipient: recipient.name,
        email:     recipient.email,
        link:      signingLink,
        status:    initialStatus,
      });

      if (!shouldSendNow) {
        console.log(`📅 Email scheduled for ${recipient.email} at ${scheduledDate}`);
        continue;
      }

      if (signingOrder === 'sequential' && i > 0) {
        console.log(`⏳ Skipping email for ${recipient.email} - awaiting turn`);
        continue;
      }

      emailPromises.push(
        sendSignatureRequestEmail({
          recipientName:    recipient.name,
          recipientEmail:   recipient.email,
          originalFilename: document.originalFilename,
          signingLink,
          senderName:       ownerName,
          message,
          dueDate,
        }).catch((err) => {
          console.error(`❌ Failed to send email to ${recipient.email}:`, err);
          return null;
        })
      );
    }

    // ── CC recipients ──────────────────────────────────────────────────────
    if (ccRecipients && ccRecipients.length > 0) {
      console.log('📧 Processing', ccRecipients.length, 'CC recipients');

      for (let j = 0; j < ccRecipients.length; j++) {
        const cc         = ccRecipients[j];
        const ccUniqueId = `cc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${j}`;

        const ccRecord = {
          uniqueId:   ccUniqueId,
          documentId,
          ownerId,
          batchId,   
          ownerEmail,
          name:       cc.name,
          email:      cc.email,
          notifyWhen: cc.notifyWhen,
          type:       'cc_recipient',
          status:     'active',
          createdAt:  new Date(),
          notifiedAt: cc.notifyWhen === 'immediately' ? new Date() : null,
        };

        await db.collection("cc_recipients").insertOne(ccRecord);

        const ccViewLink = `${request.nextUrl.origin}/cc/${ccUniqueId}?email=${cc.email}`;

        ccRecipientLinks.push({
          name:       cc.name,
          email:      cc.email,
          uniqueId:   ccUniqueId,
          link:       ccViewLink,
          notifyWhen: cc.notifyWhen,
        });

        if (cc.notifyWhen === 'immediately') {
          await sendCCNotificationEmail({
            ccName:       cc.name,
            ccEmail:      cc.email,
            documentName: document.filename,
            senderName:   ownerName,
            viewLink:     ccViewLink,
          }).catch((err) => console.error(`Failed to send CC to ${cc.email}:`, err));
        }
      }

      console.log('✅ CC recipients processed:', ccRecipientLinks.length);
    }

    console.log('📧 Sending', emailPromises.length, 'emails...');
    await Promise.all(emailPromises);
    console.log('✅ All emails sent');

    // ── Update document status ─────────────────────────────────────────────
    await db.collection("documents").updateOne(
      { _id: new ObjectId(documentId) },
      {
        $set: {
          status:               'pending_signature',
          sentForSignature:     true,
          sentAt:               new Date(),
          totalRecipients:      recipients.length,
          signedCount:          0,
          scheduledSendDate:    scheduledSendDate ? new Date(scheduledSendDate) : null,
          signatureRequestId:   signatureRequests[0].id.toString(),
          signatureStatus:      'pending',
        },
      }
    );

    // ── Delete draft ───────────────────────────────────────────────────────
    try {
      await db.collection('signature_request_drafts').deleteOne({
        documentId: new ObjectId(documentId),
        userId:     ownerId,
      });
      console.log(`🗑️ Draft deleted for document ${documentId} after sending`);
    } catch (err) {
      console.warn('⚠️ Failed to delete draft after send:', err);
    }

    // ── ⭐ Save recipients & CC to contacts collection ─────────────────────
    //
    // Runs AFTER everything else so it never blocks or breaks the send flow.
    // Fire-and-forget — we await it but errors are swallowed inside the helper.
    //
    await saveRecipientsAsContacts(db, ownerId, recipients, ccRecipients);

    return NextResponse.json({
      success:        true,
      signatureRequests,
      ccRecipients:   ccRecipientLinks,
      message:        `Signature requests created and sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error("❌ Error creating signature requests:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}