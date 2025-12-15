// app/api/signature/[signatureId]/access-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { 
  verifyAccessCode, 
  ACCESS_CODE_SETTINGS 
} from "@/lib/accessCodeConfig";

// POST - Verify access code before allowing access to document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signatureId: string }> }
) {
  try {
    const { signatureId } = await params;
    const { accessCode } = await request.json();

    if (!accessCode) {
      return NextResponse.json(
        { success: false, message: "Access code is required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Get signature request
    const signatureRequest = await db.collection("signature_requests").findOne({
      uniqueId: signatureId,
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { success: false, message: "Signature request not found" },
        { status: 404 }
      );
    }

    // Check if access code is enabled
    if (!signatureRequest.accessCodeRequired || !signatureRequest.accessCodeHash) {
      return NextResponse.json(
        { success: false, message: "Access code not configured for this document" },
        { status: 400 }
      );
    }

    // Check for lockout
    const now = new Date();
    if (signatureRequest.accessCodeLockoutUntil && new Date(signatureRequest.accessCodeLockoutUntil) > now) {
      const minutesRemaining = Math.ceil(
        (new Date(signatureRequest.accessCodeLockoutUntil).getTime() - now.getTime()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          success: false,
          message: `Too many failed attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
          locked: true,
          lockoutUntil: signatureRequest.accessCodeLockoutUntil,
        },
        { status: 429 }
      );
    }

    // Verify access code
    const isValid = await verifyAccessCode(accessCode, signatureRequest.accessCodeHash);

    if (!isValid) {
      // Increment failed attempts
      const failedAttempts = (signatureRequest.accessCodeFailedAttempts || 0) + 1;
      const maxAttempts = ACCESS_CODE_SETTINGS.maxAttempts;

      const updateData: any = {
        accessCodeFailedAttempts: failedAttempts,
        lastAccessCodeAttempt: now,
      };

      // Check if should lock out
      if (failedAttempts >= maxAttempts) {
        const lockoutUntil = new Date(
          now.getTime() + ACCESS_CODE_SETTINGS.lockoutDurationMinutes * 60 * 1000
        );
        updateData.accessCodeLockoutUntil = lockoutUntil;

        await db.collection("signature_requests").updateOne(
          { uniqueId: signatureId },
          { $set: updateData }
        );

        console.log(`🔒 Access code locked out for ${signatureId} until ${lockoutUntil}`);

        return NextResponse.json(
          {
            success: false,
            message: `Too many failed attempts. Account locked for ${ACCESS_CODE_SETTINGS.lockoutDurationMinutes} minutes.`,
            locked: true,
            lockoutUntil: lockoutUntil,
          },
          { status: 429 }
        );
      }

      await db.collection("signature_requests").updateOne(
        { uniqueId: signatureId },
        { $set: updateData }
      );

      const attemptsRemaining = maxAttempts - failedAttempts;

      console.log(`❌ Invalid access code attempt for ${signatureId}. ${attemptsRemaining} attempts remaining.`);

      return NextResponse.json(
        {
          success: false,
          message: `Invalid access code. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`,
          attemptsRemaining,
        },
        { status: 401 }
      );
    }

    // ✅ Access code is correct
    // Reset failed attempts and grant access
    await db.collection("signature_requests").updateOne(
      { uniqueId: signatureId },
      {
        $set: {
          accessCodeFailedAttempts: 0,
          accessCodeLockoutUntil: null,
          accessCodeVerifiedAt: now,
          lastAccessCodeAttempt: now,
        },
      }
    );

    // Create audit log
    await db.collection("access_code_logs").insertOne({
      signatureId: signatureId,
      documentId: signatureRequest.documentId,
      recipientEmail: signatureRequest.recipient.email,
      recipientName: signatureRequest.recipient.name,
      accessCodeType: signatureRequest.accessCodeType || 'custom',
      verifiedAt: now,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: 'verified',
    });

    console.log(`✅ Access code verified successfully for ${signatureId}`);

    return NextResponse.json({
      success: true,
      message: "Access code verified successfully",
      verified: true,
    });

  } catch (error) {
    console.error("❌ Error verifying access code:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// GET - Check if access code is required
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

    const now = new Date();
    const isLocked = signatureRequest.accessCodeLockoutUntil && 
                     new Date(signatureRequest.accessCodeLockoutUntil) > now;

    return NextResponse.json({
      success: true,
      accessCodeRequired: signatureRequest.accessCodeRequired || false,
      accessCodeType: signatureRequest.accessCodeType || null,
      accessCodeHint: signatureRequest.accessCodeHint || null,
      isVerified: !!signatureRequest.accessCodeVerifiedAt,
      isLocked: isLocked,
      lockoutUntil: isLocked ? signatureRequest.accessCodeLockoutUntil : null,
      failedAttempts: signatureRequest.accessCodeFailedAttempts || 0,
      maxAttempts: ACCESS_CODE_SETTINGS.maxAttempts,
    });

  } catch (error) {
    console.error("❌ Error checking access code status:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}