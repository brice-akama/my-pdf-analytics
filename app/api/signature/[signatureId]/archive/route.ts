//app/api/signature/[signatureId]/archive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Get the signature request
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (signatureRequest.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to archive this request" },
        { status: 403 }
      );
    }

    // Archive ALL signature requests for this document
    await db.collection("signature_requests").updateMany(
      { documentId: signatureRequest.documentId },
      {
        $set: {
          archived: true,
          archivedAt: new Date(),
        },
      }
    );

    // Archive the document too
    await db.collection("documents").updateOne(
      { _id: new ObjectId(signatureRequest.documentId) },
      {
        $set: {
          archived: true,
          archivedAt: new Date(),
        },
      }
    );

    console.log('✅ Archived document and all signature requests');

    return NextResponse.json({
      success: true,
      message: "Document archived successfully",
    });

  } catch (error) {
    console.error("❌ Error archiving:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// Unarchive endpoint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest || signatureRequest.ownerId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Not found or unauthorized" },
        { status: 404 }
      );
    }

    // Unarchive
    await db.collection("signature_requests").updateMany(
      { documentId: signatureRequest.documentId },
      {
        $unset: { archived: "", archivedAt: "" },
      }
    );

    await db.collection("documents").updateOne(
      { _id: new ObjectId(signatureRequest.documentId) },
      {
        $unset: { archived: "", archivedAt: "" },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Document restored successfully",
    });

  } catch (error) {
    console.error("❌ Error unarchiving:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}