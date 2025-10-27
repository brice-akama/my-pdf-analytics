import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../lib/mongodb"

// ✅ Helper function to extract user from NextRequest
async function getVerifiedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  return await verifyUserFromRequest(authHeader)
}

// ✅ GET - Fetch all agreements for user
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise
    const agreements = await db
      .collection("agreements")
      .find({ userId: new ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      agreements: agreements.map((agreement) => ({
        id: agreement._id.toString(),
        title: agreement.title,
        type: agreement.type,
        documentId: agreement.documentId?.toString() || null,
        signedCount: agreement.signatures?.filter((s: any) => s.signed).length || 0,
        totalSigners: agreement.signers?.length || 0,
        status: agreement.status,
        createdAt: agreement.createdAt,
        expiresAt: agreement.expiresAt,
        signers: agreement.signers,
      })),
    })
  } catch (error) {
    console.error("GET agreements error:", error)
    return NextResponse.json({ error: "Failed to fetch agreements" }, { status: 500 })
  }
}

// ✅ POST - Create new agreement
export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, type, documentId, signers, message, requireSignature } = body

    if (!title || !Array.isArray(signers) || signers.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await dbPromise
    const agreement = {
      userId: new ObjectId(user.id),
      title: title.trim(),
      type: type || "NDA",
      documentId: documentId ? new ObjectId(documentId) : null,
      signers: signers.map((email: string) => ({
        email: email.trim(),
        signed: false,
        signedAt: null,
        ipAddress: null,
      })),
      message: message || "",
      requireSignature: requireSignature !== false,
      status: "pending",
      createdAt: new Date(),
      expiresAt: null,
      signatures: [],
    }

    const result = await db.collection("agreements").insertOne(agreement)

    // TODO: Send email notifications to signers

    return NextResponse.json({
      success: true,
      agreementId: result.insertedId.toString(),
      message: "Agreement created successfully",
    })
  } catch (error) {
    console.error("POST agreement error:", error)
    return NextResponse.json({ error: "Failed to create agreement" }, { status: 500 })
  }
}
