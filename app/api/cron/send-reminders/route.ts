// app/api/cron/send-reminders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { sendSignatureReminderEmail } from "@/lib/emailService";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // ⭐ Verify cron secret (for security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let remindersSent = 0;

    // ⭐ RULE 1: Send reminder after 3 days if not signed
    const oldPendingRequests = await db.collection("signature_requests").find({
      status: 'pending',
      createdAt: { $lte: threeDaysAgo },
      $or: [
        { lastReminderSentAt: { $exists: false } },
        { lastReminderSentAt: { $lte: threeDaysAgo } }
      ]
    }).toArray();

    console.log(`📅 Found ${oldPendingRequests.length} requests pending for 3+ days`);

    for (const request of oldPendingRequests) {
      try {
        const document = await db.collection("documents").findOne({
          _id: new ObjectId(request.documentId)
        });

        if (!document) continue;

        // Get owner name
        const owner = await db.collection('users').findOne({ 
          _id: new ObjectId(request.ownerId) 
        });
        const senderName = owner?.profile?.fullName || owner?.email || request.ownerEmail;

        const signingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/sign/${request.uniqueId}`;
        
        await sendSignatureReminderEmail({
          recipientName: request.recipient.name,
          recipientEmail: request.recipient.email,
          originalFilename: document.originalFilename || document.filename,
          signingLink: signingLink,
          senderName: senderName,
        });

        // Track reminder
        await db.collection("signature_reminders").insertOne({
          signatureId: request.uniqueId,
          recipientEmail: request.recipient.email,
          sentBy: 'auto-cron',
          sentAt: now,
          reason: '3-day-auto-reminder',
        });

        await db.collection("signature_requests").updateOne(
          { _id: request._id },
          {
            $set: { lastReminderSentAt: now },
            $inc: { reminderCount: 1 }
          }
        );

        remindersSent++;
        console.log(`✅ Sent 3-day reminder to ${request.recipient.email}`);
      } catch (err) {
        console.error(`❌ Failed to send reminder:`, err);
      }
    }

    // ⭐ RULE 2: Send reminder 1 day before due date
    const dueSoonRequests = await db.collection("signature_requests").find({
      status: 'pending',
      dueDate: { 
        $exists: true,
        $ne: null,
        $gte: now.toISOString(), 
        $lte: oneDayFromNow.toISOString() 
      },
      dueDateReminderSent: { $ne: true }
    }).toArray();

    console.log(`📅 Found ${dueSoonRequests.length} requests due tomorrow`);

    for (const request of dueSoonRequests) {
      try {
        const document = await db.collection("documents").findOne({
          _id: new ObjectId(request.documentId)
        });

        if (!document) continue;

        const owner = await db.collection('users').findOne({ 
          _id: new ObjectId(request.ownerId) 
        });
        const senderName = owner?.profile?.fullName || owner?.email || request.ownerEmail;

        const signingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/sign/${request.uniqueId}`;
        
        await sendSignatureReminderEmail({
          recipientName: request.recipient.name,
          recipientEmail: request.recipient.email,
          originalFilename: document.originalFilename || document.filename,
          signingLink: signingLink,
          senderName: senderName,
        });

        await db.collection("signature_reminders").insertOne({
          signatureId: request.uniqueId,
          recipientEmail: request.recipient.email,
          sentBy: 'auto-cron',
          sentAt: now,
          reason: 'due-date-reminder',
        });

        await db.collection("signature_requests").updateOne(
          { _id: request._id },
          {
            $set: { 
              lastReminderSentAt: now,
              dueDateReminderSent: true 
            },
            $inc: { reminderCount: 1 }
          }
        );

        remindersSent++;
        console.log(`✅ Sent due-date reminder to ${request.recipient.email}`);
      } catch (err) {
        console.error(`❌ Failed to send reminder:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: remindersSent,
      message: `Sent ${remindersSent} reminder(s)`
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}