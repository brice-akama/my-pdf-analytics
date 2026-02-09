import { NextRequest, NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/emailService";
import { verifyUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // ✅ Verify user via HTTP-only cookie
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { feedback } = body;

    // Validate required field
    if (!feedback?.trim()) {
      return NextResponse.json(
        { success: false, error: "Feedback text is required" },
        { status: 400 }
      );
    }

    // ✅ Send feedback email - JUST email and feedback
    await sendFeedbackEmail({
      userEmail: user.email,
      feedback: feedback.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Feedback sent successfully",
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send feedback" },
      { status: 500 }
    );
  }
}