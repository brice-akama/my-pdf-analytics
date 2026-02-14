// app/api/upload/logo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest } from '@/lib/auth';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { 
        folder: 'logos', 
        public_id: `logo_${Date.now()}`,
        resource_type: 'image',
        type: 'upload',
        access_mode: 'public',
        transformation: [
          { width: 400, height: 400, crop: 'limit' }, // Max dimensions
          { quality: 'auto:good' }, // Auto optimize
          { fetch_format: 'auto' } // Auto format (WebP for supported browsers)
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

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Logo upload request received');
    
    // ✅ Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User verified:', user.email);

    // ✅ Get file from form data
    const formData = await request.formData();
    const file = formData.get('logo') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No logo file provided' }, { status: 400 });
    }

    console.log('📁 File received:', file.name, 'Size:', file.size);

    // ✅ Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // ✅ Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Logo must be less than 2MB' }, { status: 400 });
    }

    // ✅ Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
    const logoUrl = await uploadToCloudinary(buffer, file.name);
    console.log('✅ Upload successful:', logoUrl);

    return NextResponse.json({
      success: true,
      logoUrl,
      message: 'Logo uploaded successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Logo upload error:', error);
    return NextResponse.json({
      error: 'Failed to upload logo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}