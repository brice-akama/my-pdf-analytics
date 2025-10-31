import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from '@/lib/auth'
import { dbPromise } from "../lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    
    // ✅ Try to verify user, but don't require it
    const user = await verifyUserFromRequest(token ?? null).catch(() => null)

    const db = await dbPromise
    const templatesCollection = db.collection('templates')

    let query = {}
    
    if (user) {
      // ✅ If authenticated, show public templates + user's private templates
      query = {
        $or: [
          { isPublic: true },
          { createdBy: user.id }
        ]
      }
    } else {
      // ✅ If not authenticated, only show public templates
      query = { isPublic: true }
    }

    const templates = await templatesCollection
      .find(query)
      .sort({ popular: -1, downloads: -1, createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      templates: templates.map(t => ({ ...t, _id: t._id.toString() }))
    })
  } catch (error) {
    console.error("Get templates error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    const user = await verifyUserFromRequest(token ?? null)

    // ✅ POST still requires authentication
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, fields, htmlTemplate, cssTemplate, isPublic } = body

    const db = await dbPromise
    const templatesCollection = db.collection('templates')

    const template = await templatesCollection.insertOne({
      name,
      description,
      category,
      fields,
      htmlTemplate,
      cssTemplate,
      isPublic: isPublic || false,
      createdBy: user.id,
      icon: '📄',
      color: 'from-blue-500 to-blue-600',
      popular: false,
      downloads: 0,
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      template: { _id: template.insertedId.toString() }
    })
  } catch (error) {
    console.error("Create template error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create template" },
      { status: 500 }
    )
  }
}
