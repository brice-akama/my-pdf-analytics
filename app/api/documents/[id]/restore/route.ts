import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // Find the archived document
    const document = await db.collection("documents").findOne({
      _id: documentId,
      userId: user.id,
      archived: true, // Use archived, not deleted
    });

    if (!document) {
      return NextResponse.json(
        { error: "Archived document not found" },
        { status: 404 }
      );
    }

    // Restore the document
    const result = await db.collection("documents").updateOne(
      { _id: documentId },
      { 
        $set: { 
          archived: false,        // Use archived, not deleted
          restoredAt: new Date(),
          updatedAt: new Date()
        },
        $unset: { archivedAt: "" } // Remove archivedAt field
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to restore document" },
        { status: 500 }
      );
    }

    // Log restoration
    await db.collection("analytics_logs").insertOne({
      documentId: id,
      action: "document_restored",
      userId: user.id,
      timestamp: new Date(),
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    });

    return NextResponse.json({
      success: true,
      message: "Document restored successfully",
      document: {
        _id: document._id.toString(),
        filename: document.originalFilename || document.filename,
      },
    });
  } catch (error) {
    console.error("❌ Restore document error:", error);
    return NextResponse.json(
      {
        error: "Failed to restore document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}