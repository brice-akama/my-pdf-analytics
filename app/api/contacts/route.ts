//app/api/contacts/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyUserFromRequest } from "@/lib/auth"
import { getTeamMemberIds } from "../lib/teamHelpers" // ✅ ADD THIS

export const dynamic = 'force-dynamic'

//  UPDATED GET - Team isolation
export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise
    
    //   GET USER ROLE
    const profile = await db.collection("profiles").findOne({ user_id: user.id })
    const userRole = profile?.role || "owner"
    
    //   GET VISIBLE USER IDS
    const visibleUserIds = await getTeamMemberIds(user.id, userRole)
    
    console.log(`📇 User ${user.email} (${userRole}) can see contacts from:`, visibleUserIds)
    
    //   Convert string IDs to ObjectIds for query
    const visibleObjectIds = visibleUserIds.map(id => new ObjectId(id))
    
    const contacts = await db
      .collection("contacts")
      .find({ userId: { $in: visibleObjectIds } }) // ✅ TEAM ISOLATION
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      contacts: contacts.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        email: c.email,
        company: c.company,
        phone: c.phone,
        notes: c.notes,
        createdAt: c.createdAt,
        addedBy: c.userId.toString(), //    ADD THIS to show who added the contact
      })),
    })
  } catch (error) {
    console.error("GET contacts error:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

//   POST - Keep as is (contacts are owned by who creates them)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, company, phone, notes } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 })
    }

    const db = await dbPromise
    
    //   UPDATED: Check for duplicate across entire team (owner/admin can see)
    const profile = await db.collection("profiles").findOne({ user_id: user.id })
    const userRole = profile?.role || "owner"
    const visibleUserIds = await getTeamMemberIds(user.id, userRole)
    const visibleObjectIds = visibleUserIds.map(id => new ObjectId(id))
    
    const existing = await db.collection("contacts").findOne({
      userId: { $in: visibleObjectIds }, // Check across team's contacts
      email: email.toLowerCase().trim()
    })

    if (existing) {
      return NextResponse.json({ 
        error: existing.userId.toString() === user.id 
          ? "You already have a contact with this email" 
          : "This contact already exists in your team" 
      }, { status: 400 })
    }

    //   OPTIONAL: Get creator's info for better attribution
    const creatorInfo = {
      userId: user.id,
      name: profile?.full_name || user.email,
      email: user.email,
      role: profile?.role || "owner"
    }

    const contact = {
      userId: new ObjectId(user.id), //  Keep as creator's ID
      
      //   OPTIONAL: Add metadata
      addedBy: creatorInfo,
      
      name: name.trim(),
      email: email.toLowerCase().trim(),
      company: company?.trim() || null,
      phone: phone?.trim() || null,
      notes: notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("contacts").insertOne(contact)

    return NextResponse.json({
      success: true,
      contactId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("POST contact error:", error)
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
  }
}