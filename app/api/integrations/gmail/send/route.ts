import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { sendEmailViaGmail } from "@/lib/integrations/gmail";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, message, documentId } = body;

    if (!to || !subject || !documentId) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, documentId" },
        { status: 400 }
      );
    }

    // Send email with tracked document link
    const result = await sendEmailViaGmail({
      userId: user.id, // ✅ FIXED
      to,
      subject,
      message: message || `I'm sharing a document with you via DocMetrics.`,
      documentId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`,
    });
  } catch (error) {
    console.error("Gmail send error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}