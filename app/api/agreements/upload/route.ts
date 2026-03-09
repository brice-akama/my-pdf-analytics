 // This file handles uploading NDA/agreement PDFs to Cloudinary and saving metadata in MongoDB.
// It also provides a GET endpoint to list all uploaded agreements for the logged-in user.
//app/api/agreements/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "@/app/api/lib/mongodb";
import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// GET — fetch all uploaded agreements for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;

    const agreements = await db
      .collection("agreements")
      .find({
        userId: user.id,
        type: "agreement",
        status: "uploaded",
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      agreements: agreements.map((a: any) => ({
        _id: a._id.toString(),
        filename: a.filename || a.originalFilename,
        filesize: a.filesize || a.size,
        cloudinaryPdfUrl: a.cloudinaryPdfUrl,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ GET agreements error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agreements" },
      { status: 500 }
    );
  }
}

// POST — upload a new NDA/agreement PDF
export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const user = await verifyUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be less than 10MB" },
        { status: 400 }
      );
    }

    console.log("📄 Uploading agreement:", file.name);

    // Write to temp file for Cloudinary upload
    const uploadDir = path.join(process.cwd(), "public", "temp");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Encode filename to prevent spaces/special chars causing 500 errors
    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const tempFileName = `temp_agreement_${Date.now()}_${safeOriginalName}`;
    tempFilePath = path.join(uploadDir, tempFileName);

    await writeFile(tempFilePath, buffer);

    console.log("📤 Uploading to Cloudinary...");

    const cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
      folder: `agreements/${user.id}`,
      resource_type: "auto",
      format: "pdf",
      // ✅ encodeURIComponent prevents 500 on filenames with spaces
     public_id: `agreement_${Date.now()}_${file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    });

    console.log("✅ Cloudinary upload:", cloudinaryResult.secure_url);

    const db = await dbPromise;
    const profile = await db
      .collection("profiles")
      .findOne({ user_id: user.id });

    const agreementDoc = {
      userId: user.id,
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
        role: profile?.role || "owner",
      },
    };

    const result = await db.collection("agreements").insertOne(agreementDoc);

    console.log("✅ Agreement saved:", result.insertedId.toString());

    // Clean up temp file
    if (tempFilePath) {
      await unlink(tempFilePath).catch((err) =>
        console.warn("⚠️ Failed to delete temp file:", err)
      );
    }

    return NextResponse.json({
      success: true,
      agreementId: result.insertedId.toString(),
      cloudinaryUrl: cloudinaryResult.secure_url,
      document: {
        _id: result.insertedId.toString(),
        filename: file.name,
        type: "agreement",
        cloudinaryPdfUrl: cloudinaryResult.secure_url,
      },
      message: "Agreement uploaded successfully",
    });
  } catch (error) {
    console.error("❌ Upload agreement error:", error);

    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }

    return NextResponse.json(
      {
        error: "Failed to upload agreement",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}