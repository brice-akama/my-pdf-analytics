//app/api/spaces/[id]/folders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET: List all folders in a space
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

    // Get all folders
    const folders = await db.collection('space_folders')
      .find({ spaceId })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      folders
    });

  } catch (error) {
    console.error('❌ Get folders error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Create a new folder
export async function POST(
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
        { 'members.userId': user.id, 'members.role': { $in: ['admin', 'editor'] } }
      ]
    });

    if (!space) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { name, description, parentFolderId } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Folder name is required' 
      }, { status: 400 });
    }

    // Check for duplicate folder name in same parent
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('space_folders').insertOne(folderRecord);

    console.log(`✅ Folder created in space ${spaceId}: ${name}`);

    return NextResponse.json({
      success: true,
      folder: { ...folderRecord, _id: result.insertedId },
      message: `Folder "${name}" created successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create folder error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}