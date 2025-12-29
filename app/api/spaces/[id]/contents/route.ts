//app/api/spaces/[id]/contents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get folders
    const folders = await db.collection('space_folders')
      .find({ spaceId })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    // Get files
    const files = await db.collection('space_files')
      .find({ spaceId })
      .sort({ addedAt: -1 })
      .toArray();

    // Enrich files with document data
    const enrichedFiles = await Promise.all(
      files.map(async (file) => {
        const document = await db.collection('documents').findOne({
          _id: new ObjectId(file.documentId)
        });

        return {
          ...file,
          cloudinaryPdfUrl: document?.cloudinaryPdfUrl,
          numPages: document?.numPages,
          analytics: document?.analytics
        };
      })
    );

    return NextResponse.json({
      success: true,
      space: {
        _id: space._id,
        name: space.name,
        type: space.type,
        settings: space.settings
      },
      folders,
      files: enrichedFiles,
      stats: {
        totalFolders: folders.length,
        totalFiles: files.length
      }
    });

  } catch (error) {
    console.error('❌ Get space contents error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}