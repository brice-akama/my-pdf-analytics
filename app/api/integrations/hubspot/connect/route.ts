import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build HubSpot OAuth URL
    const hubspotAuthUrl = new URL("https://app.hubspot.com/oauth/authorize");
    hubspotAuthUrl.searchParams.append("client_id", process.env.HUBSPOT_CLIENT_ID!);
    hubspotAuthUrl.searchParams.append("redirect_uri", process.env.HUBSPOT_REDIRECT_URI!);
    hubspotAuthUrl.searchParams.append("scope", "crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write timeline");
    hubspotAuthUrl.searchParams.append("state", user.id);

    return NextResponse.redirect(hubspotAuthUrl.toString());
  } catch (error) {
    console.error("HubSpot connect error:", error);
    return NextResponse.json({ error: "Failed to connect" }, { status: 500 });
  }
}