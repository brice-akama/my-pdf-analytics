//api/signature/[signatureId]/record-intent-video/route.ts
import { dbPromise } from "@/app/api/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb', //  
    },
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> } // ⭐ CHANGED: params is now a Promise
) {
  try {
    const { signatureId } = await params; // ⭐ CHANGED: await params
    
    console.log('📹 Received intent video recording request for:', signatureId);

    // Parse FormData instead of JSON
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json(
        { success: false, message: "No video data provided" },
        { status: 400 }
      );
    }

    console.log('📤 Uploading video to Cloudinary...', {
      size: videoFile.size,
      type: videoFile.type
    });

    // Convert File to buffer
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload buffer to Cloudinary with proper typing
    const uploadResponse = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "intent-videos",
          transformation: [{ quality: "auto", fetch_format: "mp4" }],
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error('Upload failed without error'));
        }
      ).end(buffer);
    });

    console.log('✅ Video uploaded to Cloudinary:', uploadResponse.secure_url);

    const db = await dbPromise;

    const result = await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId },
      {
        $set: {
          intentVideoUrl: uploadResponse.secure_url,
          intentVideoRecordedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Intent video saved for ${signatureId}`);

    return NextResponse.json({
      success: true,
      message: "Intent video recorded successfully",
      videoUrl: uploadResponse.secure_url,
      recordedAt: new Date(),
    });

  } catch (error: any) {
    console.error("❌ Error recording intent video:", error);
    console.error("Error details:", error.message);

    return NextResponse.json(
      { 
        success: false, 
        message: "Server error while saving video",
        error: error.message 
      },
      { status: 500 }
    );
  }
}