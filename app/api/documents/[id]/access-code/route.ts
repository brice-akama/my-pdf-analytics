// app/api/documents/[id]/access-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyUserFromRequest } from "@/lib/auth";
import { hashAccessCode, validateAccessCode } from "@/lib/accessCodeConfig";

// POST - Set access code for signature requests
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { accessCode, accessCodeType, accessCodeHint, applyToAll, recipientEmails } = body;

    // Validate access code
    const validation = validateAccessCode(accessCode);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Verify document ownership
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(id),
      ownerId: user.id,
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found or unauthorized" },
        { status: 404 }
      );
    }

    // Hash the access code
    const hashedCode = await hashAccessCode(accessCode);

    // Prepare update data
    const updateData = {
      accessCodeRequired: true,
      accessCodeHash: hashedCode,
      accessCodeType: accessCodeType || "custom",
      accessCodeHint: accessCodeHint || null,
      accessCodeSetAt: new Date(),
      accessCodeSetBy: user.email,
    };

    let updateCount = 0;

    if (applyToAll) {
      const result = await db.collection("signature_requests").updateMany(
        { documentId: id, status: { $in: ["pending", "awaiting_turn"] } },
        { $set: updateData }
      );
      updateCount = result.modifiedCount;
    } else if (recipientEmails && recipientEmails.length > 0) {
      const result = await db.collection("signature_requests").updateMany(
        {
          documentId: id,
          "recipient.email": { $in: recipientEmails },
          status: { $in: ["pending", "awaiting_turn"] },
        },
        { $set: updateData }
      );
      updateCount = result.modifiedCount;
    } else {
      return NextResponse.json(
        { success: false, message: "Must specify recipients or applyToAll" },
        { status: 400 }
      );
    }

    // Log access code setup
    await db.collection("access_code_logs").insertOne({
      documentId: id,
      setBy: user.email,
      accessCodeType: accessCodeType || "custom",
      recipientCount: updateCount,
      setAt: new Date(),
      status: "configured",
    });

    console.log(`✅ Access code set for ${updateCount} signature request(s) on document ${id}`);

    return NextResponse.json({
      success: true,
      message: `Access code applied to ${updateCount} recipient${updateCount !== 1 ? "s" : ""}`,
      recipientsUpdated: updateCount,
    });

  } catch (error) {
    console.error("❌ Error setting access code:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// DELETE - Remove access code requirement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await dbPromise;

    // Verify document ownership
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(id),
      ownerId: user.id,
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found or unauthorized" },
        { status: 404 }
      );
    }

    // Remove access code requirement
    const result = await db.collection("signature_requests").updateMany(
      { documentId: id, status: { $in: ["pending", "awaiting_turn"] } },
      {
        $set: { accessCodeRequired: false },
        $unset: {
          accessCodeHash: "",
          accessCodeType: "",
          accessCodeHint: "",
          accessCodeFailedAttempts: "",
          accessCodeLockoutUntil: "",
        },
      }
    );

    console.log(`✅ Access code removed from ${result.modifiedCount} signature request(s)`);

    return NextResponse.json({
      success: true,
      message: `Access code removed from ${result.modifiedCount} recipient${result.modifiedCount !== 1 ? "s" : ""}`,
      recipientsUpdated: result.modifiedCount,
    });

  } catch (error) {
    console.error("❌ Error removing access code:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
