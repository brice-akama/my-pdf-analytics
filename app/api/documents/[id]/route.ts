// app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("📍 GET /api/documents/:id");

    // Await params (your requested logic)
    const { id } = await context.params;

    // Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;
    let document = null;

    // Try ObjectId
    if (ObjectId.isValid(id)) {
      document = await db.collection("documents").findOne({
        _id: new ObjectId(id),
        userId: user.id,
      });
    }

    // Try string id
    if (!document) {
      document = await db.collection("documents").findOne({
        id: id,
        userId: user.id,
      });
    }

    if (!document) {
      return NextResponse.json(
        {
          error: "Document not found",
          debug: { id, userId: user.id },
        },
        { status: 404 }
      );
    }

    // Return document
    return NextResponse.json({
      success: true,
      document: {
        _id: document._id.toString(),
        filename: document.originalFilename || document.filename,
        originalFilename: document.originalFilename,
        originalFormat: document.originalFormat,
        mimeType: document.mimeType,
        size: document.size,
        pdfSize: document.pdfSize,
        numPages: document.numPages,
        wordCount: document.wordCount,
        charCount: document.charCount,
        summary: document.summary,
        scannedPdf: document.scannedPdf,
        cloudinaryOriginalUrl: document.cloudinaryOriginalUrl,
        cloudinaryPdfUrl: document.cloudinaryPdfUrl,
        extractedText: document.extractedText,
        notes: document.notes || "",
        analytics: {
          healthScore: document.analytics?.healthScore || 0,
          readabilityScore: document.analytics?.readabilityScore || 0,
          sentimentScore: document.analytics?.sentimentScore || 0,
          errorCounts: document.analytics?.errorCounts || {},
          topKeywords: document.analytics?.keywords?.slice(0, 10) || [],
          language: document.analytics?.language || "en",
          formalityLevel: document.analytics?.formalityLevel || "neutral",
        },
        tracking: {
          views: document.tracking?.views || 0,
          uniqueVisitors: document.tracking?.uniqueVisitors?.length || 0,
          downloads: document.tracking?.downloads || 0,
          shares: document.tracking?.shares || 0,
          lastViewed: document.tracking?.lastViewed || null,
        },
        tags: document.tags || [],
        folder: document.folder || null,
        starred: document.starred || false,
        archived: document.archived || false,
        isPublic: document.isPublic || false,
        sharedWith: document.sharedWith || [],
        shareLinks: document.shareLinks || [],
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        lastAnalyzedAt: document.lastAnalyzedAt,
        lastAccessedAt: document.lastAccessedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Fetch document error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch document",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// ✅ PATCH - Update document metadata
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (your requested logic)
    const { id } = await context.params;

    // Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate document ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid document ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      notes,
      tags,
      folder,
      starred,
      archived,
      isPublic,
      sharedWith,
      originalFilename,
    } = body;

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // Verify document ownership
    const document = await db.collection("documents").findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Build update fields
    const updateFields: any = { updatedAt: new Date() };

    if (notes !== undefined) updateFields.notes = notes;
    if (tags !== undefined) updateFields.tags = tags;
    if (folder !== undefined) updateFields.folder = folder;
    if (starred !== undefined) updateFields.starred = starred;
    if (archived !== undefined) updateFields.archived = archived;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;
    if (sharedWith !== undefined) updateFields.sharedWith = sharedWith;
    if (originalFilename !== undefined)
      updateFields.originalFilename = originalFilename;

    // Update document
    const result = await db.collection("documents").updateOne(
      { _id: documentId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Log update
    await db.collection("analytics_logs").insertOne({
      documentId: id,
      action: "document_updated",
      userId: user.id,
      updatedFields: Object.keys(updateFields),
      timestamp: new Date(),
      userAgent: request.headers.get("user-agent"),
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip"),
    });

    // Fetch updated document
    const updatedDocument = await db.collection("documents").findOne({
      _id: documentId,
    });

    return NextResponse.json({
      success: true,
      message: "Document updated successfully",
      document: {
        _id: updatedDocument?._id.toString(),
        notes: updatedDocument?.notes,
        tags: updatedDocument?.tags,
        folder: updatedDocument?.folder,
        starred: updatedDocument?.starred,
        archived: updatedDocument?.archived,
        isPublic: updatedDocument?.isPublic,
        sharedWith: updatedDocument?.sharedWith,
        originalFilename: updatedDocument?.originalFilename,
        updatedAt: updatedDocument?.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Update document error:", error);
    return NextResponse.json(
      {
        error: "Failed to update document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


// ✅ DELETE - Delete document and cleanup
// ✅ DELETE - Delete document and cleanup
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (your requested logic)
    const { id } = await context.params;

    // Verify user via cookie/token
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate document ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid document ID" },
        { status: 400 }
      );
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // Verify document exists + belongs to user
    const document = await db.collection("documents").findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete document from MongoDB
    await db.collection("documents").deleteOne({ _id: documentId });

    // Delete analytics logs
    await db.collection("analytics_logs")
      .deleteMany({ documentId: id })
      .catch((err) => console.error("Failed to delete analytics logs:", err));

    // Delete document views
    await db.collection("document_views")
      .deleteMany({ documentId })
      .catch((err) => console.error("Failed to delete document views:", err));

    // Delete shares
    await db.collection("shares")
      .deleteMany({ documentId })
      .catch((err) => console.error("Failed to delete shares:", err));

    // Log deletion
    await db.collection("analytics_logs").insertOne({
      documentId: id,
      action: "document_deleted",
      userId: user.id,
      documentInfo: {
        filename: document.originalFilename,
        format: document.originalFormat,
        size: document.size,
      },
      timestamp: new Date(),
      userAgent: request.headers.get("user-agent"),
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip"),
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
      deletedDocument: {
        id: document._id.toString(),
        filename: document.originalFilename,
      },
    });
  } catch (error) {
    console.error("❌ Delete document error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete document",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
