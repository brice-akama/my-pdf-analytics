import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "../lib/mongodb";
import { verifyUserFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

/* =========================
   GET - Fetch signatures
========================= */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);

    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await dbPromise;

    const userSignatures = await db
      .collection("user_signatures")
      .find({ userEmail: user.email })
      .sort({ lastUsedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      signatures: userSignatures,
      defaultSignature: userSignatures.find(sig => sig.isDefault) || null,
    });
  } catch (error) {
    console.error("❌ Error fetching signature styles:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/* =========================
   POST - Save signature
========================= */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);

    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, data, font, color, name, setAsDefault } = body;

    if (!type || !data) {
      return NextResponse.json(
        { success: false, message: "Type and data are required" },
        { status: 400 }
      );
    }

    if (!["draw", "type", "upload"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid signature type" },
        { status: 400 }
      );
    }

    const db = await dbPromise;
    const now = new Date();

    if (setAsDefault) {
      await db.collection("user_signatures").updateMany(
        { userEmail: user.email },
        { $set: { isDefault: false } }
      );
    }

    const signatureDoc = {
      userEmail: user.email,
      userId: user.id || null,
      type,
      data,
      font: font || null,
      color: color || "#000000",
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Signature`,
      isDefault: !!setAsDefault,
      createdAt: now,
      lastUsedAt: now,
      usageCount: 0,
    };

    const result = await db
      .collection("user_signatures")
      .insertOne(signatureDoc);

    return NextResponse.json({
      success: true,
      message: "Signature saved successfully",
      signatureId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("❌ Error saving signature style:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/* =========================
   PATCH - Update signature
========================= */
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);

    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { signatureId, action } = await request.json();

    if (!signatureId || !action) {
      return NextResponse.json(
        { success: false, message: "Signature ID and action are required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    if (action === "setDefault") {
      await db.collection("user_signatures").updateMany(
        { userEmail: user.email },
        { $set: { isDefault: false } }
      );

      await db.collection("user_signatures").updateOne(
        { _id: new ObjectId(signatureId), userEmail: user.email },
        { $set: { isDefault: true } }
      );
    }

    if (action === "updateUsage") {
      await db.collection("user_signatures").updateOne(
        { _id: new ObjectId(signatureId), userEmail: user.email },
        {
          $inc: { usageCount: 1 },
          $set: { lastUsedAt: new Date() },
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Signature updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating signature:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE - Remove signature
========================= */
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);

    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const signatureId = searchParams.get("id");

    if (!signatureId) {
      return NextResponse.json(
        { success: false, message: "Signature ID is required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    const result = await db.collection("user_signatures").deleteOne({
      _id: new ObjectId(signatureId),
      userEmail: user.email,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Signature not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Signature deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting signature:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
