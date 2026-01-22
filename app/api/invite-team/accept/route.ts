// app/api/invite/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Find invitation
    const invitation = await db.collection("organization_members").findOne({
      inviteToken: token,
      status: "invited",
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 410 }
      );
    }

    // Get inviter info
    const inviter = await db.collection("profiles").findOne({
      user_id: invitation.invitedBy,
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation._id.toString(),
        email: invitation.email,
        role: invitation.role,
        organizationId: invitation.organizationId,
        inviterName: inviter?.full_name || "Someone",
        invitedAt: invitation.invitedAt,
      },
    });
  } catch (error: any) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}