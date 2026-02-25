//app/api/spaces/[id]/folders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET: List all folders in a space
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const spaceId = params.id;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // ✅ FIXED: Check access using email (like your space structure)
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    // Check if user has access (by email in members array)
    const hasAccess = space.userId === user.id || 
  space.members?.some((m: any) => m.email === user.email)
 

    if (!hasAccess) {
      console.log('❌ Access denied for user:', user.email);
      console.log('   Space members:', space.members);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all folders for this space
    const folders = await db.collection('space_folders')
      .find({ spaceId })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    // Count documents in each folder
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const docCount = await db.collection('documents').countDocuments({
          spaceId: spaceId,
          folder: folder._id.toString()
        });

        return {
          id: folder._id.toString(),
          name: folder.name,
          documentCount: docCount,
          lastUpdated: folder.updatedAt?.toISOString() || 'Never',
          createdAt: folder.createdAt
        };
      })
    );

    console.log(`✅ Loaded ${foldersWithCounts.length} folders for space ${spaceId}`);

    return NextResponse.json({
      success: true,
      folders: foldersWithCounts
    });

  } catch (error) {
    console.error('❌ Get folders error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Create a new folder
export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const spaceId = params.id;
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // ✅ FIXED: Check access using email
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    // Check if user is owner, admin, or editor
    
const isOwner = space.userId === user.id
const userMember = space.members?.find((m: any) => m.email === user.email)
const userRole = isOwner ? 'owner' : userMember?.role

if (!isOwner && (!userMember || !['admin', 'editor'].includes(userRole))) {
  return NextResponse.json({ 
    error: 'You do not have permission to create folders' 
  }, { status: 403 });
}

    const { name, description, parentFolderId } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Folder name is required' 
      }, { status: 400 });
    }

    // Check for duplicate folder name
    const existingFolder = await db.collection('space_folders').findOne({
      spaceId,
      parentFolderId: parentFolderId || null,
      name: name.trim()
    });

    if (existingFolder) {
      return NextResponse.json({ 
        error: 'Folder with this name already exists' 
      }, { status: 400 });
    }

    const folderRecord = {
      spaceId,
      name: name.trim(),
      description: description || '',
      parentFolderId: parentFolderId || null,
      order: 0,
      createdBy: user.id,
      createdByEmail: user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('space_folders').insertOne(folderRecord);

    console.log(`✅ Folder created in space ${spaceId}: ${name}`);

    return NextResponse.json({
      success: true,
      folder: { 
        id: result.insertedId.toString(),
        name: folderRecord.name,
        documentCount: 0,
        lastUpdated: 'Just now',
        createdAt: folderRecord.createdAt
      },
      message: `Folder "${name}" created successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create folder error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}