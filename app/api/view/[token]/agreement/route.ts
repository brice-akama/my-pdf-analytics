// app/api/view/[token]/agreement/route.ts
// Proxies the NDA agreement PDF through your server so the iframe can load it
// without being blocked by Cloudinary's cross-origin restrictions.

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import cloudinary from 'cloudinary';

// Configure Cloudinary — same pattern as documents/[id]/file/route.ts
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const db = await dbPromise;

    // Find the share by token
    const share = await db.collection('shares').findOne({ shareToken: token });

    if (!share) {
      return new NextResponse('Share not found', { status: 404 });
    }

    if (!share.active) {
      return new NextResponse('Share link is inactive', { status: 403 });
    }

    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return new NextResponse('Share link has expired', { status: 410 });
    }

    // Must have NDA configured
    if (!share.settings?.requireNDA || !share.settings?.ndaUrl) {
      return new NextResponse('No agreement configured', { status: 404 });
    }

    const ndaUrl = share.settings.ndaUrl;
    console.log('📜 Proxying agreement PDF from:', ndaUrl);

    // Extract public_id from Cloudinary URL — same pattern as documents/[id]/file/route.ts
    const urlParts = ndaUrl.split('/upload/');
    const afterUpload = urlParts[1];
    const pathParts = afterUpload.split('/');
    pathParts.shift(); // remove version e.g. v1772986769
    let publicId = pathParts.join('/').replace('.pdf', '');
    publicId = decodeURIComponent(publicId);

    console.log('📜 Agreement public_id:', publicId);

    // Generate signed Cloudinary URL — same pattern as documents/[id]/file/route.ts
    const signedUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

    console.log('🔐 Generated signed URL for agreement');

    const cloudinaryResponse = await fetch(signedUrl);

    console.log('📡 Cloudinary response status:', cloudinaryResponse.status);

    if (!cloudinaryResponse.ok) {
      console.error('❌ Failed to fetch agreement with signed URL:', cloudinaryResponse.status);
      return new NextResponse('Failed to load agreement', { status: 502 });
    }

    const arrayBuffer = await cloudinaryResponse.arrayBuffer();
    console.log('✅ Agreement PDF proxied:', arrayBuffer.byteLength, 'bytes');

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="agreement.pdf"',
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('❌ Agreement proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}