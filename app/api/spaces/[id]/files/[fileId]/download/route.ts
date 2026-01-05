 // app/api/spaces/[id]/files/[fileId]/download/route.ts
// ======================================
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Helper function (same as above)
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

    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permission
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

    // Update download count
    await db.collection('documents').updateOne(
      { _id: new ObjectId(fileId) },
      {
        $inc: { 'tracking.downloads': 1 },
        $set: { 'tracking.lastDownloaded': new Date() }
      }
    );

    // Fetch file from Cloudinary
    const fileResponse = await fetch(document.cloudinaryPdfUrl);
    
    if (!fileResponse.ok) {
      throw new Error('Failed to fetch file from Cloudinary');
    }

    const fileBlob = await fileResponse.blob();
    const buffer = await fileBlob.arrayBuffer();

    // Return file as download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.originalFilename || 'document.pdf'}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}