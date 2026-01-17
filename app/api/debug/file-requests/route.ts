import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../../lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    const db = await dbPromise
    
    // Count all file requests
    const count = await db.collection("fileRequests").countDocuments()
    
    // Get all file requests
    const allRequests = await db.collection("fileRequests")
      .find({})
      .toArray()
    
    return NextResponse.json({
      success: true,
      totalInDB: count,
      requests: allRequests.map(r => ({
        _id: r._id.toString(),
        title: r.title,
        recipients: r.recipients,
        shareToken: r.shareToken,
        status: r.status,
      }))
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}