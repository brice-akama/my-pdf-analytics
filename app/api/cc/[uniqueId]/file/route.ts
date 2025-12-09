//app/api/cc/[uniqueId]/file/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;
    const email = request.nextUrl.searchParams.get("email");
    
    console.log('🔍 Fetching file for CC recipient:', uniqueId);
    
    const db = await dbPromise;

    // Verify CC recipient exists and is valid
    const ccRecord = await db.collection("cc_recipients").findOne({
      uniqueId: uniqueId,
      email: email,
    });

    if (!ccRecord) {
      return NextResponse.json(
        { success: false, message: "CC record not found" },
        { status: 404 }
      );
    }

    // Get the document
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(ccRecord.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    if (!document.cloudinaryPdfUrl) {
      return NextResponse.json(
        { success: false, message: "PDF file not available" },
        { status: 404 }
      );
    }

    // Extract public_id from URL
    const fileUrl = document.cloudinaryPdfUrl;
    const urlParts = fileUrl.split('/upload/');
    const afterUpload = urlParts[1];
    const pathParts = afterUpload.split('/');
    pathParts.shift(); // remove version
    let publicId = pathParts.join('/').replace('.pdf', '');
    publicId = decodeURIComponent(publicId);

    console.log('📝 Public ID:', publicId);

    // Generate authenticated download URL
    const downloadUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        attachment: false,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      }
    );

    console.log('🔐 Generated private download URL for CC');

    // Fetch the file from Cloudinary
    const cloudinaryResponse = await fetch(downloadUrl);

    if (!cloudinaryResponse.ok) {
      console.error('❌ Private download failed');
      return NextResponse.json({ 
        error: 'Failed to fetch file from Cloudinary',
        status: cloudinaryResponse.status,
      }, { status: 500 });
    }

    const arrayBuffer = await cloudinaryResponse.arrayBuffer();
    console.log('✅ File fetched:', arrayBuffer.byteLength, 'bytes');

    // Return the PDF file
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.originalFilename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('❌ Error fetching file:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}