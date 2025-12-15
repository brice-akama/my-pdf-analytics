// app/api/signature/[signatureId]/attachments/[attachmentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

/**
 * GET - View or Download a specific attachment
 * Query params: ?action=view or ?action=download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string; attachmentId: string }> }
) {
  try {
    const { signatureId, attachmentId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'view'; // 'view' or 'download'

    console.log(`📎 ${action === 'download' ? 'Download' : 'View'} attachment request:`, attachmentId);

    const db = await dbPromise;

    // 1. Get attachment from database
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

    console.log('✅ Attachment found:', attachment.filename);

    // 2. Extract public_id from Cloudinary URL
    const cloudinaryUrl = attachment.cloudinaryUrl;
    const publicId = attachment.cloudinaryPublicId;

    if (!publicId) {
      console.error('❌ No Cloudinary public_id found');
      return NextResponse.json(
        { success: false, message: "Invalid attachment storage" },
        { status: 500 }
      );
    }

    console.log('🔑 Cloudinary Public ID:', publicId);

    // 3. Determine resource_type from URL or file type
    let resourceType: 'image' | 'raw' | 'video' | 'auto' = 'raw';
    
    if (attachment.fileType === 'application/pdf') {
      resourceType = 'image'; // PDFs are stored as 'image' in Cloudinary
    } else if (attachment.fileType.startsWith('image/')) {
      resourceType = 'image';
    } else {
      resourceType = 'raw'; // Word, Excel, etc.
    }

    console.log('📦 Resource type:', resourceType);

    // 4. Generate authenticated download URL
const downloadOptions: any = {
  resource_type: resourceType,
  type: 'upload',
  expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
};

const authenticatedUrl = cloudinary.utils.private_download_url(
  publicId,
  attachment.fileType.includes('pdf') ? 'pdf' : '', // Empty string for non-PDFs
  downloadOptions
);

    // 5. Fetch the file from Cloudinary
    const fileResponse = await fetch(authenticatedUrl);

    if (!fileResponse.ok) {
      console.error('❌ Cloudinary fetch failed:', fileResponse.status, fileResponse.statusText);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve attachment from storage" },
        { status: 500 }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    console.log('✅ File downloaded:', fileBuffer.byteLength, 'bytes');

    // 6. Return file with appropriate headers
    const headers: Record<string, string> = {
      'Content-Type': attachment.fileType,
      'Content-Length': fileBuffer.byteLength.toString(),
    };

    if (action === 'download') {
      // Force download
      headers['Content-Disposition'] = `attachment; filename="${attachment.filename}"`;
    } else {
      // View in browser
      headers['Content-Disposition'] = `inline; filename="${attachment.filename}"`;
    }

    return new NextResponse(fileBuffer, { headers });

  } catch (error) {
    console.error("❌ Error retrieving attachment:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}