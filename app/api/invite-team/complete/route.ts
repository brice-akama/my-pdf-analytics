// app/api/invite/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token: inviteToken, userId } = body;

    if (!inviteToken || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // Find invitation
    const invitation = await db.collection("organization_members").findOne({
      inviteToken,
      status: "invited",
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 404 }
      );
    }

    // Check expiry
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        { error: "Invitation expired" },
        { status: 410 }
      );
    }

    // Get user to verify email matches
    let user;
    try {
      user = await db.collection("users").findOne({
        _id: new ObjectId(userId),
      });
    } catch {
      user = await db.collection("users").findOne({
        id: userId,
      });
    }

    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email mismatch" },
        { status: 403 }
      );
    }

    // ✅ GET INVITER'S ORGANIZATION INFO
    const inviter = await db.collection("profiles").findOne({
      user_id: invitation.invitedBy,
    });

    const organizationId = invitation.organizationId;
    const organizationName = inviter?.company_name || "Team";

    console.log("📋 Accepting invitation:", {
      newMemberEmail: user.email,
      organizationId,
      organizationName,
      invitedBy: invitation.invitedBy
    });

    // ✅ UPDATE INVITATION TO ACTIVE
    await db.collection("organization_members").updateOne(
      { _id: invitation._id },
      {
        $set: {
          userId,
          status: "active",
          joinedAt: new Date(),
          lastActiveAt: new Date(),
        },
        $unset: { inviteToken: "", expiresAt: "" },
      }
    );

    // ✅ UPDATE NEW MEMBER'S PROFILE WITH ORGANIZATION
    await db.collection("profiles").updateOne(
      { user_id: userId },
      {
        $set: {
          organization_id: organizationId,
          company_name: organizationName, // ✅ INHERIT COMPANY NAME
          updated_at: new Date(),
        },
      },
      { upsert: true }
    );

    // ✅ ALSO UPDATE USER DOCUMENT
    try {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            "profile.companyName": organizationName,
            updated_at: new Date(),
          },
        }
      );
    } catch {
      await db.collection("users").updateOne(
        { id: userId },
        {
          $set: {
            "profile.companyName": organizationName,
            updated_at: new Date(),
          },
        }
      );
    }

    console.log("✅ Member successfully joined organization");

    return NextResponse.json({
      success: true,
      message: "Successfully joined team",
      organization: {
        id: organizationId,
        name: organizationName,
      },
    });
  } catch (error: any) {
    console.error("Complete invite error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}