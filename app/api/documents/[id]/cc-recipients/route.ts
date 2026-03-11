// app/api/documents/[id]/cc-recipients/route.ts

// app/api/documents/[id]/cc-recipients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;  // ← await params first

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;

    console.log("🔍 [cc-recipients] Looking for documentId:", id, "ownerId:", user.id);

    const document = await db.collection("documents").findOne({
      _id: new ObjectId(id),
      userId: user.id,
    });

    if (!document) {
      console.log("❌ [cc-recipients] Document not found for id:", id);
      return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 });
    }

    console.log("✅ [cc-recipients] Document found:", document._id);

    // Try both string and ObjectId since documentId could be stored either way
    const recipients = await db
      .collection("cc_recipients")
      .find({
        $or: [
          { documentId: id,                 ownerId: user.id },
          { documentId: new ObjectId(id),   ownerId: user.id },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log("📋 [cc-recipients] Count:", recipients.length);
    console.log("📋 [cc-recipients] Raw:", JSON.stringify(recipients, null, 2));

    return NextResponse.json({
      success: true,
      recipients: recipients.map((r) => ({
        uniqueId:   r.uniqueId,
        name:       r.name,
        email:      r.email,
        notifyWhen: r.notifyWhen,
        status:     r.status,
        createdAt:  r.createdAt,
        viewedAt:   r.viewedAt || null,
        viewCount:  r.viewCount || 0,
        totalTimeSpentSeconds: r.totalTimeSpentSeconds || 0,
        pageData:   r.pageData || [],
      })),
    });
  } catch (error) {
    console.error("❌ [cc-recipients] Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}