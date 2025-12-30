// app/api/folders/route.ts

import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../lib/mongodb"

export async function POST(req: NextRequest) {
  try {
    // ✅ FIXED: Use HTTP-only cookies instead of Authorization header
    const user = await verifyUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const body = await req.json()
    const { spaceId, name } = body

    if (!spaceId || !name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" }, 
        { status: 400 }
      )
    }

    const db = await dbPromise
    
    // ✅ Verify user has access to this space
    const space = await db.collection("spaces").findOne({
      _id: new ObjectId(spaceId),
      userId: user.id
    })

    if (!space) {
      return NextResponse.json(
        { success: false, message: "Space not found or access denied" }, 
        { status: 404 }
      )
    }

    // ✅ Check if folder name already exists (case-insensitive)
    const existingFolder = await db.collection("folders").findOne({
      spaceId: new ObjectId(spaceId),
      name: { $regex: `^${name.trim()}$`, $options: "i" }
    })

    if (existingFolder) {
      return NextResponse.json(
        { success: false, message: "Folder with this name already exists" }, 
        { status: 400 }
      )
    }

    // ✅ Create new folder
    const folder = {
      name: name.trim(),
      spaceId: new ObjectId(spaceId),
      userId: user.id,
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
    }, { status: 201 })
    
  } catch (error) {
    console.error("Create folder error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create folder" }, 
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // ✅ FIXED: Use HTTP-only cookies
    const user = await verifyUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const spaceId = searchParams.get("spaceId")

    if (!spaceId) {
      return NextResponse.json(
        { success: false, message: "Missing spaceId" }, 
        { status: 400 }
      )
    }

    const db = await dbPromise
    
    // ✅ Get all folders for this space
    const folders = await db
      .collection("folders")
      .find({ 
        spaceId: new ObjectId(spaceId),
        userId: user.id
      })
      .sort({ createdAt: -1 })
      .toArray()

    // ✅ Count documents in each folder
    const foldersWithCount = await Promise.all(
      folders.map(async (folder) => {
        const docCount = await db.collection("documents").countDocuments({
          folderId: folder._id.toString()
        })
        
        return {
          id: folder._id.toString(),
          name: folder.name,
          spaceId: folder.spaceId.toString(),
          documentCount: docCount,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        }
      })
    )

    return NextResponse.json({
      success: true,
      folders: foldersWithCount
    })
    
  } catch (error) {
    console.error("Get folders error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch folders" }, 
      { status: 500 }
    )
  }
}