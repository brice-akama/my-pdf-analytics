import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../../lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyUserFromRequest } from "@/lib/auth"

export const dynamic = 'force-dynamic'

// GET - Fetch single file request
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Next.js 15: await params
    const { id } = await context.params

    console.log('🔍 Fetching file request:', id, 'for user:', user.id)

    const db = await dbPromise
    const request = await db.collection("fileRequests").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user.id)
    })

    if (!request) {
      console.log('❌ Request not found or unauthorized')
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    console.log('✅ Found request:', request.title)

    return NextResponse.json({
      success: true,
      request: {
        _id: request._id.toString(),
        title: request.title,
        description: request.description,
        recipients: request.recipients,
        dueDate: request.dueDate,
        expectedFiles: request.expectedFiles,
        uploadedFiles: request.uploadedFiles || [],
        status: request.status,
        shareToken: request.shareToken,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }
    })
  } catch (error) {
    console.error("GET request error:", error)
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 })
  }
}

// PATCH - Update file request
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()
    const { title, description, status } = body

    const db = await dbPromise
    const result = await db.collection("fileRequests").updateOne(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(user.id)
      },
      {
        $set: {
          ...(title && { title: title.trim() }),
          ...(description !== undefined && { description: description.trim() }),
          ...(status && { status }),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PATCH request error:", error)
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
  }
}

// DELETE - Delete file request
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const db = await dbPromise
    const result = await db.collection("fileRequests").deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE request error:", error)
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 })
  }
}