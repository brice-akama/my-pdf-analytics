//app/api/agreements/route.ts

import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../lib/mongodb"
import { getTeamMemberIds } from "../lib/teamHelpers"

// ✅ Helper function: extract user from NextRequest (cookies handled inside auth)
async function getVerifiedUser(req: NextRequest) {
  return await verifyUserFromRequest(req)
}

//   GET - Fetch all agreements for user
//   UPDATED GET - Team isolation
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise
    
    //   GET USER ROLE
    const profile = await db.collection("profiles").findOne({ user_id: user.id })
    const userRole = profile?.role || "owner"
    
    //   GET VISIBLE USER IDS (owner/admin see all, members see only their own)
    const visibleUserIds = await getTeamMemberIds(user.id, userRole)
    
    console.log(`👥 User ${user.email} (${userRole}) can see agreements from:`, visibleUserIds)
    
    const agreements = await db
      .collection("documents")
      .find({ 
        userId: { $in: visibleUserIds }, //   TEAM ISOLATION
        type: "agreement",
        status: "uploaded"
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      agreements: agreements.map((agreement: any) => ({
        _id: agreement._id.toString(),
        title: agreement.title || agreement.filename,
        type: agreement.type || 'NDA',
        signedCount: agreement.signers?.filter((s: any) => s.signed).length || 0,
        totalSigners: agreement.signers?.length || 0,
        status: agreement.status,
        createdAt: agreement.createdAt,
        expiresAt: agreement.expiresAt || null,
        uploadedBy: agreement.userId, //   ADD THIS to show who uploaded
      })),
    })
  } catch (error) {
    console.error("❌ GET agreements error:", error)
    return NextResponse.json(
      { error: "Failed to fetch agreements" },
      { status: 500 }
    )
  }
}
 
//   POST - Create/Configure agreement and send for signature
export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { agreementId, title, type, signers, message, requireSignature } = body

    if (!agreementId || !title || !Array.isArray(signers) || signers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const db = await dbPromise

    // Update the uploaded agreement with configuration
    const result = await db.collection("documents").updateOne(
      { 
        _id: new ObjectId(agreementId),
        userId: new ObjectId(user.id) 
      },
      {
        $set: {
          title: title.trim(),
          type: type || "NDA",
          signers: signers.map((email: string) => ({
            email: email.trim(),
            signed: false,
            signedAt: null,
            ipAddress: null,
            signatureToken: generateSignatureToken() // Unique token for each signer
          })),
          message: message || "",
          requireSignature: requireSignature !== false,
          status: "pending_signatures",
          sentAt: new Date()
          
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Agreement not found" },
        { status: 404 }
      )
    }

    // TODO: Send email notifications to signers with signing links
    // Each signer gets: /agreements/{agreementId}/sign?token={theirUniqueToken}

    return NextResponse.json({
      success: true,
      agreementId: agreementId,
      message: "Agreement sent for signature successfully",
    })
  } catch (error) {
    console.error("❌ POST agreement error:", error)
    return NextResponse.json(
      { error: "Failed to send agreement" },
      { status: 500 }
    )
  }
}

// Helper function to generate unique signing tokens
function generateSignatureToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}