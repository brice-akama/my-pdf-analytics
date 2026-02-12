import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";

// Transparent 1x1 pixel GIF
const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ AWAIT params in Next.js 15
    const trackingId = id.replace(".gif", "");

    const db = await dbPromise;
    const tracking = await db.collection("email_tracking").findOne({
      trackingPixelId: trackingId,
    });

    if (tracking && !tracking.opened) {
      // Mark as opened (only first time)
      await db.collection("email_tracking").updateOne(
        { _id: tracking._id },
        {
          $set: {
            opened: true,
            openedAt: new Date(),
          },
        }
      );

      // Create notification for sender
      await db.collection("notifications").insertOne({
        userId: tracking.userId,
        type: "email_opened",
        title: "Email Opened",
        message: `${tracking.recipients[0]} opened your email about "${tracking.subject}"`,
        read: false,
        createdAt: new Date(),
        metadata: {
          documentId: tracking.documentId,
          recipientEmail: tracking.recipients[0],
        },
      });

      console.log("📧 Email opened:", tracking.recipients[0]);
    }

    // Return transparent pixel
    return new NextResponse(PIXEL_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Email tracking error:", error);
    return new NextResponse(PIXEL_GIF, {
      status: 200,
      headers: { "Content-Type": "image/gif" },
    });
  }
}