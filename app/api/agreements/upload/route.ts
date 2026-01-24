//app/api/agreements/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { dbPromise } from "../../lib/mongodb"
import { v2 as cloudinary } from 'cloudinary'

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

async function getVerifiedUser(req: NextRequest) {
  return await verifyUserFromRequest(req)
}

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    // 🔐 Authenticate
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ OPTIONAL: Get uploader's name for better UI
  const db = await dbPromise
  const profile = await db.collection("profiles").findOne({ user_id: user.id })

    // 📥 Parse multipart form data
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // ✅ Only allow PDFs
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      )
    }

    console.log("📄 Uploading agreement:", file.name)

    // 📁 Create temporary file for Cloudinary upload
    const uploadDir = path.join(process.cwd(), "public", "temp")
    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    const tempFileName = `temp_agreement_${Date.now()}_${safeOriginalName}`
    tempFilePath = path.join(uploadDir, tempFileName)

    await writeFile(tempFilePath, buffer)

    console.log("📤 Uploading to Cloudinary...")

    // ☁️ Upload PDF to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
      folder: `agreements/${user.id}`,
      resource_type: "auto",
      format: "pdf",
      public_id: `agreement_${Date.now()}`,
      transformation: [
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    })

    console.log("✅ Cloudinary upload successful:", cloudinaryResult.secure_url)

    // 🗄️ Save metadata to MongoDB
     
    
    const agreementDoc = {
      userId: user.id,
      filename: file.name,
      originalFilename: file.name,
      cloudinaryPdfUrl: cloudinaryResult.secure_url,  // ✅ Cloudinary URL
      cloudinaryOriginalUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      filesize: file.size,
      size: file.size,
      numPages: 1,  // TODO: Extract actual page count from PDF
      type: "agreement",
      status: "uploaded",
      originalFormat: "pdf",
      mimeType: "application/pdf",
      createdAt: new Date(),
      updatedAt: new Date(),

      uploadedBy: {
      userId: user.id,
      name: profile?.full_name || user.email,
      email: user.email,
      role: profile?.role || "owner"
    },
    
    }

    console.log("💾 Saving agreement to database...")

    const result = await db.collection("documents").insertOne(agreementDoc)
    
    console.log("✅ Agreement saved with ID:", result.insertedId.toString())

    // 🧹 Clean up temporary file
    if (tempFilePath) {
      await unlink(tempFilePath).catch(err => 
        console.warn("⚠️ Failed to delete temp file:", err)
      )
    }

    return NextResponse.json({
      success: true,
      agreementId: result.insertedId.toString(),
      document: {
        _id: result.insertedId.toString(),
        filename: file.name,
        originalFilename: file.name,
        numPages: 1,
        type: "agreement",
        cloudinaryPdfUrl: cloudinaryResult.secure_url,
      },
      message: "Agreement uploaded successfully",
      cloudinaryUrl: cloudinaryResult.secure_url,
    })
  } catch (error) {
    console.error("❌ Upload agreement error:", error)
    
    // 🧹 Clean up temp file on error
    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {})
    }

    return NextResponse.json(
      { 
        error: "Failed to upload agreement",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}