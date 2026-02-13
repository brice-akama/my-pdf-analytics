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

    console.log('👁️ View request:', { documentId: id, versionId });

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID required' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);
    const versionObjectId = new ObjectId(versionId);

    // ✅ Verify access
    const document = await db.collection('documents').findOne({
      _id: documentId,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || user.id;

    const hasAccess = 
      document.userId === user.id || 
      document.organizationId === organizationId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ✅ Get version
    const version = await db.collection('documentVersions').findOne({
      _id: versionObjectId,
      documentId: documentId
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    console.log('✅ Version found for view:', version.version);

    // ✅ Extract public_id
    const urlParts = version.cloudinaryPdfUrl.split('/upload/');
    if (urlParts.length < 2) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 500 });
    }

    const afterUpload = urlParts[1];
    const pathParts = afterUpload.split('/');
    pathParts.shift();
    let publicId = pathParts.join('/').replace('.pdf', '');
    publicId = decodeURIComponent(publicId);

    console.log('🔑 Public ID:', publicId);

    // ✅ Generate authenticated URL
    const authenticatedUrl = cloudinary.v2.utils.private_download_url(
      publicId,
      'pdf',
      {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    );

    // ✅ Fetch PDF
    const response = await fetch(authenticatedUrl);

    if (!response.ok) {
      console.error('❌ Failed to fetch PDF:', response.status);
      return NextResponse.json({ 
        error: 'Failed to fetch file' 
      }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();
    console.log('✅ PDF fetched for view:', buffer.byteLength, 'bytes');

    // ✅ Track view (non-blocking)
    db.collection('documentVersions').updateOne(
      { _id: versionObjectId },
      {
        $inc: { 'tracking.views': 1 },
        $set: { 'tracking.lastViewed': new Date() }
      }
    ).catch(err => console.error('Failed to track view:', err));

    // ✅ Return PDF for inline viewing
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline', // ✅ Key difference - inline not attachment
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('❌ View error:', error);
    return NextResponse.json(
      { error: 'Failed to view version' },
      { status: 500 }
    );
  }
}