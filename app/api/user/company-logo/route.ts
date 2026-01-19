// app/api/user/company-logo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';

export const maxDuration = 30;

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

async function uploadLogoToCloudinary(buffer: Buffer, userId: string) {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { 
        folder: `users/${userId}/company-logo`,
        public_id: `logo_${Date.now()}`,
        resource_type: "image",
        type: 'upload',
        access_mode: 'public',
        transformation: [
          { width: 800, height: 400, crop: 'limit' }, // Maintain aspect ratio
          { quality: 'auto:best' },
          { fetch_format: 'auto' } // Auto-convert to WebP when possible
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

async function deleteOldLogoFromCloudinary(logoUrl: string, userId: string) {
  try {
    const urlParts = logoUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('.')[0];
    const publicId = `users/${userId}/company-logo/${filename}`;
    
    await cloudinary.v2.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete old logo:', error);
  }
}

// POST - Upload new company logo
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ✅ Accept PNG, SVG, JPG for logos
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PNG, JPG, SVG, and WebP are supported.' 
      }, { status: 400 });
    }

    // ✅ Max 2MB for logos
    const maxSize = 2 * 1024 * 1024;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2MB.' 
      }, { status: 400 });
    }

    const db = await dbPromise;
    const currentProfile = await db.collection('profiles').findOne({ 
      user_id: user.id 
    });

    // Delete old logo
    if (currentProfile?.companyLogoUrl) {
      await deleteOldLogoFromCloudinary(currentProfile.companyLogoUrl, user.id);
    }

    // Upload new logo
    const logoUrl = await uploadLogoToCloudinary(buffer, user.id);

    // Update profile
    await db.collection('profiles').updateOne(
      { user_id: user.id },
      { 
        $set: { 
          companyLogoUrl: logoUrl,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      logoUrl,
      message: 'Company logo updated successfully'
    });

  } catch (error) {
    console.error('❌ Logo upload error:', error);
    return NextResponse.json({
      error: 'Failed to upload logo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Remove company logo
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const currentProfile = await db.collection('profiles').findOne({ 
      user_id: user.id 
    });

    if (currentProfile?.companyLogoUrl) {
      await deleteOldLogoFromCloudinary(currentProfile.companyLogoUrl, user.id);
    }

    await db.collection('profiles').updateOne(
      { user_id: user.id },
      { 
        $set: { 
          companyLogoUrl: null,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Company logo removed successfully'
    });

  } catch (error) {
    console.error('❌ Logo removal error:', error);
    return NextResponse.json({
      error: 'Failed to remove logo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Retrieve current logo
export async function GET(request: NextRequest) {
  try {
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
      logoUrl: profile?.companyLogoUrl || null
    });

  } catch (error) {
    console.error('❌ Logo fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch logo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}