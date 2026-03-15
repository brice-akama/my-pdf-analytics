  // app/api/documents/[id]/envelopes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { dbPromise } from "@/app/api/lib/mongodb";
import { verifyUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;

    // Find all envelopes owned by this user that contain this documentId
    // documentId is stored as ObjectId in the envelope (from doc._id)
    // query with both forms to be safe
    const envelopes = await db.collection("envelopes").find({
      ownerId: user.id,
      $or: [
        { "documents.documentId": id },
        { "documents.documentId": new ObjectId(id) },
      ],
    }).sort({ createdAt: -1 }).toArray();

    // Return envelopes with sanitised recipient data
    const safeEnvelopes = envelopes.map((env: any) => ({
      envelopeId:  env.envelopeId,
      title:       env.title       || null,
      status:      env.status,
      createdAt:   env.createdAt   || null,
      completedAt: env.completedAt || null,
      documents:   (env.documents || []).map((d: any) => ({
        documentId: d.documentId,
        filename:   d.filename,
        numPages:   d.numPages || null,
      })),
      recipients: (env.recipients || []).map((r: any) => ({
        uniqueId:               r.uniqueId,
        name:                   r.name,
        email:                  r.email,
        status:                 r.status,
        viewCount:              r.viewCount              || 0,
        viewedAt:               r.viewedAt               || null,
        completedAt:            r.completedAt            || null,
        totalTimeSpentSeconds:  r.totalTimeSpentSeconds  || 0,
        pageData:               r.pageData               || [],
      })),
    }));

    return NextResponse.json({ success: true, envelopes: safeEnvelopes });

  } catch (error) {
    console.error("❌ Error fetching document envelopes:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}