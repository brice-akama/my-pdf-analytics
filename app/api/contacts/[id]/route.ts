 
 //app/api/contacts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../../lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyUserFromRequest } from "@/lib/auth"
import { getTeamMemberIds } from "../../lib/teamHelpers" // ✅ ADD THIS

export const dynamic = 'force-dynamic'

//   UPDATED DELETE - Team isolation
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
    
    //   GET USER ROLE
    const profile = await db.collection("profiles").findOne({ user_id: user.id })
    const userRole = profile?.role || "owner"
    
    //   Check permissions
    const contact = await db.collection("contacts").findOne({
      _id: new ObjectId(id)
    })
    
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }
    
    const contactOwnerId = contact.userId.toString()
    
    //   PERMISSION LOGIC:
    // - Owner/Admin can delete ANY team contact
    // - Members can only delete their own contacts
    if (userRole === "member" && contactOwnerId !== user.id) {
      return NextResponse.json({ 
        error: "You can only delete your own contacts" 
      }, { status: 403 })
    }
    
    //   For owner/admin, verify contact belongs to team
    if (userRole !== "member") {
      const visibleUserIds = await getTeamMemberIds(user.id, userRole)
      if (!visibleUserIds.includes(contactOwnerId)) {
        return NextResponse.json({ 
          error: "Contact not found" 
        }, { status: 404 })
      }
    }

    const result = await db.collection("contacts").deleteOne({
      _id: new ObjectId(id)
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

//   UPDATED PATCH - Team isolation
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
    
    //   GET USER ROLE
    const profile = await db.collection("profiles").findOne({ user_id: user.id })
    const userRole = profile?.role || "owner"
    
    //   Check permissions
    const contact = await db.collection("contacts").findOne({
      _id: new ObjectId(id)
    })
    
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }
    
    const contactOwnerId = contact.userId.toString()
    
    //   PERMISSION LOGIC:
    // - Owner/Admin can edit ANY team contact
    // - Members can only edit their own contacts
    if (userRole === "member" && contactOwnerId !== user.id) {
      return NextResponse.json({ 
        error: "You can only edit your own contacts" 
      }, { status: 403 })
    }
    
    // ✅ For owner/admin, verify contact belongs to team
    if (userRole !== "member") {
      const visibleUserIds = await getTeamMemberIds(user.id, userRole)
      if (!visibleUserIds.includes(contactOwnerId)) {
        return NextResponse.json({ 
          error: "Contact not found" 
        }, { status: 404 })
      }
    }

    const result = await db.collection("contacts").updateOne(
      {
        _id: new ObjectId(id)
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