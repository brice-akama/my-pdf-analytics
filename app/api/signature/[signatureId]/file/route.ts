// app/api/signature/[signatureId]/file/route.ts

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
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    
    console.log('🔍 Fetching file for signature request:', signatureId);
    
    const db = await dbPromise;

    // Verify signature request exists and is valid
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // Check if already signed
    if (signatureRequest.status === "signed") {
      return NextResponse.json(
        { success: false, message: "Document already signed" },
        { status: 400 }
      );
    }

    // Check if expired
    if (
      signatureRequest.dueDate &&
      new Date(signatureRequest.dueDate) < new Date()
    ) {
      return NextResponse.json(
        { success: false, message: "Signature request expired" },
        { status: 400 }
      );
    }

    // Get the document
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(signatureRequest.documentId),
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

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');

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
        attachment: false, // inline for viewing
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      }
    );

    console.log('🔐 Generated private download URL');

    // Fetch the file from Cloudinary
    const cloudinaryResponse = await fetch(downloadUrl);
    
    console.log('📡 Response status:', cloudinaryResponse.status);

    if (!cloudinaryResponse.ok) {
      console.error('❌ Private download failed');
      return NextResponse.json({ 
        error: 'Failed to fetch file from Cloudinary',
        status: cloudinaryResponse.status,
      }, { status: 500 });
    }

    const arrayBuffer = await cloudinaryResponse.arrayBuffer();
    console.log('✅ File fetched:', arrayBuffer.byteLength, 'bytes');

    // Log the view (don't await, let it run in background)
    db.collection('signature_views').insertOne({
      signatureId: signatureId,
      documentId: signatureRequest.documentId,
      page: page ? parseInt(page) : null,
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }).catch(err => console.error('Failed to log view:', err));

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