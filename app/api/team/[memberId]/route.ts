//app/api/team/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { checkAccess } from "@/lib/checkAccess";
import { ObjectId } from "mongodb";

// PATCH - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const access = await checkAccess(request)
    if (!access.ok) return access.response

    const { memberId } = await params
    const body = await request.json()
    const { role } = body

    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const db = await dbPromise
    const userProfile = await db
      .collection("profiles")
      .findOne({ user_id: access.userId })
    const organizationId = userProfile?.organization_id || access.userId

    // ── Role guard ────────────────────────────────────────────────────────
    const isOwner = organizationId === access.userId
    const currentUserMember = await db
      .collection("organization_members")
      .findOne({ organizationId, userId: access.userId })
    const isAdmin = currentUserMember?.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the account owner or admins can update member roles." },
        { status: 403 }
      )
    }

    const result = await db.collection("organization_members").updateOne(
      { _id: new ObjectId(memberId) },
      { $set: { role, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Role updated" })
  } catch (error: any) {
    console.error("PATCH member error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const access = await checkAccess(request)
    if (!access.ok) return access.response

    const { memberId } = await params
    const db = await dbPromise

    const userProfile = await db
      .collection("profiles")
      .findOne({ user_id: access.userId })
    const organizationId = userProfile?.organization_id || access.userId

    // ── Role guard ────────────────────────────────────────────────────────
    const isOwner = organizationId === access.userId
    const currentUserMember = await db
      .collection("organization_members")
      .findOne({ organizationId, userId: access.userId })
    const isAdmin = currentUserMember?.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the account owner or admins can remove team members." },
        { status: 403 }
      )
    }

    const result = await db.collection("organization_members").deleteOne({
      _id: new ObjectId(memberId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Member removed" })
  } catch (error: any) {
    console.error("DELETE member error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}