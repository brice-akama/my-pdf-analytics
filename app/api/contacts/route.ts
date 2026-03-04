// app/api/contacts/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbPromise } from "../lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyUserFromRequest } from "@/lib/auth"

export const dynamic = 'force-dynamic'

// GET - Only return contacts belonging to the requesting user
export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise

    const contacts = await db
      .collection("contacts")
      .find({ userId: new ObjectId(user.id) }) // ✅ strict: only this user's contacts
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
        addedBy: c.userId.toString(),
      })),
    })
  } catch (error) {
    console.error("GET contacts error:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

// POST - Create contact owned strictly by the requesting user
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

    // Check duplicate only within this user's own contacts
    const existing = await db.collection("contacts").findOne({
      userId: new ObjectId(user.id), // ✅ strict: only check this user's contacts
      email: email.toLowerCase().trim(),
    })

    if (existing) {
      return NextResponse.json(
        { error: "You already have a contact with this email" },
        { status: 400 }
      )
    }

    const contact = {
      userId: new ObjectId(user.id),
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