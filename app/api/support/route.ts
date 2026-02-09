// ✅ FIXED: app/api/support/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendSupportRequestEmail } from "@/lib/emailService";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from '../lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, message } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // ✅ CHANGE: Query profiles collection instead of users
    const db = await dbPromise;
    const userProfile = await db.collection("profiles").findOne({ email: user.email });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    // ✅ NOW these fields exist at the top level
    const firstName = userProfile.first_name || "User";
    const lastName = userProfile.last_name || "";
    const companyName = userProfile.company_name || undefined;

    await sendSupportRequestEmail({
      userName: `${firstName} ${lastName}`.trim(),
      userEmail: user.email,
      userCompany: companyName,
      subject: subject.trim(),
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Support request sent successfully",
    });
  } catch (error) {
    console.error("Support request error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send support request" },
      { status: 500 }
    );
  }
}