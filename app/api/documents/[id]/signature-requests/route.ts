//app/api/documents/[id]/signature-requests/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { checkAccess } from '@/lib/checkAccess';
import { canAccessDocument } from '@/lib/teamAccess';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Auth + plan ───────────────────────────────────────────────
    const access = await checkAccess(request)
    if (!access.ok) return access.response

    const { id } = await params;
    const db = await dbPromise;

    const document = await db.collection('documents').findOne({
      _id: new ObjectId(id),
    });

    if (!document) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const hasAccess = await canAccessDocument(db, document, access.userId);
    if (!hasAccess) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    const directRequests = await db.collection('signature_requests')
      .find({ documentId: id })
      .sort({ createdAt: -1 })
      .toArray();

    const bulkRequests = await db.collection('signature_requests')
      .find({ originalTemplateId: id })
      .sort({ createdAt: -1 })
      .toArray();

    const envelopes = await db.collection('envelopes')
      .find({ 'documents.documentId': new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray();

    const origin = request.nextUrl.origin;

    const signatureResults = [...directRequests, ...bulkRequests].map(r => ({
      uniqueId:              r.uniqueId,
      name:                  r.recipient?.name  || '',
      email:                 r.recipient?.email || '',
      status:                r.status,
      createdAt:             r.createdAt,
      viewedAt:              r.viewedAt         || null,
      signedAt:              r.signedAt         || null,
      viewCount:             r.viewCount        || 0,
      totalTimeSpentSeconds: r.totalTimeSpentSeconds || 0,
      pageData:              r.pageData         || [],
      signingLink:           `${origin}/sign/${r.uniqueId}`,
      linkType:              'signature',
      source:                r.isBulkSend ? 'bulk' : 'signature',
    }));

    const envelopeResults = envelopes.flatMap(env =>
      env.recipients.map((r: any) => ({
        uniqueId:              r.uniqueId,
        name:                  r.name  || '',
        email:                 r.email || '',
        status:                r.status,
        createdAt:             env.createdAt,
        viewedAt:              r.viewedAt     || null,
        signedAt:              r.completedAt  || null,
        viewCount:             r.viewCount    || 0,
        totalTimeSpentSeconds: r.totalTimeSpentSeconds || 0,
        pageData:              r.pageData     || [],
        signingLink:           `${origin}/envelope/${r.uniqueId}`,
        linkType:              'envelope',
        source:                'envelope',
        envelopeId:            env.envelopeId,
        documentCount:         env.documents.length,
      }))
    );

    return NextResponse.json({
      success: true,
      requests: [...signatureResults, ...envelopeResults],
    });

  } catch (error) {
    console.error('Failed to fetch signature requests:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}