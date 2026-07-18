// app/api/documents/[id]/use-template/route.ts
// ── POST: create a client-specific copy of ANY document James owns ──
// Called directly from the document page — no separate "save as
// template" step required. Creates a new, ordinary `documents` row
// (isTemplate: false) pointing at the same Cloudinary files, named
// "<original> — <clientName>". Because it's a normal document, the
// existing document page (share drawer, signature flow, analytics)
// works on it exactly like any uploaded doc — nothing custom needed
// downstream. This is deliberately NOT isTemplate: true, since that
// flag is already used by the separate e-signature template feature
// and mixing the two would put client copies in the wrong tab/UI.

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { checkAccess } from '@/lib/checkAccess';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const body = await request.json();
    const { clientName } = body;

    if (!clientName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Client name is required' },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Source can be ANY document James owns — no isTemplate requirement.
    const source = await db.collection('documents').findOne({
      _id: new ObjectId(id),
    });

    if (!source) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    if (source.userId !== access.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // ── Enforce document count limit — same check as upload.ts Step 4 ──
    if (access.limits.maxDocuments !== -1) {
      const existingCount = await db.collection('documents').countDocuments({
        userId: access.userId,
        archived: { $ne: true },
      });

      if (existingCount >= access.limits.maxDocuments) {
        return NextResponse.json(
          {
            success: false,
            error: `You've reached the ${access.limits.maxDocuments} document limit on the ${access.plan} plan. Upgrade for unlimited documents.`,
            code: 'DOCUMENT_LIMIT_REACHED',
            limit: access.limits.maxDocuments,
            used: existingCount,
            plan: access.plan,
          },
          { status: 403 }
        );
      }
    }

    // ── Create the client-specific copy ─────────────────────────────
    // Same Cloudinary URLs as the source — no re-upload, no new
    // storage cost. Everything else matches what upload.ts writes for
    // a brand new document, so the whole app treats it identically:
    // analytics, share drawer, signature flow, all of it.
    const baseName = source.originalFilename.replace(' (Template)', '');

    const clientDoc = {
      userId: access.userId,
      plan: access.plan, // live plan, not a stale copy
      organizationId: source.organizationId || null,
      version: 1,
      originalFilename: `${baseName} — ${clientName.trim()}`,
      originalFormat: source.originalFormat,
      visibility: 'personal',
      mimeType: source.mimeType,
      size: source.size,
      pdfSize: source.pdfSize,
      cloudinaryOriginalUrl: source.cloudinaryOriginalUrl,
      cloudinaryPdfUrl: source.cloudinaryPdfUrl,
      extractedText: source.extractedText || '',
      numPages: source.numPages,
      wordCount: source.wordCount,
      charCount: source.charCount,
      summary: source.summary || null,
      scannedPdf: source.scannedPdf || false,
      analytics: {
        views: 0,
        uniqueVisitors: [],
        downloads: 0,
        shares: 0,
        averageViewTime: 0,
        lastViewed: null,
      },
      tracking: {
        views: 0,
        uniqueVisitors: [],
        downloads: 0,
        shares: 0,
        averageViewTime: 0,
        viewsByPage: Array(source.numPages || 1).fill(0),
        lastViewed: null,
      },
      isPublic: false,
      sharedWith: [],
      shareLinks: [],
      tags: [],
      folder: null,
      starred: false,
      archived: false,
      isTemplate: false, // real document, not a signature template
      sourceDocumentId: id,
      clientName: clientName.trim(),
      dealOutcome: null,
      dealOutcomeSetAt: null,
      dealOutcomeSetBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: null,
    };

    const result = await db.collection('documents').insertOne(clientDoc);

    // No share record created here — James generates the link himself
    // from the document page's existing Share drawer, which already
    // calls the correct, already-verified /api/documents/[id]/share route.
    return NextResponse.json({
      success: true,
      document: {
        _id: result.insertedId.toString(),
        originalFilename: clientDoc.originalFilename,
        clientName: clientDoc.clientName,
      },
    });

  } catch (error) {
    console.error('[UseTemplate] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create client copy' },
      { status: 500 }
    );
  }
}