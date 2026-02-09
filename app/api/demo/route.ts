//   app/api/demo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendDemoBookingEmail } from "@/lib/emailService";
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
    const { phoneNumber, teamSize, preferredDate, message } = body;

    // ✅ CHANGE: Query profiles collection
    const db = await dbPromise;
    const userProfile = await db.collection("profiles").findOne({ email: user.email });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    // ✅ NOW these fields exist
    const firstName = userProfile.first_name || "User";
    const lastName = userProfile.last_name || "";
    const companyName = userProfile.company_name || undefined;

    await sendDemoBookingEmail({
      userName: `${firstName} ${lastName}`.trim(),
      userEmail: user.email,
      userCompany: companyName,
      phoneNumber: phoneNumber?.trim(),
      teamSize,
      preferredDate: preferredDate?.trim(),
      message: message?.trim() || "",
    });

    return NextResponse.json({
      success: true,
      message: "Demo request sent successfully",
    });
  } catch (error) {
    console.error("Demo booking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send demo request" },
      { status: 500 }
    );
  }
}