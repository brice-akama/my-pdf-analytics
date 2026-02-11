 import { dbPromise } from "@/app/api/lib/mongodb";

// Auto-refresh token if expired
export async function getValidHubSpotToken(userId: string): Promise<string> {
  const db = await dbPromise;
  const integration = await db.collection("integrations").findOne({
    userId,
    provider: "hubspot",
    isActive: true,
  });

  if (!integration) {
    throw new Error("HubSpot not connected");
  }

  // Check if token expired
  if (new Date() >= integration.expiresAt) {
    console.log("🔄 HubSpot token expired, refreshing...");

    const refreshResponse = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        refresh_token: integration.refreshToken,
      }),
    });

    const tokenData = await refreshResponse.json();

    if (tokenData.error) {
      throw new Error(`Token refresh failed: ${tokenData.error}`);
    }

    // Update in database
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    await db.collection("integrations").updateOne(
      { _id: integration._id },
      {
        $set: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt,
          updatedAt: new Date(),
        },
      }
    );

    console.log("✅ HubSpot token refreshed");
    return tokenData.access_token;
  }

  return integration.accessToken;
}

// Log document view in HubSpot timeline
export async function logDocumentViewInHubSpot({
  userId,
  contactEmail,
  documentName,
  duration,
  documentId,
}: {
  userId: string;
  contactEmail: string;
  documentName: string;
  duration: number;
  documentId: string;
}) {
  try {
    const token = await getValidHubSpotToken(userId);
    const db = await dbPromise;

    // Find contact by email
    const contact = await db.collection("contacts").findOne({
      email: contactEmail,
      hubspotId: { $exists: true },
    });

    if (!contact?.hubspotId) {
      console.log("Contact not found in HubSpot:", contactEmail);
      return { success: false, reason: "contact_not_found" };
    }

    // Create timeline event
    const response = await fetch("https://api.hubapi.com/crm/v3/timeline/events", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventTemplateId: "document_viewed", // You'll create this in HubSpot
        email: contactEmail,
        extraData: {
          documentName,
          duration: `${duration}s`,
          documentLink: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("HubSpot timeline error:", data);
      return { success: false, error: data };
    }

    console.log("✅ Logged view in HubSpot");
    return { success: true };
  } catch (error) {
    console.error("HubSpot log error:", error);
    return { success: false, error };
  }
}

// Update deal when document signed
export async function updateHubSpotDealOnSignature({
  userId,
  dealId,
  documentName,
}: {
  userId: string;
  dealId: string;
  documentName: string;
}) {
  try {
    const token = await getValidHubSpotToken(userId);

    // Update deal stage
    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          dealstage: "contractsent", // Adjust to your pipeline
          hs_lastmodifieddate: new Date().toISOString(),
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("HubSpot deal update error:", data);
      return { success: false, error: data };
    }

    console.log("✅ HubSpot deal updated");
    return { success: true };
  } catch (error) {
    console.error("HubSpot deal update error:", error);
    return { success: false, error };
  }
}