import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../lib/mongodb"

export async function POST(req: NextRequest) {
  try {
    // ✅ FIX: extract the Authorization header as a string
    const authHeader = req.headers.get("authorization")
    const user = await verifyUserFromRequest(authHeader)

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { spaceId, name } = body

    if (!spaceId || !name) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const db = await dbPromise
    const space = await db.collection("spaces").findOne({
      _id: new ObjectId(spaceId),
      userId: new ObjectId(user.id) // ✅ your verifyUserFromRequest returns { id, email, plan }
    })

    if (!space) {
      return NextResponse.json({ success: false, message: "Space not found or access denied" }, { status: 404 })
    }

    const existingFolder = await db.collection("folders").findOne({
      spaceId: new ObjectId(spaceId),
      name: { $regex: `^${name}$`, $options: "i" }
    })

    if (existingFolder) {
      return NextResponse.json({ success: false, message: "Folder with this name already exists" }, { status: 400 })
    }

    const folder = {
      name: name.trim(),
      spaceId: new ObjectId(spaceId),
      userId: new ObjectId(user.id),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("folders").insertOne(folder)

    return NextResponse.json({
      success: true,
      folder: {
        id: result.insertedId.toString(),
        name: folder.name,
        spaceId: spaceId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      }
    })
  } catch (error) {
    console.error("Create folder error:", error)
    return NextResponse.json({ success: false, message: "Failed to create folder" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // ✅ FIX: same as above
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
    const folders = await db
      .collection("folders")
      .find({ spaceId: new ObjectId(spaceId) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      folders: folders.map(folder => ({
        id: folder._id.toString(),
        name: folder.name,
        spaceId: folder.spaceId.toString(),
        documentCount: 0,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      }))
    })
  } catch (error) {
    console.error("Get folders error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch folders" }, { status: 500 })
  }
}
