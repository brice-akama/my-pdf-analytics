import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
 
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"

// 🧩 Helper — extract and verify user
async function getVerifiedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  return await verifyUserFromRequest(authHeader)
}

/* -------------------------------------------------------------------------- */
/* 🟢 GET - Fetch all documents shared with the current user                   */
/* -------------------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise

    // 🗂️ Find documents shared with this user (excluding ones they own)
    const sharedDocuments = await db
      .collection("documents")
      .find({
        "sharedWith.email": user.email,
        userId: { $ne: new ObjectId(user.id) },
      })
      .sort({ "sharedWith.sharedAt": -1 })
      .toArray()

    // 🧾 Populate owner + share info
    const documentsWithOwners = await Promise.all(
      sharedDocuments.map(async (doc) => {
        const owner = await db.collection("users").findOne({ _id: doc.userId })

        const sharedInfo = doc.sharedWith?.find(
          (share: any) => share.email === user.email
        )

        return {
          _id: doc._id.toString(),
          filename: doc.filename,
          size: doc.size,
          numPages: doc.numPages || 0,
          createdAt: doc.createdAt,
          sharedAt: sharedInfo?.sharedAt || doc.createdAt,
          sharedBy: {
            name:
              owner?.profile?.firstName && owner?.profile?.lastName
                ? `${owner.profile.firstName} ${owner.profile.lastName}`
                : owner?.email || "Unknown",
            email: owner?.email || "",
            avatar: owner?.profile?.avatarUrl || null,
          },
          permissions: sharedInfo?.permissions || {
            canView: true,
            canDownload: false,
            canEdit: false,
            canShare: false,
          },
          expiresAt: sharedInfo?.expiresAt || null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      documents: documentsWithOwners,
      count: documentsWithOwners.length,
    })
  } catch (error) {
    console.error("GET shared documents error:", error)
    return NextResponse.json(
      { error: "Failed to fetch shared documents" },
      { status: 500 }
    )
  }
}
