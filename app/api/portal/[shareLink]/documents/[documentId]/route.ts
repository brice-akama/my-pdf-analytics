// app/api/portal/[shareLink]/documents/[documentId]/route.ts
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
  context: { params: { shareLink: string; documentId: string } | Promise<{ shareLink: string; documentId: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const { shareLink, documentId } = params;
    
    // Check if this is a download request
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === 'true';
    
    console.log('🔍 Document request:', { shareLink, documentId, isDownload });
    
    const db = await dbPromise;

    // Verify the share link is valid
    const space = await db.collection("spaces").findOne({
      'publicAccess.shareLink': shareLink,
      'publicAccess.enabled': true
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: "Invalid share link" },
        { status: 404 }
      );
    }

    // Get the document
    const document = await db.collection("documents").findOne({
      _id: new ObjectId(documentId),
      spaceId: space._id.toString()
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

    // Extract public_id from Cloudinary URL
    const fileUrl = document.cloudinaryPdfUrl;
    const urlParts = fileUrl.split('/upload/');
    if (urlParts.length < 2) {
      console.error('❌ Invalid Cloudinary URL format');
      return NextResponse.json(
        { success: false, message: "Invalid file URL" },
        { status: 500 }
      );
    }
    
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
        attachment: isDownload, // true for download, false for inline view
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      }
    );

    console.log('🔐 Generated private download URL');

    // Fetch the file from Cloudinary
    const cloudinaryResponse = await fetch(downloadUrl);
    
    console.log('📡 Cloudinary response status:', cloudinaryResponse.status);

    if (!cloudinaryResponse.ok) {
      console.error('❌ Cloudinary fetch failed:', cloudinaryResponse.status, cloudinaryResponse.statusText);
      return NextResponse.json({ 
        error: 'Failed to fetch file from Cloudinary',
        status: cloudinaryResponse.status,
        details: cloudinaryResponse.statusText
      }, { status: 500 });
    }

    const arrayBuffer = await cloudinaryResponse.arrayBuffer();
    console.log('✅ File fetched:', arrayBuffer.byteLength, 'bytes');

    // Log the view/download (don't await, let it run in background)
    db.collection('document_views').insertOne({
      documentId: documentId,
      spaceId: space._id,
      shareLink: shareLink,
      action: isDownload ? 'download' : 'view',
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }).catch(err => console.error('Failed to log view:', err));

    // Return the PDF file
    const filename = document.originalFilename || document.filename || 'document.pdf';
    
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isDownload 
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('❌ Error fetching document:', error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}