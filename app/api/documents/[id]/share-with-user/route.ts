import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "@/app/api/lib/mongodb"

/* -------------------------------------------------------------------------- */
/* 🧩 Type Definitions                                                        */
/* -------------------------------------------------------------------------- */

interface SharedPermission {
  canView: boolean
  canDownload: boolean
  canEdit: boolean
  canShare: boolean
}

interface SharedWithEntry {
  email: string
  permissions: SharedPermission
  sharedBy: string
  sharedAt: Date
  expiresAt: Date | null
  message: string | null
}

interface DocumentType {
  _id: ObjectId
  userId: ObjectId
  filename: string
  sharedWith: SharedWithEntry[]
  createdAt?: Date
  updatedAt?: Date
}

interface ShareRequest {
  emails: string[]
  permissions: SharedPermission
  message?: string
  expiresAt?: string | null
}

/* -------------------------------------------------------------------------- */
/* 🧩 Helper — Verify and return current user                                 */
/* -------------------------------------------------------------------------- */

async function getVerifiedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  return await verifyUserFromRequest(authHeader)
}

/* -------------------------------------------------------------------------- */
/* 🟢 POST - Share a document with specific users                             */
/* -------------------------------------------------------------------------- */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedUser(req)
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body: ShareRequest = await req.json()
    const { emails, permissions, message, expiresAt } = body

    if (!emails?.length) {
      return NextResponse.json(
        { error: "At least one email is required" },
        { status: 400 }
      )
    }

    const db = await dbPromise
    const documents = db.collection<DocumentType>("documents")
    const documentId = new ObjectId(params.id)

    const document = await documents.findOne({ _id: documentId })
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const isOwner = document.userId.toString() === user.id
    const hasSharePermission = document.sharedWith?.some(
      (share) => share.email === user.email && share.permissions?.canShare
    )

    if (!isOwner && !hasSharePermission) {
      return NextResponse.json(
        { error: "You don't have permission to share this document" },
        { status: 403 }
      )
    }

    // Prepare new share entries
    const sharedEntries = emails.map((email) => ({
      email: email.toLowerCase().trim(),
      permissions: permissions || {
        canView: true,
        canDownload: false,
        canEdit: false,
        canShare: false,
      },
      sharedBy: user.email,
      sharedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      message: message || null,
    }))

    const existingEmails = document.sharedWith?.map((s) => s.email) || []
    const newShares = sharedEntries.filter(
      (share) => !existingEmails.includes(share.email)
    )

    if (!newShares.length) {
      return NextResponse.json(
        { error: "All users already have access to this document" },
        { status: 400 }
      )
    }

    // ✅ Type-safe MongoDB update
    await documents.updateOne(
      { _id: documentId },
      {
        $push: { sharedWith: { $each: newShares } },
        $set: { updatedAt: new Date() },
      }
    )

    // Create notifications
    const notifications = newShares.map((share) => ({
      userId: null,
      email: share.email,
      type: "share",
      title: "Document Shared",
      message: `${user.email} shared "${document.filename || "a document"}" with you`,
      documentId,
      read: false,
      createdAt: new Date(),
    }))

    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications)
    }

    return NextResponse.json({
      success: true,
      message: `Document shared with ${newShares.length} user(s)`,
      sharedWith: newShares.map((s) => s.email),
    })
  } catch (error) {
    console.error("POST share document error:", error)
    return NextResponse.json(
      { error: "Failed to share document" },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/* 🟢 GET - Fetch users the document is shared with                           */
/* -------------------------------------------------------------------------- */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedUser(req)
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await dbPromise
    const documents = db.collection<DocumentType>("documents")
    const documentId = new ObjectId(params.id)

    const document = await documents.findOne({ _id: documentId })
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const isOwner = document.userId.toString() === user.id
    const hasAccess = document.sharedWith?.some(
      (share) => share.email === user.email
    )

    if (!isOwner && !hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this document" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      sharedWith: document.sharedWith || [],
      isOwner,
    })
  } catch (error) {
    console.error("GET shared users error:", error)
    return NextResponse.json(
      { error: "Failed to fetch shared users" },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/* 🟠 DELETE - Remove a user's access from shared document                    */
/* -------------------------------------------------------------------------- */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedUser(req)
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const emailToRemove = searchParams.get("email")

    if (!emailToRemove) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      )
    }

    const db = await dbPromise
    const documents = db.collection<DocumentType>("documents")
    const documentId = new ObjectId(params.id)

    const document = await documents.findOne({ _id: documentId })
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Only the owner can remove shares
    if (document.userId.toString() !== user.id) {
      return NextResponse.json(
        { error: "Only the document owner can remove share access" },
        { status: 403 }
      )
    }

    // ✅ Type-safe pull
    await documents.updateOne(
      { _id: documentId },
      {
        $pull: { sharedWith: { email: emailToRemove.toLowerCase() } },
        $set: { updatedAt: new Date() },
      }
    )

    return NextResponse.json({
      success: true,
      message: `Access removed for ${emailToRemove}`,
    })
  } catch (error) {
    console.error("DELETE share error:", error)
    return NextResponse.json(
      { error: "Failed to remove share access" },
      { status: 500 }
    )
  }
}
