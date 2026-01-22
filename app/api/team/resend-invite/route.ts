// app/api/team/resend-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value || request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const body = await request.json();
    const { memberId } = body;

    const db = await dbPromise;
    const member = await db.collection("organization_members").findOne({
      _id: new ObjectId(memberId),
    });

    if (!member || member.status !== "invited") {
      return NextResponse.json({ error: "Invalid member" }, { status: 404 });
    }

    // Update expiry
    await db.collection("organization_members").updateOne(
      { _id: new ObjectId(memberId) },
      { 
        $set: { 
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitedAt: new Date()
        } 
      }
    );

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite-team/${member.inviteToken}`;

    return NextResponse.json({
      success: true,
      message: "Invitation resent",
      inviteLink,
    });
  } catch (error: any) {
    console.error("Resend invite error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}