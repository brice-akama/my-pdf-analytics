import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { email } = await request.json();
    
    const db = await dbPromise;
    
    // Find share record
    const share = await db.collection('shares').findOne({
      shareToken: params.token
    });

    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Get document with file data
    const document = await db.collection('documents').findOne({
      _id: share.documentId
    });

    if (!document || !document.fileData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(document.fileData, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Fetch file error:', error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}

// ✅ GET - Serve PDF file through proxy for shared documents
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    console.log('📄 File request received for token:', token.substring(0, 8) + '...');

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

    // ✅ Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ 
        error: 'This share link has expired' 
      }, { status: 410 });
    }

    // ✅ Check max views
    if (share.settings.maxViews && share.tracking.views >= share.settings.maxViews) {
      return NextResponse.json({ 
        error: 'View limit reached' 
      }, { status: 403 });
    }

    // ✅ Get document
    const document = await db.collection('documents').findOne({
      _id: share.documentId,
    });

    if (!document || !document.cloudinaryPdfUrl) {
      return NextResponse.json({ 
        error: 'Document file not found' 
      }, { status: 404 });
    }

    // ✅ Check if it's a print request (and if printing is disabled)
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'print' && !share.settings.allowPrint) {
      return NextResponse.json({ 
        error: 'Printing is not allowed for this document' 
      }, { status: 403 });
    }

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

      console.log('📄 Serving shared document:', {
        shareToken: token.substring(0, 8) + '...',
        publicId,
        filename: document.originalFilename,
      });

      // ✅ Generate signed download URL with expiration
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

      // ✅ Fetch file from Cloudinary
      const cloudinaryResponse = await fetch(downloadUrl);

      if (!cloudinaryResponse.ok) {
        console.error('❌ Cloudinary fetch failed:', cloudinaryResponse.status);
        return NextResponse.json({ 
          error: 'Failed to fetch file from storage',
          status: cloudinaryResponse.status,
        }, { status: 500 });
      }

      const arrayBuffer = await cloudinaryResponse.arrayBuffer();

      console.log('✅ File served:', arrayBuffer.byteLength, 'bytes');

      // ✅ Track file view in share analytics
      await db.collection('shares').updateOne(
        { _id: share._id },
        { 
          $inc: { 'tracking.fileViews': 1 },
          $set: { updatedAt: new Date() }
        }
      ).catch(err => console.error('Failed to track file view:', err));

      // ✅ Return PDF file
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${document.originalFilename}"`,
          'Content-Length': arrayBuffer.byteLength.toString(),
          'Cache-Control': 'private, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
        },
      });

    } catch (error) {
      console.error('❌ Failed to serve file:', error);
      return NextResponse.json({ 
        error: 'Failed to serve file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ File proxy error:', error);
    return NextResponse.json({
      error: 'Failed to serve file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}