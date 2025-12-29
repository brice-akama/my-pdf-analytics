//app/api/spaces/[id]/folders/[folderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ GET: List deleted files (trash)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check access
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId),
      $or: [
        { ownerId: user.id },
        { 'members.userId': user.id }
      ]
    });

    if (!space) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied' 
      }, { status: 403 });
    }

    // Get deleted files
    const deletedFiles = await db.collection('space_files')
      .find({ 
        spaceId,
        deleted: true
      })
      .sort({ deletedAt: -1 })
      .toArray();

    // Auto-delete files older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredFiles = deletedFiles.filter(f => f.deletedAt < thirtyDaysAgo);
    if (expiredFiles.length > 0) {
      await db.collection('space_files').deleteMany({
        _id: { $in: expiredFiles.map(f => f._id) }
      });
      console.log(`✅ Auto-deleted ${expiredFiles.length} expired files from trash`);
    }

    // Return only non-expired files
    const activeTrash = deletedFiles.filter(f => f.deletedAt >= thirtyDaysAgo);

    return NextResponse.json({
      success: true,
      trash: activeTrash,
      count: activeTrash.length,
      autoDeleteDate: thirtyDaysAgo.toISOString()
    });

  } catch (error) {
    console.error('❌ Get trash error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}

// ✅ POST: Restore or empty trash
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const db = await dbPromise;

    // Check permission (editor for restore, admin for empty)
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json({ 
        success: false,
        error: 'Space not found' 
      }, { status: 404 });
    }

    const isOwner = space.ownerId === user.id;
    const member = space.members?.find((m: any) => m.userId === user.id);
    const userRole = isOwner ? 'owner' : member?.role || null;

    const body = await request.json();
    const { action, fileIds } = body;

    if (action === 'restore') {
      // Restore files
      if (!fileIds || !Array.isArray(fileIds)) {
        return NextResponse.json({ 
          success: false,
          error: 'No files specified' 
        }, { status: 400 });
      }

      const result = await db.collection('space_files').updateMany(
        { 
          _id: { $in: fileIds.map((id: string) => new ObjectId(id)) },
          spaceId,
          deleted: true
        },
        { 
          $unset: { deleted: "", deletedAt: "", deletedBy: "" },
          $set: { 
            restoredAt: new Date(),
            restoredBy: user.id
          }
        }
      );

      // Update space document count
      await db.collection('spaces').updateOne(
        { _id: new ObjectId(spaceId) },
        { 
          $inc: { documentsCount: result.modifiedCount },
          $set: { lastActivity: new Date() }
        }
      );

      console.log(`✅ Restored ${result.modifiedCount} files from trash`);

      return NextResponse.json({
        success: true,
        message: `Restored ${result.modifiedCount} file(s)`,
        restoredCount: result.modifiedCount
      });

    } else if (action === 'empty') {
      // Empty trash (admin/owner only)
      if (userRole !== 'owner' && userRole !== 'admin') {
        return NextResponse.json({ 
          success: false,
          error: 'Only owners and admins can empty trash' 
        }, { status: 403 });
      }

      // Permanently delete all files in trash
      const result = await db.collection('space_files').deleteMany({
        spaceId,
        deleted: true
      });

      console.log(`✅ Emptied trash: deleted ${result.deletedCount} files permanently`);

      return NextResponse.json({
        success: true,
        message: `Permanently deleted ${result.deletedCount} file(s)`,
        deletedCount: result.deletedCount
      });

    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid action' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Trash operation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}