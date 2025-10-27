import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { dbPromise } from "../../lib/mongodb"

// ✅ Helper to get authenticated user
async function getVerifiedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  return await verifyUserFromRequest(authHeader)
}

export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const type = formData.get("type") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    // ✅ Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    // ✅ Save file to local filesystem
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `agreement_${Date.now()}_${file.name.replace(/\s+/g, "_")}`
    const filepath = path.join(uploadDir, filename)

    await writeFile(filepath, buffer)

    // ✅ Save to MongoDB
    const db = await dbPromise
    const agreementDoc = {
      userId: new ObjectId(user.id),
      filename: file.name,
      filepath: `/uploads/${filename}`,
      filesize: file.size,
      type: type || "agreement",
      status: "uploaded",
      createdAt: new Date(),
    }

    const result = await db.collection("agreements").insertOne(agreementDoc)

    return NextResponse.json({
      success: true,
      agreementId: result.insertedId.toString(),
      message: "Agreement uploaded successfully",
      fileUrl: `/uploads/${filename}`,
    })
  } catch (error) {
    console.error("Upload agreement error:", error)
    return NextResponse.json({ error: "Failed to upload agreement" }, { status: 500 })
  }
}
