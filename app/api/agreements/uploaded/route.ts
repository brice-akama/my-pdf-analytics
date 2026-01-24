import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"
import { getTeamMemberIds } from "../../lib/teamHelpers"

 

export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;
    
    // ✅ GET USER ROLE
    const profile = await db.collection("profiles").findOne({ user_id: user.id })
    const userRole = profile?.role || "owner"
    
    // ✅ GET VISIBLE USER IDS
    const visibleUserIds = await getTeamMemberIds(user.id, userRole)
    
    console.log(`📄 User ${user.email} (${userRole}) fetching uploaded agreements from:`, visibleUserIds)
    
    const agreements = await db
      .collection("documents")
      .find({ 
        userId: { $in: visibleUserIds }, //   TEAM ISOLATION
        type: "agreement",
        status: "uploaded"
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      agreements: agreements.map((a: any) => ({
        _id: a._id.toString(),
        filename: a.filename,
        filesize: a.filesize || a.size,
        filepath: a.filepath,
        status: a.status,
        createdAt: a.createdAt,
        uploadedBy: a.userId, //   ADD THIS
      })),
    });
  } catch (error) {
    console.error("❌ GET uploaded agreements error:", error);
    return NextResponse.json({ error: "Failed to fetch agreements" }, { status: 500 });
  }
}