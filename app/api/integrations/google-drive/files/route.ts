// app/api/integrations/google-drive/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../../lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;
    const integration = await db.collection("integrations").findOne({
      userId: user.id, // match your regular uploads
      provider: "google_drive",
      isActive: true,
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 404 }
      );
    }

    // ✅ CHECK IF TOKEN IS EXPIRED
    const now = new Date();
    if (integration.expiresAt && new Date(integration.expiresAt) < now) {
      console.log("🔄 Token expired, refreshing...");

      // ✅ REFRESH THE TOKEN
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: integration.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        console.error("❌ Token refresh failed:", refreshData);
        return NextResponse.json(
          { error: "Session expired. Please reconnect Google Drive." },
          { status: 401 }
        );
      }

      // ✅ UPDATE TOKEN IN DATABASE
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);
      
      await db.collection("integrations").updateOne(
        { userId: user.id, provider: "google_drive" },
        {
          $set: {
            accessToken: refreshData.access_token,
            expiresAt: newExpiresAt,
            updatedAt: new Date(),
          },
        }
      );

      // ✅ USE NEW TOKEN
      integration.accessToken = refreshData.access_token;
      console.log("✅ Token refreshed successfully");
    }

    // ✅ JUST LIST FILES (NO DOWNLOAD) - FAST!
    const filesResponse = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=mimeType='application/pdf'&pageSize=50&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,thumbnailLink)",
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    );

    if (!filesResponse.ok) {
      const errorText = await filesResponse.text();
      console.error("❌ Failed to fetch files:", errorText);
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
    }

    const filesData = await filesResponse.json();
    console.log(`✅ Found ${filesData.files?.length || 0} PDF files`);

    return NextResponse.json({
      success: true,
      files: filesData.files || [],
    });
  } catch (error) {
    console.error("Google Drive files error:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}