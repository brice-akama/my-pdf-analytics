import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"
import { unlink } from "fs/promises"
import path from "path"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← fix the Promise issue too
) {
  try {
    const { id } = await params  // ← await params (Next.js 15 requirement)

    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let agreementObjectId: ObjectId
    try {
      agreementObjectId = new ObjectId(id)
    } catch (err) {
      return NextResponse.json({ error: "Invalid agreement ID" }, { status: 400 })
    }

    const db = await dbPromise

    const agreement = await db.collection("agreements").findOne({
      _id: agreementObjectId,
      userId: user.id,  // ← string, not ObjectId — matches how it was stored
    })

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    // Delete from Cloudinary if stored there
    if (agreement.cloudinaryPublicId) {
      const { v2: cloudinary } = await import('cloudinary')
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_SECRET_KEY,
      })
      await cloudinary.uploader.destroy(agreement.cloudinaryPublicId, {
        resource_type: 'raw'
      }).catch(err => console.warn("Cloudinary delete failed:", err))
    }

    await db.collection("agreements").deleteOne({ _id: agreementObjectId })

    return NextResponse.json({ success: true, message: "Agreement deleted" })

  } catch (error: any) {
    console.error("❌ DELETE agreement error:", error)
    return NextResponse.json({ error: "Failed to delete agreement" }, { status: 500 })
  }
}
