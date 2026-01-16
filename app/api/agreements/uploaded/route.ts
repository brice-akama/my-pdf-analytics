import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "../../lib/mongodb"

 

export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;
    
    // ✅ QUERY WITH STRING userId (matching documents format)
    const agreements = await db
      .collection("documents")
      .find({ 
        userId: user.id,  // ✅ STRING (not ObjectId!)
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
      })),
    });
  } catch (error) {
    console.error("❌ GET uploaded agreements error:", error);
    return NextResponse.json({ error: "Failed to fetch agreements" }, { status: 500 });
  }
}
 

 