import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { dbPromise } from "@/app/api/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [ONEDRIVE EXPORT] Starting...')

    const user = await verifyUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { documentId } = await request.json()
    if (!documentId) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 })
    }

    const db = await dbPromise

    // Get document
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(documentId),
      userId: user.id,
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Get OneDrive integration
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
      console.log("🔄 [ONEDRIVE EXPORT] Refreshing token...")

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
        return NextResponse.json(
          { error: "Session expired. Please reconnect OneDrive." },
          { status: 401 }
        )
      }

      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000)
      await db.collection("integrations").updateOne(
        { userId: user.id, provider: "onedrive" },
        { $set: { accessToken: refreshData.access_token, expiresAt: newExpiresAt, updatedAt: new Date() } }
      )
      integration.accessToken = refreshData.access_token
    }

    // Download PDF from Cloudinary
    console.log('📥 [ONEDRIVE EXPORT] Downloading from Cloudinary...')
    const fileUrl = document.cloudinaryPdfUrl || document.cloudinaryOriginalUrl
    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL found for document" }, { status: 400 })
    }

    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed to download document" }, { status: 500 })
    }
    const fileBuffer = await fileResponse.arrayBuffer()
    const fileName = document.originalFilename || `document-${documentId}.pdf`

    // Upload to OneDrive using simple PUT (works for files under 4MB)
    // For larger files use the session-based upload below
    const fileSize = fileBuffer.byteLength

    let uploadedFile: any

    if (fileSize < 4 * 1024 * 1024) {
      // Simple upload for files under 4MB
      console.log('📤 [ONEDRIVE EXPORT] Simple upload...')
      const uploadRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(fileName)}:/content`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            "Content-Type": "application/pdf",
          },
          body: fileBuffer,
        }
      )

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        console.error("❌ [ONEDRIVE EXPORT] Upload failed:", err)
        return NextResponse.json({ error: "Failed to upload to OneDrive" }, { status: 500 })
      }

      uploadedFile = await uploadRes.json()

    } else {
      // Large file: create upload session
      console.log('📤 [ONEDRIVE EXPORT] Large file - creating upload session...')

      const sessionRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(fileName)}:/createUploadSession`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            item: {
              "@microsoft.graph.conflictBehavior": "rename",
              name: fileName,
            },
          }),
        }
      )

      if (!sessionRes.ok) {
        const err = await sessionRes.json()
        console.error("❌ [ONEDRIVE EXPORT] Session creation failed:", err)
        return NextResponse.json({ error: "Failed to create upload session" }, { status: 500 })
      }

      const session = await sessionRes.json()
      const uploadUrl = session.uploadUrl

      // Upload in one chunk (simplest approach)
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Range": `bytes 0-${fileSize - 1}/${fileSize}`,
          "Content-Type": "application/pdf",
        },
        body: fileBuffer,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        console.error("❌ [ONEDRIVE EXPORT] Upload failed:", err)
        return NextResponse.json({ error: "Failed to upload to OneDrive" }, { status: 500 })
      }

      uploadedFile = await uploadRes.json()
    }

    console.log(`✅ [ONEDRIVE EXPORT] Uploaded: ${uploadedFile.id}`)

    // Log export
    await db.collection('analytics_logs').insertOne({
      documentId,
      action: 'exported_to_onedrive',
      userId: user.id,
      oneDriveFileId: uploadedFile.id,
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `${fileName} exported to OneDrive`,
      oneDriveFileId: uploadedFile.id,
      oneDriveFileName: uploadedFile.name,
      webUrl: uploadedFile.webUrl,
    })

  } catch (error) {
    console.error("❌ [ONEDRIVE EXPORT] Error:", error)
    return NextResponse.json({
      error: "Export failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}