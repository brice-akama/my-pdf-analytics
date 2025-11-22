import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // Verify ownership
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get uploaded file
    const formData = await request.formData();
    const file = formData.get('thumbnail') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be less than 5MB' }, { status: 400 });
    }

    // Create thumbnails directory if it doesn't exist
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    try {
      await mkdir(thumbnailsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${id}_${Date.now()}${ext}`;
    const filepath = path.join(thumbnailsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update document with thumbnail URL
    const thumbnailUrl = `/thumbnails/${filename}`;
    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $set: {
          thumbnail: thumbnailUrl,
          updatedAt: new Date(),
        },
      }
    );

    console.log('✅ Thumbnail updated:', thumbnailUrl);

    return NextResponse.json({
      success: true,
      message: 'Thumbnail updated successfully',
      thumbnailUrl,
    });

  } catch (error) {
    console.error('❌ Thumbnail upload error:', error);
    return NextResponse.json(
      { error: 'Failed to update thumbnail' },
      { status: 500 }
    );
  }
}