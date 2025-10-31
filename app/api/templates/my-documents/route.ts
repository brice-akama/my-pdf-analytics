import { NextRequest, NextResponse } from "next/server"
 
import { verifyUserFromRequest } from '@/lib/auth'
import { dbPromise } from "../../lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    // ✅ Extract the Authorization header
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1] ?? null

    // ✅ Pass the token string instead of request object
    const user = await verifyUserFromRequest(token)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise
    const generatedDocsCollection = db.collection('generated_documents')

    // ✅ Use user.id instead of user.userId
    const documents = await generatedDocsCollection
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({
      success: true,
      documents: documents.map((d) => ({
        ...d,
        _id: d._id.toString(),
      })),
    })
  } catch (error) {
    console.error("❌ Get documents error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}
