import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "@/app/api/lib/mongodb"

/* ----------------------------------------
   ADD CONTACT TO SPACE
---------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    // ✅ HTTP-only cookie auth (Next.js 15 safe)
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { spaceId, email, role } = body

    if (!spaceId || !email || !role) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // ✅ Validate ObjectId early
    if (!ObjectId.isValid(spaceId)) {
      return NextResponse.json(
        { success: false, message: "Invalid spaceId" },
        { status: 400 }
      )
    }

    // ✅ Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      )
    }

    // ✅ Validate role
    if (!["viewer", "editor", "admin"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role" },
        { status: 400 }
      )
    }

    const db = await dbPromise
    const spaceObjectId = new ObjectId(spaceId)

    // ✅ FIXED: userId is STRING (not ObjectId)
    const space = await db.collection("spaces").findOne({
      _id: spaceObjectId,
      userId: user.id
    })

    if (!space) {
      return NextResponse.json(
        { success: false, message: "Space not found or permission denied" },
        { status: 404 }
      )
    }

    // ✅ Ensure invited user exists
    const contactUser = await db.collection("users").findOne({ email })
    if (!contactUser) {
      return NextResponse.json(
        { success: false, message: "User with this email not found" },
        { status: 404 }
      )
    }

    // ✅ Prevent duplicate membership
    const existingMember = await db.collection("spaceMembers").findOne({
      spaceId: spaceObjectId,
      userId: contactUser._id
    })

    if (existingMember) {
      return NextResponse.json(
        { success: false, message: "User already belongs to this space" },
        { status: 400 }
      )
    }

    // ✅ Add member
    const member = {
      spaceId: spaceObjectId,
      userId: contactUser._id,
      role,
      invitedBy: user.id, // store as string (consistent)
      status: "active",
      createdAt: new Date()
    }

    const result = await db.collection("spaceMembers").insertOne(member)

    // ✅ Activity log
    await db.collection("activityLogs").insertOne({
      spaceId: spaceObjectId,
      userId: user.id,
      action: "member_added",
      details: {
        memberEmail: email,
        role
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
        role
      }
    })
  } catch (error) {
    console.error("Add contact error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to add contact" },
      { status: 500 }
    )
  }
}

/* ----------------------------------------
   GET SPACE MEMBERS
---------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const spaceId = url.searchParams.get("spaceId")

    if (!spaceId || !ObjectId.isValid(spaceId)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing spaceId" },
        { status: 400 }
      )
    }

    const db = await dbPromise
    const spaceObjectId = new ObjectId(spaceId)

    // ✅ FIXED: string userId
    const space = await db.collection("spaces").findOne({
      _id: spaceObjectId,
      userId: user.id
    })

    if (!space) {
      return NextResponse.json(
        { success: false, message: "Space not found or access denied" },
        { status: 404 }
      )
    }

    const members = await db
      .collection("spaceMembers")
      .aggregate([
        { $match: { spaceId: spaceObjectId } },
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
    return NextResponse.json(
      { success: false, message: "Failed to fetch members" },
      { status: 500 }
    )
  }
}
