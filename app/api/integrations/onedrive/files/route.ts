import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { dbPromise } from "@/app/api/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "onedrive",
      isActive: true,
    })

    if (!integration) {
      return NextResponse.json({ error: "OneDrive not connected" }, { status: 404 })
    }

    // Refresh token if expired
    const now = new Date()
    if (integration.expiresAt && new Date(integration.expiresAt) < now) {
      console.log("🔄 OneDrive token expired, refreshing...")

      const refreshResponse = await fetch(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: integration.refreshToken,
            client_id: process.env.OUTLOOK_CLIENT_ID!,
            client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
            redirect_uri: process.env.ONEDRIVE_REDIRECT_URI!,
          }),
        }
      )

      const refreshData = await refreshResponse.json()

      if (!refreshResponse.ok) {
        console.error("❌ OneDrive token refresh failed:", refreshData)
        return NextResponse.json(
          { error: "Session expired. Please reconnect OneDrive." },
          { status: 401 }
        )
      }

      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000)

      await db.collection("integrations").updateOne(
        { userId: user.id, provider: "onedrive" },
        {
          $set: {
            accessToken: refreshData.access_token,
            expiresAt: newExpiresAt,
            updatedAt: new Date(),
          },
        }
      )

      integration.accessToken = refreshData.access_token
      console.log("✅ OneDrive token refreshed")
    }

    // Search OneDrive for PDFs
    const searchRes = await fetch(
      "https://graph.microsoft.com/v1.0/me/drive/root/search(q='.pdf')?$select=id,name,size,lastModifiedDateTime,file&$top=50",
      { headers: { Authorization: `Bearer ${integration.accessToken}` } }
    )

    if (!searchRes.ok) {
      const err = await searchRes.json()
      console.error("❌ OneDrive files fetch error:", err)
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
    }

    const data = await searchRes.json()

    const files = (data.value || [])
      .filter((f: any) => f.file?.mimeType === 'application/pdf')
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        size: f.size?.toString(),
        modifiedTime: f.lastModifiedDateTime,
      }))

    console.log(`✅ Found ${files.length} PDF files in OneDrive`)

    return NextResponse.json({ success: true, files })

  } catch (error) {
    console.error("OneDrive files error:", error)
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}