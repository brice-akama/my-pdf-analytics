// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/emailService";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from '../lib/mongodb';

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

    // ✅ Send feedback email
    await sendFeedbackEmail({
      userEmail: user.email,
      feedback: feedback.trim(),
    });

    // ✅ Save to MongoDB so it shows in the owner dashboard
    const db = await dbPromise;
    await db.collection('feedback').insertOne({
      userId: user.id,
      email: user.email,
      feedback: feedback.trim(),
      type: body.type || 'general',
      status: 'new',
      createdAt: new Date(),
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