// app/api/documents/[id]/cc-recipients/route.ts
//
// WHAT CHANGED vs the original:
//
//   The mapping now returns the fields that the track route actually writes
//   to cc_recipients. The original returned `viewedAt` which was never
//   written by the track route — so ActivityTab always showed "—" and
//   "Not opened" even for recipients who had opened the document.
//
//   Fields added to the response:
//     firstOpenedAt      — when they first opened (track route: event=opened, isFirstOpen)
//     lastOpenedAt       — most recent open (track route: event=opened, every time)
//     downloaded         — boolean, true after first download event
//     downloadCount      — how many times they clicked download
//     firstDownloadedAt  — timestamp of first download
//
//   Fields removed:
//     viewedAt           — was never written by the track route, always null.
//                          ActivityTab now reads firstOpenedAt/lastOpenedAt instead.
//
//   Everything else (auth, ownership check, $or query, sort) is unchanged.

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyUserFromRequest } from "@/lib/auth";

export async function GET(
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

    console.log(
      "🔍 [cc-recipients] Looking for documentId:",
      id,
      "ownerId:",
      user.id
    );

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(id),
      userId: user.id,
    });

    if (!document) {
      console.log("❌ [cc-recipients] Document not found for id:", id);
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    console.log("✅ [cc-recipients] Document found:", document._id);

    // Try both string and ObjectId since documentId could be stored either way
    const recipients = await db
      .collection("cc_recipients")
      .find({
        $or: [
          { documentId: id,               ownerId: user.id },
          { documentId: new ObjectId(id), ownerId: user.id },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log("📋 [cc-recipients] Count:", recipients.length);

    return NextResponse.json({
      success: true,
      recipients: recipients.map((r) => ({
        uniqueId:   r.uniqueId,
        name:       r.name,
        email:      r.email,
        notifyWhen: r.notifyWhen,
        status:     r.status,
        createdAt:  r.createdAt,

        // ── Open tracking ──────────────────────────────────────────────────
        // Written by track route (event: 'opened').
        // firstOpenedAt is set once and never overwritten.
        // lastOpenedAt is updated on every open.
        firstOpenedAt: r.firstOpenedAt || null,
        lastOpenedAt:  r.lastOpenedAt  || null,
        viewCount:     r.viewCount     || 0,

        // ── Time tracking ──────────────────────────────────────────────────
        // Incremented by track route (event: 'time_spent') via $inc.
        totalTimeSpentSeconds: r.totalTimeSpentSeconds || 0,

        // ── Download tracking ──────────────────────────────────────────────
        // Written by track route (event: 'downloaded').
        downloaded:        r.downloaded        || false,
        downloadCount:     r.downloadCount     || 0,
        firstDownloadedAt: r.firstDownloadedAt || null,

        // ── Page data ──────────────────────────────────────────────────────
        // Populated if you implement per-page tracking for CC recipients.
        // Returns empty array until then — ActivityTab handles this gracefully.
        pageData: r.pageData || [],
      })),
    });
  } catch (error) {
    console.error("❌ [cc-recipients] Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}