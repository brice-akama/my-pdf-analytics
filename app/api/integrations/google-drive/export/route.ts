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
        console.error("❌ [GDRIVE EXPORT] Token refresh failed:", refreshData)
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
      console.log("✅ [GDRIVE EXPORT] Token refreshed")
    }

    // ── Get signed PDF if document has signatures, otherwise use original ──
    console.log('📥 [GDRIVE EXPORT] Checking for signed version...')

    let finalBuffer: ArrayBuffer | null = null
    let fileName = document.originalFilename || `document-${documentId}.pdf`

    // Check for completed signatures
    const signatureRequests = await db.collection("signature_requests").find({
      documentId: documentId,
      status: "signed",
    }).toArray()

    console.log('📥 [GDRIVE EXPORT] Signed requests found:', signatureRequests.length)

    if (signatureRequests.length > 0) {
      console.log('✍️ [GDRIVE EXPORT] Generating signed PDF...')
      try {
        const { generateSignedPDF } = await import("@/lib/pdfGenerator")

        const signedPdfUrl = await generateSignedPDF(documentId, signatureRequests)
        console.log('✅ [GDRIVE EXPORT] Signed PDF URL:', signedPdfUrl)

        // Extract public_id from signed PDF URL
        // signed PDFs are stored as: signed_documents/xxxxx
        const urlMatch = signedPdfUrl.match(/\/signed_documents\/(.+?)\.pdf/)
        if (urlMatch) {
          const publicId = `signed_documents/${urlMatch[1]}`
          console.log('🔑 [GDRIVE EXPORT] Signed PDF public_id:', publicId)

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
          console.log('📥 [GDRIVE EXPORT] Signed PDF fetch status:', signedResponse.status)

          if (signedResponse.ok) {
            finalBuffer = await signedResponse.arrayBuffer()
            // Use signed_ prefix for the filename
            fileName = `signed_${fileName}`
            console.log('✅ [GDRIVE EXPORT] Got signed PDF:', finalBuffer.byteLength, 'bytes')
          }
        }
      } catch (err) {
        console.error('⚠️ [GDRIVE EXPORT] Failed to get signed PDF, falling back to original:', err)
      }
    }

    // Fallback to original PDF if no signatures or signed generation failed
    if (!finalBuffer) {
      console.log('📥 [GDRIVE EXPORT] Using original PDF...')

      const fileUrl =
        document.cloudinaryPdfUrl ||
        document.cloudinaryOriginalUrl ||
        document.fileUrl ||
        document.pdfUrl ||
        document.url

      if (!fileUrl) {
        console.error('❌ [GDRIVE EXPORT] No URL. Doc keys:', Object.keys(document))
        return NextResponse.json({ error: "No file URL found for document" }, { status: 400 })
      }

      console.log('📥 [GDRIVE EXPORT] Using URL:', fileUrl)

      const publicIdMatch = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/)
      if (!publicIdMatch) {
        console.error('❌ [GDRIVE EXPORT] Could not extract public_id from URL:', fileUrl)
        return NextResponse.json({ error: "Invalid Cloudinary URL format" }, { status: 500 })
      }

      const publicId = publicIdMatch[1]
      console.log('🔑 [GDRIVE EXPORT] Extracted public_id:', publicId)

      const resourceTypes: Array<"image" | "raw" | "auto"> = ["image", "raw", "auto"]

      for (const resourceType of resourceTypes) {
        try {
          console.log(`📥 [GDRIVE EXPORT] Trying resource_type: ${resourceType}`)

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
          console.log(`📥 [GDRIVE EXPORT] Response (${resourceType}):`, fileResponse.status)

          if (fileResponse.ok) {
            finalBuffer = await fileResponse.arrayBuffer()
            console.log(`✅ [GDRIVE EXPORT] Downloaded ${finalBuffer.byteLength} bytes via ${resourceType}`)
            break
          }

          const errText = await fileResponse.text()
          console.warn(`⚠️ [GDRIVE EXPORT] ${resourceType} failed:`, fileResponse.status, errText.slice(0, 150))

        } catch (err) {
          console.warn(`⚠️ [GDRIVE EXPORT] ${resourceType} threw error:`, err)
        }
      }

      // Last resort — plain URL
      if (!finalBuffer) {
        console.log('📥 [GDRIVE EXPORT] Trying plain public URL as last resort...')
        const plainResponse = await fetch(fileUrl)
        console.log('📥 [GDRIVE EXPORT] Plain URL status:', plainResponse.status)
        if (plainResponse.ok) {
          finalBuffer = await plainResponse.arrayBuffer()
          console.log('✅ [GDRIVE EXPORT] Downloaded via plain URL:', finalBuffer.byteLength, 'bytes')
        }
      }
    }

    if (!finalBuffer || finalBuffer.byteLength === 0) {
      console.error('❌ [GDRIVE EXPORT] All download attempts failed')
      return NextResponse.json({
        error: "Failed to download document from storage. Please try again.",
      }, { status: 500 })
    }

    // ── Upload to Google Drive ────────────────────────────────────────
    console.log('📤 [GDRIVE EXPORT] Uploading to Google Drive...')

    // Step 1: Start resumable upload session
    const initResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": "application/pdf",
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: "application/pdf",
        }),
      }
    )

    if (!initResponse.ok) {
      const errText = await initResponse.text()
      console.error("❌ [GDRIVE EXPORT] Init failed:", initResponse.status, errText)
      return NextResponse.json({
        error: "Failed to initiate upload to Google Drive",
        details: errText,
      }, { status: 500 })
    }

    const uploadUrl = initResponse.headers.get("Location")
    console.log('📤 [GDRIVE EXPORT] Upload URL obtained:', !!uploadUrl)

    if (!uploadUrl) {
      return NextResponse.json({ error: "No upload URL returned from Google Drive" }, { status: 500 })
    }

    // Step 2: Upload file content
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/pdf",
      },
      body: new Uint8Array(finalBuffer),
    })

    console.log('📤 [GDRIVE EXPORT] Upload response status:', uploadResponse.status)

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text()
      console.error("❌ [GDRIVE EXPORT] Upload failed:", uploadResponse.status, errText)
      return NextResponse.json({
        error: "Failed to upload to Google Drive",
        details: errText,
      }, { status: 500 })
    }

    const uploadedFile = await uploadResponse.json()
    console.log(`✅ [GDRIVE EXPORT] Uploaded successfully. Drive file ID: ${uploadedFile.id}`)

    // Log export
    await db.collection('analytics_logs').insertOne({
      documentId,
      action: 'exported_to_google_drive',
      userId: user.id,
      driveFileId: uploadedFile.id,
      timestamp: new Date(),
    })

    const webUrl = `https://drive.google.com/file/d/${uploadedFile.id}/view`

    return NextResponse.json({
      success: true,
      message: `${fileName} exported to Google Drive`,
      driveFileId: uploadedFile.id,
      driveFileName: uploadedFile.name,
      webUrl,
    })

  } catch (error) {
    console.error("❌ [GDRIVE EXPORT] Unexpected error:", error)
    return NextResponse.json({
      error: "Export failed",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}