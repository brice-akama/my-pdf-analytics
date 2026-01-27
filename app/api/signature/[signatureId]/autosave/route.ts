//app/api/signature/[signatureId]/autosave/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const body = await request.json();
    const { signatures, fieldValues } = body;

    if (!signatures && !fieldValues) {
      return NextResponse.json(
        { success: false, message: "No data to save" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Check if signature request exists
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // Don't allow auto-save if already completed
    if (signatureRequest.status === 'completed' || signatureRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, message: "Document already completed" },
        { status: 400 }
      );
    }

    // Update with draft data
    const updateData: any = {
      draftSignatures: signatures || {},
      draftFieldValues: fieldValues || {},
      lastAutoSaved: new Date(),
    };

    // Track progress percentage
    const totalFields = signatureRequest.signatureFields?.length || 0;
    const filledFields = Object.keys(signatures || {}).length;
    const progressPercent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    
    updateData.progress = {
      total: totalFields,
      completed: filledFields,
      percent: progressPercent,
    };

    await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId },
      {
        $set: updateData,
      }
    );

    console.log(`💾 Auto-saved progress for ${signatureId}: ${filledFields}/${totalFields} fields (${progressPercent}%)`);

    return NextResponse.json({
      success: true,
      message: "Progress saved",
      progress: {
        completed: filledFields,
        total: totalFields,
        percent: progressPercent,
      },
      savedAt: new Date(),
    });

  } catch (error) {
    console.error("❌ Error auto-saving:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save progress" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve saved progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // Return saved draft data
    return NextResponse.json({
      success: true,
      draftSignatures: signatureRequest.draftSignatures || {},
      draftFieldValues: signatureRequest.draftFieldValues || {},
      progress: signatureRequest.progress || { completed: 0, total: 0, percent: 0 },
      lastAutoSaved: signatureRequest.lastAutoSaved || null,
    });

  } catch (error) {
    console.error("❌ Error retrieving saved progress:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve progress" },
      { status: 500 }
    );
  }
}