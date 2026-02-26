// app/api/file-requests/route.ts
 
// Only change: POST now accepts optional spaceId + folderId for space-linked requests

import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../lib/mongodb"
import { ObjectId } from "mongodb"
import crypto from "crypto"
import { verifyUserFromRequest } from "@/lib/auth"

// GET - Fetch all file requests (unchanged)
export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise

    const profile = await db.collection('profiles').findOne({ user_id: user.id })
    const organizationId = profile?.organization_id || user.id
    const isOrgOwner = organizationId === user.id

    let query: any = { organizationId }
    if (!isOrgOwner) {
      query.userId = new ObjectId(user.id)
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
        // ── Space-linked fields ──
        spaceId: r.spaceId || null,
        folderId: r.folderId || null,
        spaceName: r.spaceName || null,
        folderName: r.folderName || null,
      })),
    })
  } catch (error) {
    console.error("GET file requests error:", error)
    return NextResponse.json({ error: "Failed to fetch file requests" }, { status: 500 })
  }
}

// POST - Create new file request (now supports optional spaceId + folderId)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      description,
      recipients,
      dueDate,
      expectedFiles,
      // ── NEW optional space-linking fields ──
      spaceId,
      folderId,
    } = body

    if (!title || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await dbPromise
    const profile = await db.collection('profiles').findOne({ user_id: user.id })
    const organizationId = profile?.organization_id || user.id

    // ── If space-linked: validate space + folder exist and user has access ──
    let spaceName: string | null = null
    let folderName: string | null = null

    if (spaceId) {
      const space = await db.collection('spaces').findOne({
        _id: new ObjectId(spaceId)
      })

      if (!space) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 })
      }

      // Verify user owns or is a member of the space
      const isOwner = space.userId === user.id
      const isMember = space.members?.some((m: any) => m.email === user.email)
      if (!isOwner && !isMember) {
        return NextResponse.json({ error: "Access denied to this space" }, { status: 403 })
      }

      spaceName = space.name

      if (folderId) {
        const folder = await db.collection('space_folders').findOne({
          _id: new ObjectId(folderId),
          spaceId: spaceId
        })
        if (!folder) {
          return NextResponse.json({ error: "Folder not found in this space" }, { status: 404 })
        }
        folderName = folder.name
      }
    }

    const shareToken = crypto.randomBytes(32).toString('hex')

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
      // ── Space-linking fields (null for general requests) ──
      spaceId: spaceId || null,
      folderId: folderId || null,
      spaceName: spaceName || null,
      folderName: folderName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("fileRequests").insertOne(fileRequest)

    return NextResponse.json({
      success: true,
      requestId: result.insertedId.toString(),
      shareToken,
      isSpaceLinked: !!spaceId,
      spaceName,
      folderName,
      message: spaceId
        ? `File request created — uploads will land in "${folderName || 'root'}" of "${spaceName}"`
        : "File request created successfully",
    })
  } catch (error) {
    console.error("POST file request error:", error)
    return NextResponse.json({ error: "Failed to create file request" }, { status: 500 })
  }
}