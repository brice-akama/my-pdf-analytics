// app/api/team/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function verifyUser(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value || request.cookies.get("token")?.value;
  if (!token) return null;
  
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return { id: decoded.userId || decoded.id };
  } catch {
    return null;
  }
}

// PATCH - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!["owner", "admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const db = await dbPromise;

    const result = await db.collection("organization_members").updateOne(
      { _id: new ObjectId(memberId) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Role updated" });
  } catch (error: any) {
    console.error("PATCH member error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const db = await dbPromise;

    const result = await db.collection("organization_members").deleteOne({
      _id: new ObjectId(memberId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Member removed" });
  } catch (error: any) {
    console.error("DELETE member error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}