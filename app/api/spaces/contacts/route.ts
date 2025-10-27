import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"

export async function POST(req: NextRequest) {
  try {
    // ✅ Extract the Authorization header properly
    const authHeader = req.headers.get("authorization")
    const user = await verifyUserFromRequest(authHeader)

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { spaceId, email, role } = body

    if (!spaceId || !email || !role) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // ✅ Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 })
    }

    // ✅ Validate role
    if (!["viewer", "editor", "admin"].includes(role)) {
      return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 })
    }

    const db = await dbPromise

    // ✅ FIXED: match the correct field name (`user.id` from auth)
    const space = await db.collection("spaces").findOne({
      _id: new ObjectId(spaceId),
      userId: new ObjectId(user.id)
    })

    if (!space) {
      return NextResponse.json({ success: false, message: "Space not found or you don't have permission" }, { status: 404 })
    }

    // Check if contact user exists
    const contactUser = await db.collection("users").findOne({ email })
    if (!contactUser) {
      return NextResponse.json({ success: false, message: "User with this email not found" }, { status: 404 })
    }

    // Check if already a member
    const existingMember = await db.collection("spaceMembers").findOne({
      spaceId: new ObjectId(spaceId),
      userId: contactUser._id
    })
    if (existingMember) {
      return NextResponse.json({ success: false, message: "User is already a member of this space" }, { status: 400 })
    }

    // ✅ Add member
    const member = {
      spaceId: new ObjectId(spaceId),
      userId: contactUser._id,
      role,
      invitedBy: new ObjectId(user.id),
      createdAt: new Date(),
      status: "active"
    }

    const result = await db.collection("spaceMembers").insertOne(member)

    // Log activity
    await db.collection("activityLogs").insertOne({
      spaceId: new ObjectId(spaceId),
      userId: new ObjectId(user.id),
      action: "member_added",
      details: {
        memberEmail: email,
        role: role
      },
      createdAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: "Contact added successfully",
      member: {
        id: result.insertedId.toString(),
        email: contactUser.email,
        name: contactUser.name || contactUser.email,
        role: member.role
      }
    })
  } catch (error) {
    console.error("Add contact error:", error)
    return NextResponse.json({ success: false, message: "Failed to add contact" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // ✅ FIX: same header extraction
    const authHeader = req.headers.get("authorization")
    const user = await verifyUserFromRequest(authHeader)

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const spaceId = searchParams.get("spaceId")

    if (!spaceId) {
      return NextResponse.json({ success: false, message: "Missing spaceId" }, { status: 400 })
    }

    const db = await dbPromise

    const space = await db.collection("spaces").findOne({
      _id: new ObjectId(spaceId),
      userId: new ObjectId(user.id)
    })

    if (!space) {
      return NextResponse.json({ success: false, message: "Space not found or access denied" }, { status: 404 })
    }

    const members = await db
      .collection("spaceMembers")
      .aggregate([
        { $match: { spaceId: new ObjectId(spaceId) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo"
          }
        },
        { $unwind: "$userInfo" }
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      members: members.map(member => ({
        id: member._id.toString(),
        email: member.userInfo.email,
        name: member.userInfo.name || member.userInfo.email,
        role: member.role,
        addedAt: member.createdAt
      }))
    })
  } catch (error) {
    console.error("Get members error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch members" }, { status: 500 })
  }
}
