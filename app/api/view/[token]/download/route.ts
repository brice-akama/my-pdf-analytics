// app/api/view/[token]/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// ✅ POST - Download shared document
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const db = await dbPromise;

    // ✅ Find share record
    const share = await db.collection('shares').findOne({
      shareToken: token,
      active: true,
    });

    if (!share) {
      return NextResponse.json({ 
        error: 'Share link not found or has been revoked' 
      }, { status: 404 });
    }

    // ✅ Check if download is allowed
    if (!share.settings.allowDownload) {
      return NextResponse.json({ 
        error: 'Downloads are not allowed for this document' 
      }, { status: 403 });
    }

    // ✅ Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ 
        error: 'This share link has expired' 
      }, { status: 410 });
    }

    // ✅ Get document
    const document = await db.collection('documents').findOne({
      _id: share.documentId,
    });

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found' 
      }, { status: 404 });
    }

    if (!document.cloudinaryPdfUrl) {
      return NextResponse.json({ 
        error: 'Document file not available' 
      }, { status: 404 });
    }

    // ✅ Track download
    await db.collection('shares').updateOne(
      { _id: share._id },
      { 
        $inc: { 'tracking.downloads': 1 },
        $set: { updatedAt: new Date() }
      }
    );

    // ✅ Log download event
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    await db.collection('analytics_logs').insertOne({
      documentId: document._id.toString(),
      shareId: share._id.toString(),
      action: 'document_downloaded',
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip,
    }).catch(err => console.error('Failed to log download:', err));

    try {
      // ✅ Extract public_id from Cloudinary URL
      const urlParts = document.cloudinaryPdfUrl.split('/upload/');
      if (urlParts.length < 2) {
        throw new Error('Invalid Cloudinary URL format');
      }

      const afterUpload = urlParts[1];
      const pathParts = afterUpload.split('/');
      pathParts.shift(); // remove version (e.g., v1234567890)
      let publicId = pathParts.join('/').replace('.pdf', '');
      publicId = decodeURIComponent(publicId);

      console.log('📥 Download request:', {
        shareToken: token.substring(0, 8) + '...',
        publicId,
        filename: document.originalFilename,
      });

      // ✅ Generate signed download URL
      const downloadUrl = cloudinary.v2.utils.private_download_url(
        publicId,
        'pdf',
        {
          resource_type: 'image',
          type: 'upload',
          attachment: true, // Force download
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        }
      );

      // ✅ Fetch file from Cloudinary
      const cloudinaryResponse = await fetch(downloadUrl);
      
      if (!cloudinaryResponse.ok) {
        console.error('❌ Cloudinary download failed:', cloudinaryResponse.status);
        return NextResponse.json({ 
          error: 'Failed to retrieve file from storage',
          status: cloudinaryResponse.status,
        }, { status: 500 });
      }

      const arrayBuffer = await cloudinaryResponse.arrayBuffer();

      console.log('✅ Download served:', arrayBuffer.byteLength, 'bytes');

      // ✅ Return file with download headers
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${document.originalFilename}"`,
          'Content-Length': arrayBuffer.byteLength.toString(),
          'Cache-Control': 'private, no-cache',
        },
      });

    } catch (error) {
      console.error('❌ Download error:', error);
      return NextResponse.json({ 
        error: 'Failed to download file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Download error:', error);
    return NextResponse.json({
      error: 'Failed to download document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}