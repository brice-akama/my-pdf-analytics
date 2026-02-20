// app/api/signature/[signatureId]/track/route.ts
// Tracks view events, time spent, and page scrolls on signature_requests directly
// Reuses the same pattern as the main doc track route

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const body = await request.json();
    const { action, page, timeSpent, userAgent: bodyUserAgent } = body;

    const db = await dbPromise;

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const now = new Date();
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "Unknown";
    const userAgent =
      bodyUserAgent || request.headers.get("user-agent") || "";

    if (action === "viewed") {
      // First time they open the link
      // Only set viewedAt once (don't overwrite)
      const update: any = {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: now },
        $push: {
          viewHistory: {
            viewedAt: now,
            ip,
            userAgent,
          },
        },
      };

      // Set viewedAt only on first view
      if (!signatureRequest.viewedAt) {
        update.$set.viewedAt = now;
      }

      await db.collection("signature_requests").updateOne(
        { uniqueId: signatureId },
        update
      );
    } else if (action === "time_spent") {
      // Called on page unload — adds seconds spent to total
      if (typeof timeSpent === "number" && timeSpent > 0) {
        await db.collection("signature_requests").updateOne(
          { uniqueId: signatureId },
          {
            $inc: { totalTimeSpentSeconds: timeSpent },
          }
        );
      }
    } else if (action === "page_scroll") {
      // Track which pages of the doc they actually looked at
      if (typeof page === "number") {
        await db.collection("signature_requests").updateOne(
          { uniqueId: signatureId },
          {
            $addToSet: { pagesViewed: page },
            $set: { lastActivePage: page, lastSeenAt: now },
          }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Signature track error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}