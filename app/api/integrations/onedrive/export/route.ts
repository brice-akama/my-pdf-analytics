import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { dbPromise } from "@/app/api/lib/mongodb"
import { ObjectId } from "mongodb"
import cloudinary from "cloudinary"

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

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
        console.error("❌ [ONEDRIVE EXPORT] Token refresh failed:", refreshData)
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
      console.log("✅ [ONEDRIVE EXPORT] Token refreshed")
    }

    // ── Get signed PDF if document has signatures, otherwise use original ──
    console.log('📥 [ONEDRIVE EXPORT] Checking for signed version...')

    let finalBuffer: ArrayBuffer | null = null
    let fileName = document.originalFilename || `document-${documentId}.pdf`

    // Check for completed signatures
    const signatureRequests = await db.collection("signature_requests").find({
      documentId: documentId,
      status: "signed",
    }).toArray()

    console.log('📥 [ONEDRIVE EXPORT] Signed requests found:', signatureRequests.length)

    if (signatureRequests.length > 0) {
      console.log('✍️ [ONEDRIVE EXPORT] Generating signed PDF...')
      try {
        const { generateSignedPDF } = await import("@/lib/pdfGenerator")

        const signedPdfUrl = await generateSignedPDF(documentId, signatureRequests)
        console.log('✅ [ONEDRIVE EXPORT] Signed PDF URL:', signedPdfUrl)

        const urlMatch = signedPdfUrl.match(/\/signed_documents\/(.+?)\.pdf/)
        if (urlMatch) {
          const publicId = `signed_documents/${urlMatch[1]}`
          console.log('🔑 [ONEDRIVE EXPORT] Signed PDF public_id:', publicId)

          const authenticatedUrl = cloudinary.v2.utils.private_download_url(
            publicId,
            'pdf',
            {
              resource_type: 'image',
              type: 'upload',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            }
          )

          const signedResponse = await fetch(authenticatedUrl)
          console.log('📥 [ONEDRIVE EXPORT] Signed PDF fetch status:', signedResponse.status)

          if (signedResponse.ok) {
            finalBuffer = await signedResponse.arrayBuffer()
            fileName = `signed_${fileName}`
            console.log('✅ [ONEDRIVE EXPORT] Got signed PDF:', finalBuffer.byteLength, 'bytes')
          }
        }
      } catch (err) {
        console.error('⚠️ [ONEDRIVE EXPORT] Failed to get signed PDF, falling back to original:', err)
      }
    }

    // Fallback to original PDF
    if (!finalBuffer) {
      console.log('📥 [ONEDRIVE EXPORT] Using original PDF...')

      const fileUrl =
        document.cloudinaryPdfUrl ||
        document.cloudinaryOriginalUrl ||
        document.fileUrl ||
        document.pdfUrl

      if (!fileUrl) {
        console.error('❌ [ONEDRIVE EXPORT] No URL. Doc keys:', Object.keys(document))
        return NextResponse.json({ error: "No file URL found for document" }, { status: 400 })
      }

      const publicIdMatch = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/)
      if (!publicIdMatch) {
        console.error('❌ [ONEDRIVE EXPORT] Could not extract public_id from:', fileUrl)
        return NextResponse.json({ error: "Invalid Cloudinary URL format" }, { status: 500 })
      }

      const publicId = publicIdMatch[1]
      console.log('🔑 [ONEDRIVE EXPORT] Extracted public_id:', publicId)

      const resourceTypes: Array<"image" | "raw" | "auto"> = ["image", "raw", "auto"]

      for (const resourceType of resourceTypes) {
        try {
          console.log(`📥 [ONEDRIVE EXPORT] Trying resource_type: ${resourceType}`)

          const authenticatedUrl = cloudinary.v2.utils.private_download_url(
            publicId,
            'pdf',
            {
              resource_type: resourceType,
              type: 'upload',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            }
          )

          const fileResponse = await fetch(authenticatedUrl)
          console.log(`📥 [ONEDRIVE EXPORT] Response (${resourceType}):`, fileResponse.status)

          if (fileResponse.ok) {
            finalBuffer = await fileResponse.arrayBuffer()
            console.log(`✅ [ONEDRIVE EXPORT] Downloaded ${finalBuffer.byteLength} bytes via ${resourceType}`)
            break
          }

          const errText = await fileResponse.text()
          console.warn(`⚠️ [ONEDRIVE EXPORT] ${resourceType} failed:`, fileResponse.status, errText.slice(0, 150))

        } catch (err) {
          console.warn(`⚠️ [ONEDRIVE EXPORT] ${resourceType} threw:`, err)
        }
      }

      // Last resort — plain URL
      if (!finalBuffer) {
        console.log('📥 [ONEDRIVE EXPORT] Trying plain public URL as fallback...')
        const plainResponse = await fetch(fileUrl)
        console.log('📥 [ONEDRIVE EXPORT] Plain URL status:', plainResponse.status)
        if (plainResponse.ok) {
          finalBuffer = await plainResponse.arrayBuffer()
          console.log('✅ [ONEDRIVE EXPORT] Downloaded via plain URL:', finalBuffer.byteLength, 'bytes')
        }
      }
    }

    if (!finalBuffer || finalBuffer.byteLength === 0) {
      console.error('❌ [ONEDRIVE EXPORT] All download attempts failed')
      return NextResponse.json({
        error: "Failed to download document from storage",
      }, { status: 500 })
    }

    // ── Upload to OneDrive ────────────────────────────────────────────
    const fileSize = finalBuffer.byteLength
    console.log(`📤 [ONEDRIVE EXPORT] Uploading ${fileSize} bytes as "${fileName}"`)

    let uploadedFile: any

    if (fileSize < 4 * 1024 * 1024) {
      // Simple upload for files under 4MB
      console.log('📤 [ONEDRIVE EXPORT] Using simple upload...')

      const uploadRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(fileName)}:/content`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            "Content-Type": "application/pdf",
          },
          body: new Uint8Array(finalBuffer),
        }
      )

      console.log('📤 [ONEDRIVE EXPORT] Simple upload status:', uploadRes.status)

      if (!uploadRes.ok) {
        const errText = await uploadRes.text()
        console.error("❌ [ONEDRIVE EXPORT] Simple upload failed:", uploadRes.status, errText)
        return NextResponse.json({
          error: "Failed to upload to OneDrive",
          details: errText,
        }, { status: 500 })
      }

      uploadedFile = await uploadRes.json()

    } else {
      // Large file: create upload session
      console.log('📤 [ONEDRIVE EXPORT] Using session upload for large file...')

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

      console.log('📤 [ONEDRIVE EXPORT] Session creation status:', sessionRes.status)

      if (!sessionRes.ok) {
        const errText = await sessionRes.text()
        console.error("❌ [ONEDRIVE EXPORT] Session creation failed:", errText)
        return NextResponse.json({
          error: "Failed to create OneDrive upload session",
          details: errText,
        }, { status: 500 })
      }

      const session = await sessionRes.json()
      const uploadUrl = session.uploadUrl

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Range": `bytes 0-${fileSize - 1}/${fileSize}`,
          "Content-Type": "application/pdf",
        },
        body: new Uint8Array(finalBuffer),
      })

      console.log('📤 [ONEDRIVE EXPORT] Session upload status:', uploadRes.status)

      if (!uploadRes.ok) {
        const errText = await uploadRes.text()
        console.error("❌ [ONEDRIVE EXPORT] Session upload failed:", errText)
        return NextResponse.json({
          error: "Failed to upload to OneDrive",
          details: errText,
        }, { status: 500 })
      }

      uploadedFile = await uploadRes.json()
    }

    console.log(`✅ [ONEDRIVE EXPORT] Uploaded successfully. ID: ${uploadedFile.id}`)

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
    console.error("❌ [ONEDRIVE EXPORT] Unexpected error:", error)
    return NextResponse.json({
      error: "Export failed",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}