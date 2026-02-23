import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { id } = await params;
    const db = await dbPromise;

    // 1. Regular signature requests (direct documentId match)
    const directRequests = await db.collection("signature_requests")
      .find({ documentId: id, ownerId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // 2. Bulk send requests (cloned docs point to originalTemplateId)
    const bulkRequests = await db.collection("signature_requests")
      .find({ originalTemplateId: id, ownerId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // 3. Envelope requests (live in separate collection)
    const envelopes = await db.collection("envelopes")
      .find({
        "documents.documentId": new ObjectId(id),
        ownerId: user.id,
      })
      .sort({ createdAt: -1 })
      .toArray();

    const origin = request.nextUrl.origin;

    // Map regular + bulk (same structure)
    const signatureResults = [...directRequests, ...bulkRequests].map(r => ({
      uniqueId: r.uniqueId,
      name: r.recipient?.name || '',
      email: r.recipient?.email || '',
      status: r.status,
      createdAt: r.createdAt,
      viewedAt: r.viewedAt || null,
      signedAt: r.signedAt || null,
      viewCount: r.viewCount || 0,
      totalTimeSpentSeconds: r.totalTimeSpentSeconds || 0,
      pageData: r.pageData || [],
      signingLink: `${origin}/sign/${r.uniqueId}`,
      linkType: 'signature',
      source: r.isBulkSend ? 'bulk' : 'signature',
    }));

    // Map envelope recipients
    const envelopeResults = envelopes.flatMap(env =>
      env.recipients.map((r: any) => ({
        uniqueId: r.uniqueId,
        name: r.name || '',
        email: r.email || '',
        status: r.status,
        createdAt: env.createdAt,
        viewedAt: r.viewedAt || null,
        signedAt: r.completedAt || null,
        viewCount: r.viewCount || 0,
        totalTimeSpentSeconds: r.totalTimeSpentSeconds || 0,
        pageData: r.pageData || [],
        signingLink: `${origin}/envelope/${r.uniqueId}`,
        linkType: 'envelope',
        source: 'envelope',
        envelopeId: env.envelopeId,
        documentCount: env.documents.length,
      }))
    );

    return NextResponse.json({
      success: true,
      requests: [...signatureResults, ...envelopeResults],
    });

  } catch (error) {
    console.error("Failed to fetch signature requests:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}