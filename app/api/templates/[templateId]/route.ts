import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { dbPromise } from "../../lib/mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    // ✅ Extract token but don't require it
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1] ?? null

    // ✅ Try to verify user, but allow null (unauthenticated access)
    const user = await verifyUserFromRequest(token).catch(() => null)

    const db = await dbPromise
    const templatesCollection = db.collection('templates')

    const template = await templatesCollection.findOne({ 
      _id: new ObjectId(params.templateId)
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" }, 
        { status: 404 }
      )
    }

    // ✅ Check access permissions
    const isPublic = template.isPublic === true
    const isOwner = user && template.createdBy === user.id

    if (!isPublic && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Access denied. This template is private." }, 
        { status: 403 }
      )
    }

    // ✅ Return template data
    return NextResponse.json({
      success: true,
      template: { 
        ...template, 
        _id: template._id.toString(),
        // ✅ Include whether the user owns this template
        isOwner: isOwner || false
      }
    })
  } catch (error) {
    console.error("Get template error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch template" },
      { status: 500 }
    )
  }
}

// ✅ UPDATE and DELETE still require authentication
export async function PATCH(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1] ?? null
    const user = await verifyUserFromRequest(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const db = await dbPromise
    const templatesCollection = db.collection('templates')

    // ✅ Check ownership
    const template = await templatesCollection.findOne({ 
      _id: new ObjectId(params.templateId)
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" }, 
        { status: 404 }
      )
    }

    if (template.createdBy !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only update your own templates" }, 
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, category, fields, htmlTemplate, cssTemplate, isPublic } = body

    await templatesCollection.updateOne(
      { _id: new ObjectId(params.templateId) },
      { 
        $set: { 
          name, 
          description, 
          category, 
          fields, 
          htmlTemplate, 
          cssTemplate,
          isPublic,
          updatedAt: new Date() 
        } 
      }
    )

    return NextResponse.json({
      success: true,
      message: "Template updated successfully"
    })
  } catch (error) {
    console.error("Update template error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update template" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1] ?? null
    const user = await verifyUserFromRequest(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const db = await dbPromise
    const templatesCollection = db.collection('templates')

    // ✅ Check ownership
    const template = await templatesCollection.findOne({ 
      _id: new ObjectId(params.templateId)
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" }, 
        { status: 404 }
      )
    }

    if (template.createdBy !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own templates" }, 
        { status: 403 }
      )
    }

    await templatesCollection.deleteOne({ 
      _id: new ObjectId(params.templateId) 
    })

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully"
    })
  } catch (error) {
    console.error("Delete template error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete template" },
      { status: 500 }
    )
  }
}