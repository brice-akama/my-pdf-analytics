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
    
    // ✅ QUERY DOCUMENTS COLLECTION WITH TYPE FILTER
    const agreements = await db
      .collection("documents")
      .find({ 
        userId: new ObjectId(user.id),
        type: "agreement", // ✅ FILTER BY TYPE
        status: "uploaded"
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      agreements: agreements.map((a: any) => ({
        _id: a._id.toString(),
        filename: a.filename,
        filesize: a.filesize,
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