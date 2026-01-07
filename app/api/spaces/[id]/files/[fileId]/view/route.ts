 // app/api/spaces/[id]/files/[fileId]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { checkFolderAccess } from '@/lib/folderPermissions';
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
): Promise<{ allowed: boolean; userRole: string | null }> {
  const space = await db.collection('spaces').findOne({
    _id: new ObjectId(spaceId)
  });

  if (!space) return { allowed: false, userRole: null };
  if (space.userId === userId) return { allowed: true, userRole: 'owner' };

  const member = space.members?.find((m: any) => 
    m.email === userEmail || m.userId === userId
  );
  
  if (!member) return { allowed: false, userRole: null };

  const roleHierarchy: Record<string, number> = {
    owner: 4, admin: 3, editor: 2, viewer: 1
  };

  const userLevel = roleHierarchy[member.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return {
    allowed: userLevel >= requiredLevel,
    userRole: member.role
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

    console.log('👁️ View request:', { spaceId, fileId });

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Check space-level permission first
    const { allowed } = await checkSpacePermission(
      db, 
      spaceId, 
      user.id, 
      user.email, 
      'viewer'
    );

    if (!allowed) {
      return NextResponse.json({ error: 'Access denied to space' }, { status: 403 });
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

    // ✅ NEW: Check folder-level permission if document is in a folder
    if (document.folder) {
      const folderAccess = await checkFolderAccess(
        db,
        document.folder,
        spaceId,
        user.email
      );

      if (!folderAccess.hasAccess) {
        console.log(`❌ Folder access denied: ${folderAccess.reason}`);
        return NextResponse.json({ 
          error: folderAccess.reason || 'Access denied to this folder' 
        }, { status: 403 });
      }

      console.log('✅ Folder access granted:', folderAccess.permission.role);
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
        attachment: false, // inline view, not download
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

    // Update view count (async, don't await)
    db.collection('documents').updateOne(
      { _id: new ObjectId(fileId) },
      {
        $inc: { 'tracking.views': 1 },
        $set: { 'tracking.lastViewed': new Date() },
        $addToSet: { 'tracking.uniqueVisitors': user.id }
      }
    ).catch(err => console.error('Failed to update view count:', err));

    // ✅ NEW: Update folder permission last accessed
    if (document.folder) {
      db.collection('folder_permissions').updateOne(
        {
          folderId: document.folder,
          spaceId,
          grantedTo: user.email.toLowerCase()
        },
        {
          $set: { lastAccessed: new Date() }
        }
      ).catch(err => console.error('Failed to update folder permission:', err));
    }

    // Return the PDF file
    const filename = document.originalFilename || 'document.pdf';
    
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('❌ View error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}