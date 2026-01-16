//app/api/agreements/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { dbPromise } from "../../lib/mongodb"

// ✅ Helper: Get authenticated user using cookies inside auth function
async function getVerifiedUser(req: NextRequest) {
  return await verifyUserFromRequest(req)
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

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 })
    }

    // 📁 Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    // 💾 Save file to filesystem
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    const filename = `agreement_${Date.now()}_${safeOriginalName}`
    const filepath = path.join(uploadDir, filename)

    await writeFile(filepath, buffer)

    const db = await dbPromise
    
    // ✅ MATCH YOUR DOCUMENTS FORMAT
    const agreementDoc = {
      userId: user.id,  // ✅ STRING (not ObjectId!)
      filename: file.name,
      originalFilename: file.name,
      filepath: `/uploads/${filename}`,
      filesize: file.size,
      size: file.size,  // ✅ ADD: Some documents might use "size"
      numPages: 1,
      type: "agreement",
      status: "uploaded",
      createdAt: new Date(),
      updatedAt: new Date(),  // ✅ ADD: For consistency
      // ✅ ADD: Match other document fields your GET route expects
      cloudinaryPdfUrl: null,  // Will be set when uploaded to Cloudinary
      cloudinaryOriginalUrl: null,
      originalFormat: "pdf",
      mimeType: "application/pdf",
    }

    console.log("📝 Saving agreement to documents collection:", agreementDoc)

    const result = await db.collection("documents").insertOne(agreementDoc)
    
    console.log("✅ Agreement saved with ID:", result.insertedId.toString())

    return NextResponse.json({
      success: true,
      agreementId: result.insertedId.toString(),
      document: {  // ✅ Return full document for auto-selection
        _id: result.insertedId.toString(),
        filename: file.name,
        originalFilename: file.name,
        numPages: 1,
        type: "agreement",
      },
      message: "Agreement uploaded successfully",
      fileUrl: `/uploads/${filename}`,
    })
  } catch (error) {
    console.error("❌ Upload agreement error:", error)
    return NextResponse.json(
      { error: "Failed to upload agreement" },
      { status: 500 }
    )
  }
}