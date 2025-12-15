// app/api/signature/[signatureId]/attachments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// GET - Fetch all attachments for a signature request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const db = await dbPromise;

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    const attachments = await db.collection("signature_attachments")
      .find({ signatureRequestId: signatureId })
      .sort({ uploadedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      attachments,
      totalCount: attachments.length,
    });

  } catch (error) {
    console.error("❌ Error fetching attachments:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// POST - Upload a new attachment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const formData = await request.formData();
    const fieldId = formData.get('fieldId') as string; // ⭐ ADD THIS
    const file = formData.get('file') as File;
    const attachmentType = formData.get('type') as string;
    const description = formData.get('description') as string;
    const isRequired = formData.get('required') === 'true';

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "File type not allowed. Supported: PDF, Images, Word, Excel" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Verify signature request exists
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `docsend/attachments/${signatureRequest.documentId}`,
          resource_type: 'auto',
          public_id: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // Create attachment document
    const attachmentDoc = {
      signatureRequestId: signatureId,
      documentId: signatureRequest.documentId,
      recipientEmail: signatureRequest.recipient.email,
      recipientName: signatureRequest.recipient.name,
      filename: file.name,
      originalFilename: file.name,
      fieldId: fieldId,
      fileSize: file.size,
      fileType: file.type,
      attachmentType: attachmentType || 'supporting_document',
      description: description || null,
      isRequired: isRequired || false,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      uploadedAt: new Date(),
      uploadedBy: signatureRequest.recipient.email,
      status: 'uploaded',
    };

    const result = await db.collection("signature_attachments").insertOne(attachmentDoc);

    console.log('✅ Attachment uploaded:', file.name);

    // Update signature request with attachment reference
    await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId },
      { 
        $push: { 
          attachments: {
            id: result.insertedId.toString(),
            filename: file.name,
            uploadedAt: new Date(),
          }
        } as any
      }
    );

    return NextResponse.json({
      success: true,
      message: "Attachment uploaded successfully",
      attachment: {
        id: result.insertedId.toString(),
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
        url: uploadResult.secure_url,
      },
    });

  } catch (error) {
    console.error("❌ Error uploading attachment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json(
        { success: false, message: "Attachment ID is required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Get attachment details
    const attachment = await db.collection("signature_attachments").findOne({
      _id: new ObjectId(attachmentId),
      signatureRequestId: signatureId,
    });

    if (!attachment) {
      return NextResponse.json(
        { success: false, message: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(attachment.cloudinaryPublicId);
    } catch (err) {
      console.warn('Failed to delete from Cloudinary:', err);
    }

    // Delete from database
    await db.collection("signature_attachments").deleteOne({
      _id: new ObjectId(attachmentId),
    });

    // Remove from signature request
    await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId },
      { 
        $pull: { 
          attachments: { id: attachmentId }
        } as any
      }
    );

    console.log('✅ Attachment deleted:', attachment.filename);

    return NextResponse.json({
      success: true,
      message: "Attachment deleted successfully",
    });

  } catch (error) {
    console.error("❌ Error deleting attachment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}