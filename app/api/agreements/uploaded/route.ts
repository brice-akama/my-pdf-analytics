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

    const agreements = await db
      .collection("agreements")
      .find({ 
        userId: user.id,  // ✅ Only this user's uploads — no team scope
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
        uploadedBy: a.userId,
      })),
    });
  } catch (error) {
    console.error("❌ GET uploaded agreements error:", error);
    return NextResponse.json({ error: "Failed to fetch agreements" }, { status: 500 });
  }
}