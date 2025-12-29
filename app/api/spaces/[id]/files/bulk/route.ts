//app/api/spaces/[id]/files/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ HELPER: Check permission
async function checkSpacePermission(
  db: any,
  spaceId: string,
  userId: string,
  requiredRole: 'viewer' | 'editor' | 'admin' | 'owner'
): Promise<{ allowed: boolean; userRole: string | null }> {
  const space = await db.collection('spaces').findOne({
    _id: new ObjectId(spaceId)
  });

  if (!space) return { allowed: false, userRole: null };
  if (space.ownerId === userId) return { allowed: true, userRole: 'owner' };

  const member = space.members?.find((m: any) => m.userId === userId);
  if (!member) return { allowed: false, userRole: null };

  const roleHierarchy: Record<string, number> = {
    owner: 4,
    admin: 3,
    editor: 2,
    viewer: 1
  };

  const userLevel = roleHierarchy[member.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return {
    allowed: userLevel >= requiredLevel,
    userRole: member.role
  };
}

// ✅ POST: Bulk operations
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

    // Check permission
    const { allowed, userRole } = await checkSpacePermission(db, spaceId, user.id, 'editor');
    if (!allowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient permissions' 
      }, { status: 403 });
    }

    const { action, fileIds, targetFolderId } = await request.json();

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No files selected' 
      }, { status: 400 });
    }

    // Limit bulk operations
    if (fileIds.length > 100) {
      return NextResponse.json({ 
        success: false,
        error: 'Maximum 100 files per bulk operation' 
      }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ fileId: string; error: string }>
    };

    switch (action) {
      case 'move':
        // Validate target folder
        if (targetFolderId) {
          const folder = await db.collection('space_folders').findOne({
            _id: new ObjectId(targetFolderId),
            spaceId
          });

          if (!folder) {
            return NextResponse.json({ 
              success: false,
              error: 'Target folder not found' 
            }, { status: 404 });
          }
        }

        // Move files
        for (const fileId of fileIds) {
          try {
            const file = await db.collection('space_files').findOne({
              _id: new ObjectId(fileId),
              spaceId,
              deleted: { $ne: true }
            });

            if (!file) {
              results.failed++;
              results.errors.push({ fileId, error: 'File not found' });
              continue;
            }

            // Check for duplicate
            const duplicate = await db.collection('space_files').findOne({
              spaceId,
              folderId: targetFolderId || null,
              filename: file.filename,
              _id: { $ne: new ObjectId(fileId) },
              deleted: { $ne: true }
            });

            if (duplicate) {
              results.failed++;
              results.errors.push({ fileId, error: 'Duplicate filename in target folder' });
              continue;
            }

            await db.collection('space_files').updateOne(
              { _id: new ObjectId(fileId) },
              { 
                $set: { 
                  folderId: targetFolderId || null,
                  updatedAt: new Date(),
                  updatedBy: user.id
                } 
              }
            );

            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ 
              fileId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }

        await db.collection('space_activity_logs').insertOne({
          spaceId,
          userId: user.id,
          action: 'bulk_move_files',
          details: {
            fileCount: fileIds.length,
            targetFolderId,
            results
          },
          timestamp: new Date()
        });

        console.log(`✅ Bulk move completed: ${results.success} succeeded, ${results.failed} failed`);
        break;

      case 'delete':
        // Soft delete files
        for (const fileId of fileIds) {
          try {
            const file = await db.collection('space_files').findOne({
              _id: new ObjectId(fileId),
              spaceId,
              deleted: { $ne: true }
            });

            if (!file) {
              results.failed++;
              results.errors.push({ fileId, error: 'File not found' });
              continue;
            }

            await db.collection('space_files').updateOne(
              { _id: new ObjectId(fileId) },
              { 
                $set: { 
                  deleted: true,
                  deletedAt: new Date(),
                  deletedBy: user.id
                } 
              }
            );

            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ 
              fileId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }

        // Update space document count
        await db.collection('spaces').updateOne(
          { _id: new ObjectId(spaceId) },
          { 
            $inc: { documentsCount: -results.success },
            $set: { lastActivity: new Date() }
          }
        );

        await db.collection('space_activity_logs').insertOne({
          spaceId,
          userId: user.id,
          action: 'bulk_delete_files',
          details: {
            fileCount: fileIds.length,
            results
          },
          timestamp: new Date()
        });

        console.log(`✅ Bulk delete completed: ${results.success} succeeded, ${results.failed} failed`);
        break;

      default:
        return NextResponse.json({ 
          success: false,
          error: 'Invalid action' 
        }, { status: 400 });
    }

    // Update space last activity
    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      { $set: { lastActivity: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed`,
      results
    });

  } catch (error) {
    console.error('❌ Bulk operation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error' 
    }, { status: 500 });
  }
}