import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../lib/mongodb"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"

// ✅ Helper to safely extract and verify the user
async function getVerifiedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  return await verifyUserFromRequest(authHeader)
}

// 🟢 GET - Fetch all file requests for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise
    const fileRequests = await db
      .collection("fileRequests")
      .find({ userId: new ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      fileRequests: fileRequests.map((r) => ({
        _id: r._id.toString(),
        title: r.title,
        description: r.description,
        filesReceived: r.uploadedFiles?.length || 0,
        totalFiles: r.expectedFiles || 0,
        status: r.status,
        dueDate: r.dueDate,
        createdAt: r.createdAt,
        recipients: r.recipients,
      })),
    })
  } catch (error) {
    console.error("GET file requests error:", error)
    return NextResponse.json({ error: "Failed to fetch file requests" }, { status: 500 })
  }
}

// 🟢 POST - Create new file request
export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, recipients, dueDate, expectedFiles, requestedFileTypes } = body

    if (!title || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await dbPromise
    const fileRequest = {
      userId: new ObjectId(user.id),
      title: title.trim(),
      description: description || "",
      recipients: recipients.map((email: string) => ({
        email: email.trim(),
        notified: false,
        notifiedAt: null,
      })),
      dueDate: dueDate ? new Date(dueDate) : null,
      expectedFiles: expectedFiles || 1,
      requestedFileTypes: requestedFileTypes || [],
      uploadedFiles: [],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("fileRequests").insertOne(fileRequest)

    // TODO: Add email notifications later (sendGrid / nodemailer)

    return NextResponse.json({
      success: true,
      requestId: result.insertedId.toString(),
      message: "File request created successfully",
    })
  } catch (error) {
    console.error("POST file request error:", error)
    return NextResponse.json({ error: "Failed to create file request" }, { status: 500 })
  }
}
