 // app/api/signature/[signatureId]/sign/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../../../lib/mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }  // ← Changed to Promise
) {
  try {
    // ✅ MUST await params before using it
    const { signatureId } = await params;
    const { signedFields, signedAt } = await request.json();
    
    console.log('📝 Signing document:', signatureId);
    console.log('📋 Signed fields:', signedFields);
    
    const db = await dbPromise;

    const result = await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId },  // ← Now using the awaited value
      {
        $set: {
          status: "signed",
          signedFields,
          signedAt,
          completedAt: new Date(),
        },
      }
    );

    console.log('✅ Update result:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document signed successfully",
    });
  } catch (error) {
    console.error("❌ Error signing document:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}