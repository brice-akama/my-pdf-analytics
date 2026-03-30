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
// app/api/agreements/upload/route.ts

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
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be less than 10MB" }, { status: 400 });
    }

    // ✅ CHECK 1 - Cloudinary config
    console.log("🔍 Cloudinary config check:", {
      cloud_name: !!process.env.CLOUDINARY_NAME,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_SECRET_KEY,
    })

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });

    console.log("📄 Uploading agreement:", file.name, "size:", file.size);

    // ✅ CHECK 2 - temp file writing
    const uploadDir = path.join(process.cwd(), "public", "temp");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const tempFileName = `temp_agreement_${Date.now()}_${safeOriginalName}`;
    tempFilePath = path.join(uploadDir, tempFileName);

    await writeFile(tempFilePath, buffer);
    console.log("✅ Temp file written:", tempFilePath);

    // ✅ CHECK 3 - Cloudinary upload
    console.log("📤 Starting Cloudinary upload...");
    const cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
      folder: `agreements/${user.id}`,
      resource_type: "auto",
      format: "pdf",
      public_id: `agreement_${Date.now()}_${file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    });
    console.log("✅ Cloudinary upload success:", cloudinaryResult.secure_url);

    // ✅ CHECK 4 - MongoDB
    console.log("💾 Saving to MongoDB...");
    const db = await dbPromise;
    const profile = await db.collection("profiles").findOne({ user_id: user.id });

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
    console.log("✅ Agreement saved to MongoDB:", result.insertedId.toString());

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

  } catch (error: any) {
    console.error("❌ Upload agreement error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    if (tempFilePath) {
      await unlink(tempFilePath).catch(() => {});
    }

    return NextResponse.json(
      {
        error: "Failed to upload agreement",
        // ✅ Show exact error in response so you can see it in browser
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}