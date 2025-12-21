// app/api/signature/[signatureId]/track-time/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const body = await request.json();
    const { action, page, timeSpent } = body; // 'first_view', 'completed', or 'page_time'

    const db = await dbPromise;

    // Handle first view or completion
    if (action === 'first_view' || action === 'completed') {
      const signatureRequest = await db.collection("signature_requests").findOne({
        uniqueId: signatureId,
      });

      if (!signatureRequest) {
        return NextResponse.json(
          { success: false, message: "Signature request not found" },
          { status: 404 }
        );
      }

      if (action === 'first_view') {
        if (!signatureRequest.firstViewedAt) {
          await db.collection("signature_requests").updateOne(
            { uniqueId: signatureId },
            { $set: { firstViewedAt: new Date() } }
          );
          console.log('✅ First view tracked');
        }
      } else if (action === 'completed') {
        const firstViewed = signatureRequest.firstViewedAt;
        const completedAt = new Date();
        let timeSpentSeconds = null;
        if (firstViewed) {
          timeSpentSeconds = Math.floor((completedAt.getTime() - new Date(firstViewed).getTime()) / 1000);
        }
        await db.collection("signature_requests").updateOne(
          { uniqueId: signatureId },
          {
            $set: {
              completedAt: completedAt,
              timeSpentSeconds: timeSpentSeconds,
            }
          }
        );
        console.log(`✅ Completion tracked: ${timeSpentSeconds} seconds`);
      }
    }
    // Handle page-level time tracking
    else if (action === 'page_time' && page && timeSpent) {
      await db.collection("signature_time_tracking").insertOne({
        signatureId,
        page,
        timeSpent,
        timestamp: new Date(),
      });
      console.log(`✅ Page time tracked: ${timeSpent}ms on page ${page}`);
    }
    // Invalid action
    else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
