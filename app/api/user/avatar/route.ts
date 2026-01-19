// app/api/user/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import { ObjectId } from 'mongodb';

export const maxDuration = 30;

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

async function uploadAvatarToCloudinary(buffer: Buffer, userId: string) {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { 
        folder: `users/${userId}/avatars`,
        public_id: `avatar_${Date.now()}`,
        resource_type: "image",
        type: 'upload',
        access_mode: 'public',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto:good' }
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || '');
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function deleteOldAvatarFromCloudinary(avatarUrl: string, userId: string) {
  try {
    // Extract public_id from Cloudinary URL
    const urlParts = avatarUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('.')[0];
    const publicId = `users/${userId}/avatars/${filename}`;
    
    await cloudinary.v2.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete old avatar:', error);
    // Don't throw - we still want to proceed with new upload
  }
}

// POST - Upload new avatar
export async function POST(request: NextRequest) {
  try {
    // Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are supported.' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Get current profile to delete old avatar
    const db = await dbPromise;
    const currentProfile = await db.collection('profiles').findOne({ 
      user_id: user.id 
    });

    // Delete old avatar from Cloudinary if it exists
    if (currentProfile?.avatarUrl) {
      await deleteOldAvatarFromCloudinary(currentProfile.avatarUrl, user.id);
    }

    // Upload new avatar to Cloudinary
    const avatarUrl = await uploadAvatarToCloudinary(buffer, user.id);

    // Update profile in database
    //  UPDATE BOTH COLLECTIONS
await db.collection('profiles').updateOne(
  { user_id: user.id },
  { $set: { avatarUrl, updatedAt: new Date() } },
  { upsert: true }
);

//  ALSO UPDATE users.profile.avatarUrl
await db.collection('users').updateOne(
  { _id: new ObjectId(user.id) },
  { $set: { 'profile.avatarUrl': avatarUrl, updated_at: new Date() } }
);

    return NextResponse.json({
  success: true,
    avatarUrl: avatarUrl,// Add cache-busting timestamp
  message: 'Avatar updated successfully'
});

  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    return NextResponse.json({
      error: 'Failed to upload avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    // Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    
    // Get current profile
    const currentProfile = await db.collection('profiles').findOne({ 
      user_id: user.id 
    });

    // Delete avatar from Cloudinary if it exists
    if (currentProfile?.avatarUrl) {
      await deleteOldAvatarFromCloudinary(currentProfile.avatarUrl, user.id);
    }

    // Remove avatar URL from profile
    //  REMOVE FROM BOTH COLLECTIONS
await db.collection('profiles').updateOne(
  { user_id: user.id },
  { $set: { avatarUrl: null, updatedAt: new Date() } }
);

await db.collection('users').updateOne(
  { _id: new ObjectId(user.id) },
  { $set: { 'profile.avatarUrl': null, updated_at: new Date() } }
);
    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully'
    });

  } catch (error) {
    console.error('❌ Avatar removal error:', error);
    return NextResponse.json({
      error: 'Failed to remove avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Retrieve current avatar
export async function GET(request: NextRequest) {
  try {
    // Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const profile = await db.collection('profiles').findOne({ 
      user_id: user.id 
    });

    return NextResponse.json({
      success: true,
      avatarUrl: profile?.avatarUrl || null
    });

  } catch (error) {
    console.error('❌ Avatar fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}