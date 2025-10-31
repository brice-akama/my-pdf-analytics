import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../../lib/mongodb"
import { verifyUserFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // ✅ Try to verify user (but don't block if missing)
    let user = null
    try {
      user = await verifyUserFromRequest(request.headers.get("authorization") || "")
    } catch {
      // no-op → allow guests to save
    }

    const body = await request.json()
    const { templateId, customizedData, documentName } = body

    const db = await dbPromise

    // ✅ Build document data
    const documentData = {
      templateId,
      documentName: documentName || "Untitled Document",
      customizedData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "draft",
      ...(user ? { userId: user.id } : { guest: true }), // mark guest saves
    }

    const result = await db.collection("documents").insertOne(documentData)

    return NextResponse.json({
      success: true,
      documentId: result.insertedId,
      message: user
        ? "Document saved successfully."
        : "Document saved successfully (guest mode).",
    })
  } catch (error) {
    console.error("❌ Save error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save document" },
      { status: 500 }
    )
  }
}
