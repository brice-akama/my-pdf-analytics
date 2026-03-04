import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { dbPromise } from "../../lib/mongodb"
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// ✅ FIXED: GET only returns agreements belonging to the logged-in user
export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;

    const agreements = await db
      .collection("documents")
      .find({ 
        userId: user.id,      // ✅ Strict personal scope — no team leak
        type: "agreement",
        status: "uploaded"
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      agreements: agreements.map((a: any) => ({
        _id: a._id.toString(),
        filename: a.filename,
        filesize: a.filesize || a.size,
        filepath: a.filepath,
        status: a.status,
        createdAt: a.createdAt,
        uploadedBy: a.userId,
      })),
    });
  } catch (error) {
    console.error("❌ GET uploaded agreements error:", error);
    return NextResponse.json({ error: "Failed to fetch agreements" }, { status: 500 });
  }
}

// POST — no changes needed here, already scoped to user.id on insert
export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise
    const profile = await db.collection("profiles").findOne({ user_id: user.id })

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    console.log("📄 Uploading agreement:", file.name)

    const uploadDir = path.join(process.cwd(), "public", "temp")
    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    const tempFileName = `temp_agreement_${Date.now()}_${safeOriginalName}`
    tempFilePath = path.join(uploadDir, tempFileName)

    await writeFile(tempFilePath, buffer)

    console.log("📤 Uploading to Cloudinary...")

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

    const agreementDoc = {
      userId: user.id,              // ✅ Always tied to the uploader
      filename: file.name,
      originalFilename: file.name,
      cloudinaryPdfUrl: cloudinaryResult.secure_url,
      cloudinaryOriginalUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      filesize: file.size,
      size: file.size,
      numPages: 1,
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