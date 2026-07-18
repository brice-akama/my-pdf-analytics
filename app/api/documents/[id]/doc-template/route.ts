// app/api/documents/[id]/doc-template/route.ts
// ── POST: save a document as a reusable template ──────────────
// Creates a new document record pointing to the same Cloudinary
// files — no new upload needed. The template is a metadata copy
// only. isTemplate: true separates it from active deal documents
// in the dashboard view.

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

    const db = await dbPromise;

    const document = await db.collection('documents').findOne({
      _id: new ObjectId(id),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.userId !== access.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // ── Enforce document count limit — same check as upload.ts Step 4 ──
    // A template is a real new row in the documents collection, so it
    // counts against the same maxDocuments cap a normal upload does.
    // Without this, a free-plan rep can bypass the document limit
    // entirely by repeatedly saving templates.
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

    // ── Create template record pointing to same Cloudinary files ──
    // No new upload. Same PDF, same original file, new metadata
    // record with isTemplate: true so it appears in Templates tab.
    const templateDoc = {
      userId: access.userId,
      plan: access.plan, // live plan from checkAccess, not a stale copy of document.plan
      organizationId: document.organizationId || null,
      version: 1,
      originalFilename: `${document.originalFilename} (Template)`,
      originalFormat: document.originalFormat,
      visibility: 'personal',
      mimeType: document.mimeType,
      size: document.size,
      pdfSize: document.pdfSize,
      cloudinaryOriginalUrl: document.cloudinaryOriginalUrl,
      cloudinaryPdfUrl: document.cloudinaryPdfUrl,
      extractedText: document.extractedText || '',
      numPages: document.numPages,
      wordCount: document.wordCount,
      charCount: document.charCount,
      summary: document.summary || null,
      scannedPdf: document.scannedPdf || false,
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
        viewsByPage: Array(document.numPages || 1).fill(0),
        lastViewed: null,
      },
      isPublic: false,
      sharedWith: [],
      shareLinks: [],
      tags: [],
      folder: null,
      starred: false,
      archived: false,
      isTemplate: true,
      sourceDocumentId: id,
      dealOutcome: null,
      dealOutcomeSetAt: null,
      dealOutcomeSetBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: null,
    };

    const result = await db.collection('documents').insertOne(templateDoc);

    return NextResponse.json({
      success: true,
      template: {
        _id: result.insertedId.toString(),
        originalFilename: templateDoc.originalFilename,
        isTemplate: true,
        createdAt: templateDoc.createdAt,
      },
    });

  } catch (error) {
    console.error('[SaveAsTemplate] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save as template' },
      { status: 500 }
    );
  }
}