import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../../lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyUserFromRequest } from "@/lib/auth"

export const dynamic = 'force-dynamic'

// DELETE - Delete contact
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const db = await dbPromise
    const result = await db.collection("contacts").deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE contact error:", error)
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 })
  }
}

// PATCH - Update contact
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()
    const { name, email, company, phone, notes } = body

    const db = await dbPromise
    const result = await db.collection("contacts").updateOne(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(user.id)
      },
      {
        $set: {
          ...(name && { name: name.trim() }),
          ...(email && { email: email.toLowerCase().trim() }),
          ...(company !== undefined && { company: company?.trim() || null }),
          ...(phone !== undefined && { phone: phone?.trim() || null }),
          ...(notes !== undefined && { notes: notes?.trim() || null }),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PATCH contact error:", error)
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 })
  }
}