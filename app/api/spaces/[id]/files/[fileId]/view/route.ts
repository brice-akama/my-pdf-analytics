 // app/api/spaces/[id]/files/[fileId]/view/route.ts
// ======================================
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Helper function (same as in your main route.ts)
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

    // Update view count
    await db.collection('documents').updateOne(
      { _id: new ObjectId(fileId) },
      {
        $inc: { 'tracking.views': 1 },
        $set: { 'tracking.lastViewed': new Date() },
        $addToSet: { 'tracking.uniqueVisitors': user.id }
      }
    );

    // Redirect to Cloudinary URL
    return NextResponse.redirect(document.cloudinaryPdfUrl);

  } catch (error) {
    console.error('View error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}