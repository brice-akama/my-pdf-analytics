import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');

    console.log('📥 Download request:', { documentId: id, versionId });

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID required' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);
    const versionObjectId = new ObjectId(versionId);

    // ✅ Verify document access
    const document = await db.collection('documents').findOne({
      _id: documentId,
    });

    if (!document) {
      console.error('❌ Document not found:', id);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || user.id;

    const hasAccess = 
      document.userId === user.id || 
      document.organizationId === organizationId;

    if (!hasAccess) {
      console.error('❌ Access denied:', { userId: user.id, docUserId: document.userId });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ✅ Get the version
    const version = await db.collection('documentVersions').findOne({
      _id: versionObjectId,
      documentId: documentId
    });

    if (!version) {
      console.error('❌ Version not found:', versionId);
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    console.log('✅ Version found:', {
      version: version.version,
      filename: version.filename,
      url: version.cloudinaryPdfUrl
    });

    // ✅ CHECK EXPIRY STATUS
if (version.expiryDate) {
  const expiryDate = new Date(version.expiryDate);
  const now = new Date();
  
  if (expiryDate < now) {
    console.error('❌ Version expired:', {
      version: version.version,
      expiredOn: expiryDate,
      daysExpired: Math.ceil((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24))
    });

    // ✅ Log attempted download of expired version
    await db.collection('compliance_logs').insertOne({
      action: 'blocked_expired_download',
      documentId: id,
      versionId: versionId,
      version: version.version,
      userId: user.id,
      userEmail: profile?.email || user.email,
      expiryDate: version.expiryDate,
      expiryReason: version.expiryReason,
      timestamp: new Date(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }).catch(err => console.error('Failed to log compliance event:', err));

    return NextResponse.json({ 
      error: 'This version has expired and cannot be downloaded',
      expiryDate: version.expiryDate,
      expiryReason: version.expiryReason,
      daysExpired: Math.ceil((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24)),
      message: version.expiryReason || 'This document version is no longer valid. Please use the current version.',
      canOverride: document.userId === user.id // Only owner can override
    }, { status: 403 });
  }

  // ✅ Warn if expiring soon (within 7 days)
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
    console.warn('⚠️ Version expiring soon:', {
      version: version.version,
      daysUntilExpiry
    });
  }
}

    // ✅ CRITICAL FIX: Extract public_id and use Cloudinary's authenticated download
    const urlParts = version.cloudinaryPdfUrl.split('/upload/');
    if (urlParts.length < 2) {
      console.error('❌ Invalid Cloudinary URL format:', version.cloudinaryPdfUrl);
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 500 });
    }

    const afterUpload = urlParts[1];
    const pathParts = afterUpload.split('/');
    pathParts.shift(); // Remove version number (v1770918610)
    let publicId = pathParts.join('/').replace('.pdf', '');
    publicId = decodeURIComponent(publicId);

    console.log('🔑 Extracted Public ID:', publicId);

    // ✅ Generate authenticated download URL (like your signature route)
    const authenticatedUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      }
    );

    console.log('🔐 Generated authenticated URL');

    // ✅ Fetch with authenticated URL
    const response = await fetch(authenticatedUrl);

    if (!response.ok) {
      console.error('❌ Cloudinary fetch failed:', {
        status: response.status,
        statusText: response.statusText,
      });
      return NextResponse.json({ 
        error: 'Failed to fetch file from storage',
        status: response.status,
        details: response.statusText
      }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();
    console.log('✅ File fetched:', buffer.byteLength, 'bytes');

    const filename = `${version.filename.replace(/\.[^/.]+$/, '')}_v${version.version}.pdf`;

    // ✅ Track download (non-blocking)
    db.collection('documentVersions').updateOne(
      { _id: versionObjectId },
      {
        $inc: { 'tracking.downloads': 1 },
        $set: { 'tracking.lastDownloaded': new Date() }
      }
    ).catch(err => console.error('Failed to track download:', err));

    // ✅ Log analytics (non-blocking)
    db.collection('analytics_logs').insertOne({
      documentId: id,
      versionId: versionId,
      action: 'version_downloaded',
      userId: user.id,
      version: version.version,
      timestamp: new Date(),
    }).catch(err => console.error('Failed to log analytics:', err));

    console.log('✅ Download successful:', filename);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('❌ Version download error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to download version',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}