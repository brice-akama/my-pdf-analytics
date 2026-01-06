// app/api/spaces/[id]/files/[fileId]/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

async function checkSpacePermission(
  db: any,
  spaceId: string,
  userId: string,
  userEmail: string,
  requiredRole: 'viewer' | 'editor' | 'admin' | 'owner'
): Promise<{ allowed: boolean }> {
  const space = await db.collection('spaces').findOne({
    _id: new ObjectId(spaceId)
  });

  if (!space) return { allowed: false };
  if (space.userId === userId) return { allowed: true };

  const member = space.members?.find((m: any) => 
    m.email === userEmail || m.userId === userId
  );
  
  if (!member) return { allowed: false };

  const roleHierarchy: Record<string, number> = {
    owner: 4, admin: 3, editor: 2, viewer: 1
  };

  return {
    allowed: (roleHierarchy[member.role] || 0) >= (roleHierarchy[requiredRole] || 0)
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const resolvedParams = await params;
    const spaceId = resolvedParams.id;
    const fileId = resolvedParams.fileId;

    console.log('📥 Download request:', { spaceId, fileId });

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    const { allowed } = await checkSpacePermission(
      db, 
      spaceId, 
      user.id, 
      user.email, 
      'viewer'
    );

    if (!allowed) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get document
    let document = await db.collection('documents').findOne({
      _id: new ObjectId(fileId),
      spaceId: spaceId,
      archived: { $ne: true }
    });

    if (!document) {
      document = await db.collection('documents').findOne({
        _id: new ObjectId(fileId),
        spaceId: new ObjectId(spaceId),
        archived: { $ne: true }
      });
    }

    if (!document || !document.cloudinaryPdfUrl) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    console.log('✅ Document found:', document.originalFilename);

    // Extract public_id from Cloudinary URL
    const fileUrl = document.cloudinaryPdfUrl;
    const urlParts = fileUrl.split('/upload/');
    if (urlParts.length < 2) {
      console.error('❌ Invalid Cloudinary URL format');
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 500 });
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
        attachment: true, // force download
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      }
    );

    console.log('🔐 Generated private download URL');

    // Fetch the file from Cloudinary
    const cloudinaryResponse = await fetch(downloadUrl);
    
    if (!cloudinaryResponse.ok) {
      console.error('❌ Cloudinary fetch failed:', cloudinaryResponse.status);
      return NextResponse.json({ 
        error: 'Failed to fetch file from Cloudinary'
      }, { status: 500 });
    }

    const arrayBuffer = await cloudinaryResponse.arrayBuffer();
    console.log('✅ File fetched:', arrayBuffer.byteLength, 'bytes');

    // Update download count (async, don't await)
    db.collection('documents').updateOne(
      { _id: new ObjectId(fileId) },
      {
        $inc: { 'tracking.downloads': 1 },
        $set: { 'tracking.lastDownloaded': new Date() }
      }
    ).catch(err => console.error('Failed to update download count:', err));

    // Return the PDF file
    const filename = document.originalFilename || 'document.pdf';
    
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('❌ Download error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}