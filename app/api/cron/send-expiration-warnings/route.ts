import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../lib/mongodb";
import { sendExpirationWarningEmail } from "@/lib/emailService";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const now = new Date();
    
    // Calculate warning dates
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let warningsSent = 0;

    // ⭐ FIND REQUESTS EXPIRING IN 7 DAYS
    const expiring7Days = await db.collection("signature_requests").find({
      status: 'pending',
      expiresAt: {
        $gte: sevenDaysFromNow.toISOString(),
        $lte: new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString()
      },
      expirationWarning7Days: { $ne: true }
    }).toArray();

    console.log(`📅 Found ${expiring7Days.length} requests expiring in 7 days`);

    for (const request of expiring7Days) {
      try {
        await sendExpirationWarning(db, request, 7);
        await db.collection("signature_requests").updateOne(
          { _id: request._id },
          { $set: { expirationWarning7Days: true } }
        );
        warningsSent++;
      } catch (err) {
        console.error('Failed to send 7-day warning:', err);
      }
    }

    // ⭐ FIND REQUESTS EXPIRING IN 2 DAYS
    const expiring2Days = await db.collection("signature_requests").find({
      status: 'pending',
      expiresAt: {
        $gte: twoDaysFromNow.toISOString(),
        $lte: new Date(twoDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString()
      },
      expirationWarning2Days: { $ne: true }
    }).toArray();

    console.log(`📅 Found ${expiring2Days.length} requests expiring in 2 days`);

    for (const request of expiring2Days) {
      try {
        await sendExpirationWarning(db, request, 2);
        await db.collection("signature_requests").updateOne(
          { _id: request._id },
          { $set: { expirationWarning2Days: true } }
        );
        warningsSent++;
      } catch (err) {
        console.error('Failed to send 2-day warning:', err);
      }
    }

    // ⭐ FIND REQUESTS EXPIRING IN 1 DAY
    const expiring1Day = await db.collection("signature_requests").find({
      status: 'pending',
      expiresAt: {
        $gte: oneDayFromNow.toISOString(),
        $lte: new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString()
      },
      expirationWarning1Day: { $ne: true }
    }).toArray();

    console.log(`📅 Found ${expiring1Day.length} requests expiring in 1 day`);

    for (const request of expiring1Day) {
      try {
        await sendExpirationWarning(db, request, 1);
        await db.collection("signature_requests").updateOne(
          { _id: request._id },
          { $set: { expirationWarning1Day: true } }
        );
        warningsSent++;
      } catch (err) {
        console.error('Failed to send 1-day warning:', err);
      }
    }

    return NextResponse.json({
      success: true,
      warningsSent: warningsSent,
      message: `Sent ${warningsSent} expiration warning(s)`
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Helper function
async function sendExpirationWarning(db: any, request: any, daysLeft: number) {
  const document = await db.collection("documents").findOne({
    _id: new ObjectId(request.documentId)
  });

  if (!document) return;

  const owner = await db.collection('users').findOne({ 
    _id: new ObjectId(request.ownerId) 
  });
  const senderName = owner?.profile?.fullName || owner?.email || request.ownerEmail;

  const signingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/sign/${request.uniqueId}`;
  
  await sendExpirationWarningEmail({
    recipientName: request.recipient.name,
    recipientEmail: request.recipient.email,
    originalFilename: document.originalFilename || document.filename,
    signingLink: signingLink,
    senderName: senderName,
    expiresAt: request.expiresAt,
    daysLeft: daysLeft,
  });

  console.log(`✅ Sent ${daysLeft}-day expiration warning to ${request.recipient.email}`);
}