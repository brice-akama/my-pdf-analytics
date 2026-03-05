import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { dbPromise } from "@/app/api/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [GDRIVE EXPORT] Starting...')

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

    // Get Google Drive integration
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "google_drive",
      isActive: true,
    })

    if (!integration) {
      return NextResponse.json({ error: "Google Drive not connected" }, { status: 404 })
    }

    // Refresh token if expired
    const now = new Date()
    if (integration.expiresAt && new Date(integration.expiresAt) < now) {
      console.log("🔄 [GDRIVE EXPORT] Refreshing token...")

      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: integration.refreshToken,
          grant_type: "refresh_token",
        }),
      })

      const refreshData = await refreshResponse.json()

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: "Session expired. Please reconnect Google Drive." },
          { status: 401 }
        )
      }

      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000)
      await db.collection("integrations").updateOne(
        { userId: user.id, provider: "google_drive" },
        { $set: { accessToken: refreshData.access_token, expiresAt: newExpiresAt, updatedAt: new Date() } }
      )
      integration.accessToken = refreshData.access_token
    }

    // Download PDF from Cloudinary
    console.log('📥 [GDRIVE EXPORT] Downloading from Cloudinary...')
    const fileUrl = document.cloudinaryPdfUrl || document.cloudinaryOriginalUrl
    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL found for document" }, { status: 400 })
    }

    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed to download document" }, { status: 500 })
    }
    const fileBuffer = await fileResponse.arrayBuffer()

    // Upload to Google Drive
    console.log('📤 [GDRIVE EXPORT] Uploading to Google Drive...')
    const fileName = document.originalFilename || `document-${documentId}.pdf`

    // Step 1: Start resumable upload session
    const initResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": "application/pdf",
          "X-Upload-Content-Length": fileBuffer.byteLength.toString(),
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: "application/pdf",
        }),
      }
    )

    if (!initResponse.ok) {
      const err = await initResponse.json()
      console.error("❌ [GDRIVE EXPORT] Init failed:", err)
      return NextResponse.json({ error: "Failed to initiate upload to Google Drive" }, { status: 500 })
    }

    const uploadUrl = initResponse.headers.get("Location")
    if (!uploadUrl) {
      return NextResponse.json({ error: "No upload URL returned" }, { status: 500 })
    }

    // Step 2: Upload file content
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": fileBuffer.byteLength.toString(),
      },
      body: fileBuffer,
    })

    if (!uploadResponse.ok) {
      const err = await uploadResponse.json()
      console.error("❌ [GDRIVE EXPORT] Upload failed:", err)
      return NextResponse.json({ error: "Failed to upload to Google Drive" }, { status: 500 })
    }

    const uploadedFile = await uploadResponse.json()
    console.log(`✅ [GDRIVE EXPORT] Uploaded: ${uploadedFile.id}`)

    // Log export
    await db.collection('analytics_logs').insertOne({
      documentId,
      action: 'exported_to_google_drive',
      userId: user.id,
      driveFileId: uploadedFile.id,
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `${fileName} exported to Google Drive`,
      driveFileId: uploadedFile.id,
      driveFileName: uploadedFile.name,
    })

  } catch (error) {
    console.error("❌ [GDRIVE EXPORT] Error:", error)
    return NextResponse.json({
      error: "Export failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}