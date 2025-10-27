import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"
 

// ✅ Helper for consistent user verification
async function getVerifiedUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  return await verifyUserFromRequest(authHeader)
}

// 🟢 GET - Fetch all folders shared with the authenticated user
export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise

    const sharedFolders = await db
      .collection("folders")
      .find({
        "sharedWith.email": user.email,
        userId: { $ne: new ObjectId(user.id) },
      })
      .sort({ "sharedWith.sharedAt": -1 })
      .toArray()

    // ✅ Build folder details with owner and document count
    const foldersWithDetails = await Promise.all(
      sharedFolders.map(async (folder) => {
        const [owner, documentCount] = await Promise.all([
          db.collection("users").findOne({ _id: folder.userId }),
          db.collection("documents").countDocuments({ folderId: folder._id }),
        ])

        const sharedInfo = folder.sharedWith?.find(
          (share: any) => share.email === user.email
        )

        return {
          _id: folder._id.toString(),
          name: folder.name,
          description: folder.description || "",
          itemCount: documentCount,
          createdAt: folder.createdAt,
          sharedAt: sharedInfo?.sharedAt || folder.createdAt,
          sharedBy: {
            name:
              owner?.profile?.firstName && owner?.profile?.lastName
                ? `${owner.profile.firstName} ${owner.profile.lastName}`
                : owner?.email || "Unknown",
            email: owner?.email || "",
            avatar: owner?.profile?.avatarUrl || null,
          },
          permissions:
            sharedInfo?.permissions || {
              canView: true,
              canDownload: false,
              canEdit: false,
              canShare: false,
            },
          color: folder.color || "from-blue-500 to-blue-600",
        }
      })
    )

    return NextResponse.json({
      success: true,
      folders: foldersWithDetails,
      count: foldersWithDetails.length,
    })
  } catch (error) {
    console.error("GET shared folders error:", error)
    return NextResponse.json(
      { error: "Failed to fetch shared folders" },
      { status: 500 }
    )
  }
}
