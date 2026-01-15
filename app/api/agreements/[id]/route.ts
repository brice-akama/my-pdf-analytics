//app/api/agreements/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"
import { unlink } from "fs/promises"
import path from "path"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise
    
    // Find agreement
    const agreement = await db.collection("documents").findOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(user.id),
    })

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    // Delete file from filesystem
    try {
      const filepath = path.join(process.cwd(), 'public', agreement.filepath)
      await unlink(filepath)
    } catch (err) {
      console.warn('Failed to delete file:', err)
    }

    // Delete from database
    await db.collection("documents").deleteOne({
      _id: new ObjectId(params.id),
    })

    return NextResponse.json({
      success: true,
      message: "Agreement deleted successfully",
    })
  } catch (error) {
    console.error("❌ DELETE agreement error:", error)
    return NextResponse.json(
      { error: "Failed to delete agreement" },
      { status: 500 }
    )
  }
}
