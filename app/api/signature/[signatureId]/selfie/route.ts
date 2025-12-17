import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const body = await request.json();
    const { selfieImage, deviceInfo } = body;

    console.log('📸 Uploading selfie for signature:', signatureId);

    if (!selfieImage) {
      return NextResponse.json(
        { success: false, message: "Selfie image is required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Verify signature request exists
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // ⭐ CRITICAL CHECK: Selfie only allowed if access code was verified
    if (!signatureRequest.accessCodeRequired || !signatureRequest.accessCodeVerifiedAt) {
      return NextResponse.json(
        { success: false, message: "Selfie verification only available with access code verification" },
        { status: 400 }
      );
    }

    // Check if selfie verification is required
    if (!signatureRequest.selfieVerificationRequired) {
      return NextResponse.json(
        { success: false, message: "Selfie verification not required for this document" },
        { status: 400 }
      );
    }

    // Upload selfie to Cloudinary
    const uploadResult = await cloudinary.v2.uploader.upload(selfieImage, {
      folder: `docsend/selfies/${signatureRequest.documentId}`,
      resource_type: 'image',
      format: 'jpg',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    });

    console.log('✅ Selfie uploaded to Cloudinary:', uploadResult.secure_url);

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Store selfie data
    const selfieData = {
      selfieImageUrl: uploadResult.secure_url,
      selfieCloudinaryId: uploadResult.public_id,
      capturedAt: new Date(),
      ipAddress: ipAddress,
      userAgent: request.headers.get('user-agent'),
      deviceInfo: deviceInfo || {},
      imageMetadata: {
        width: uploadResult.width,
        height: uploadResult.height,
        fileSize: uploadResult.bytes,
        format: uploadResult.format,
      }
    };

    // Update signature request with selfie data
    await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId },
      {
        $set: {
          selfieVerification: selfieData,
          selfieVerifiedAt: new Date(),
        }
      }
    );

    console.log('✅ Selfie data saved to database');

    return NextResponse.json({
      success: true,
      message: "Selfie uploaded successfully",
      selfieUrl: uploadResult.secure_url,
    });

  } catch (error) {
    console.error('❌ Error uploading selfie:', error);
    return NextResponse.json(
      { success: false, message: "Failed to upload selfie" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve selfie (for sender's audit trail)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;

    const db = await dbPromise;

    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    if (!signatureRequest.selfieVerification) {
      return NextResponse.json(
        { success: false, message: "No selfie available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      selfie: signatureRequest.selfieVerification,
    });

  } catch (error) {
    console.error('❌ Error fetching selfie:', error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}