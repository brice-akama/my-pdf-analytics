//app/file-requests/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../lib/mongodb"
import { ObjectId } from "mongodb"
import crypto from "crypto"
import { verifyUserFromRequest } from "@/lib/auth"

// GET - Fetch all file requests
export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

     
    // ✅ Resolve organization (team logic)
const db = await dbPromise

const profile = await db.collection('profiles').findOne({
  user_id: user.id,
})

const organizationId = profile?.organization_id || user.id
const userOrgRole = profile?.role || 'owner'
const isOrgOwner = organizationId === user.id

console.log('👤 User org role:', userOrgRole, 'Is owner:', isOrgOwner)
    //   ROLE-BASED QUERY
let query: any = { organizationId }

if (!isOrgOwner) {
  // Members ONLY see their own file requests
  query.userId = new ObjectId(user.id)
  console.log(' Team member - showing only own file requests')
} else {
  // Owner sees ALL organization file requests
  console.log(' Organization owner - showing all file requests')
}

const fileRequests = await db
  .collection("fileRequests")
  .find(query)
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

// POST - Create new file request
export async function POST(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, recipients, dueDate, expectedFiles } = body

    if (!title || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const shareToken = crypto.randomBytes(32).toString('hex')

    // ✅ Get organization from profile
    const db = await dbPromise
const profile = await db.collection('profiles').findOne({
  user_id: user.id,
})

const organizationId = profile?.organization_id || user.id

    
    const fileRequest = {
      userId: new ObjectId(user.id),
      organizationId,
      title: title.trim(),
      description: description || "",
      recipients: recipients.map((email: string) => ({
        email: email.trim(),
        notified: false,
        notifiedAt: null,
      })),
      dueDate: dueDate ? new Date(dueDate) : null,
      expectedFiles: expectedFiles || 1,
      uploadedFiles: [],
      status: "active",
      shareToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("fileRequests").insertOne(fileRequest)

    // TODO: Send email notification (optional)
    // await sendFileRequestEmail(recipients, shareToken, title)

    return NextResponse.json({
      success: true,
      requestId: result.insertedId.toString(),
      shareToken,
      emailSent: false,
      message: "File request created successfully",
    })
  } catch (error) {
    console.error("POST file request error:", error)
    return NextResponse.json({ error: "Failed to create file request" }, { status: 500 })
  }
}