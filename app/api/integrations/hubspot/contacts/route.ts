import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { getValidHubSpotToken } from "@/lib/integrations/hubspot";
import { dbPromise } from "../../../lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get valid token (auto-refreshes if expired)
    const token = await getValidHubSpotToken(user.id);

    // Fetch contacts from HubSpot
    const response = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,company,phone",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("HubSpot contacts error:", data);
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contacts: data.results.map((contact: any) => ({
        id: contact.id,
        firstName: contact.properties.firstname || "",
        lastName: contact.properties.lastname || "",
        email: contact.properties.email || "",
        company: contact.properties.company || "",
        phone: contact.properties.phone || "",
      })),
    });
  } catch (error) {
    console.error("HubSpot contacts error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

// Sync contacts to DocMetrics
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getValidHubSpotToken(user.id);
    const db = await dbPromise;

    // Fetch all contacts
    const response = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,company,phone",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();

    // Import to DocMetrics contacts
    let imported = 0;
    for (const contact of data.results) {
      const props = contact.properties;
      
      if (!props.email) continue; // Skip contacts without email

      await db.collection("contacts").updateOne(
        { email: props.email },
        {
          $set: {
            name: `${props.firstname || ""} ${props.lastname || ""}`.trim(),
            email: props.email,
            company: props.company || undefined,
            phone: props.phone || undefined,
            hubspotId: contact.id,
            addedBy: user.email,
            syncedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      message: `Imported ${imported} contacts from HubSpot`,
    });
  } catch (error) {
    console.error("HubSpot sync error:", error);
    return NextResponse.json({ error: "Failed to sync contacts" }, { status: 500 });
  }
}