import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { dbPromise } from "@/app/api/lib/mongodb"
import { extractTextFromPdf, extractMetadata, analyzeDocument } from "@/lib/document-processor"
import cloudinary from "cloudinary"
import streamifier from "streamifier"

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

async function uploadToCloudinary(buffer: Buffer, filename: string, folder: string) {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        public_id: filename.replace(/\.[^/.]+$/, ""),
        resource_type: "auto",
        type: 'upload',
        access_mode: 'public'
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result?.secure_url || '')
      }
    )
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

function generateSummary(text: string) {
  const sentences = text.split(/[.!?]/).filter(Boolean)
  if (sentences.length <= 3) return text
  return sentences.slice(0, 3).join(". ") + "."
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 [ONEDRIVE IMPORT] Starting...')

    const user = await verifyUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId, fileName } = await request.json()
    if (!fileId || !fileName) {
      return NextResponse.json({ error: "fileId and fileName required" }, { status: 400 })
    }

    const db = await dbPromise

    const profile = await db.collection('profiles').findOne({ user_id: user.id })
    const organizationId = profile?.organization_id || user.id

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
      console.log("🔄 [ONEDRIVE IMPORT] Token expired, refreshing...")

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
        console.error("❌ [ONEDRIVE IMPORT] Token refresh failed:", refreshData)
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
      console.log("✅ [ONEDRIVE IMPORT] Token refreshed")
    }

    // Download file from OneDrive
    console.log('📥 [ONEDRIVE IMPORT] Downloading file...')
    const downloadRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
      { headers: { Authorization: `Bearer ${integration.accessToken}` } }
    )

    if (!downloadRes.ok) {
      const errText = await downloadRes.text()
      console.error("❌ [ONEDRIVE IMPORT] Download failed:", errText)
      return NextResponse.json({ error: "Failed to download file from OneDrive" }, { status: 500 })
    }

    const buffer = Buffer.from(await downloadRes.arrayBuffer())
    console.log(`✅ [ONEDRIVE IMPORT] Downloaded ${buffer.length} bytes`)

    // Process PDF
// Process PDF metadata only (fast)
const [metadata, extractedText] = await Promise.all([
  extractMetadata(buffer, "pdf"),
  extractTextFromPdf(buffer)
])

const scannedPdf = !extractedText || extractedText.trim().length < 30
const summary = generateSummary(extractedText)

// Upload to Cloudinary FIRST - don't wait for analysis
const folder = `users/${user.id}/documents`
const pdfUrl = await uploadToCloudinary(buffer, fileName, folder)

// Run analysis in background AFTER responding
const analysisPromise = analyzeDocument(extractedText, user.plan || "free")
  .then(async (analysis) => {
    const db2 = await dbPromise
    await db2.collection("documents").updateOne(
      { oneDriveFileId: fileId, userId: user.id },
      {
        $set: {
          analytics: {
            readabilityScore: analysis.readability,
            sentimentScore: analysis.sentiment,
            grammarIssues: analysis.grammar,
            spellingErrors: analysis.spelling,
            clarityScore: analysis.clarity,
            formalityLevel: analysis.formality,
            keywords: analysis.keywords,
            entities: analysis.entities,
            language: analysis.language,
            errorCounts: {
              grammar: analysis.grammar.length,
              spelling: analysis.spelling.length,
              clarity: analysis.clarity.length,
            },
            healthScore: analysis.healthScore,
          },
          lastAnalyzedAt: new Date(),
          updatedAt: new Date(),
        }
      }
    )
    console.log('✅ [ONEDRIVE IMPORT] Background analysis complete')
  })
  .catch(err => console.error('❌ [ONEDRIVE IMPORT] Background analysis failed:', err))

// Use empty analysis placeholder for immediate response
const analysis = {
  readability: 0, sentiment: 0, grammar: [], spelling: [],
  clarity: [], formality: 'neutral', keywords: [], entities: [],
  language: 'en', healthScore: 0
}
    console.log(`✅ [ONEDRIVE IMPORT] Uploaded to Cloudinary: ${pdfUrl}`)

    // Check for existing document (version logic)
    const existingDoc = await db.collection('documents').findOne({
      originalFilename: fileName,
      userId: user.id,
      organizationId,
      archived: { $ne: true }
    })

    if (existingDoc) {
      console.log('📦 [ONEDRIVE IMPORT] Existing document found - creating new version')

      const versionSnapshot = {
        documentId: existingDoc._id,
        version: existingDoc.version || 1,
        filename: existingDoc.originalFilename,
        originalFormat: existingDoc.originalFormat,
        mimeType: existingDoc.mimeType,
        size: existingDoc.size,
        pdfSize: existingDoc.pdfSize,
        numPages: existingDoc.numPages,
        wordCount: existingDoc.wordCount,
        charCount: existingDoc.charCount,
        cloudinaryPdfUrl: existingDoc.cloudinaryPdfUrl,
        cloudinaryOriginalUrl: existingDoc.cloudinaryOriginalUrl,
        extractedText: existingDoc.extractedText,
        analytics: existingDoc.analytics,
        tracking: existingDoc.tracking,
        uploadedBy: existingDoc.userId,
        createdAt: existingDoc.updatedAt || existingDoc.createdAt,
        changeLog: `Version ${existingDoc.version || 1} - Replaced by OneDrive import`,
        source: existingDoc.source || 'upload'
      }

      await db.collection('documentVersions').insertOne(versionSnapshot)

      await db.collection('documents').updateOne(
        { _id: existingDoc._id },
        {
          $set: {
            version: (existingDoc.version || 1) + 1,
            originalFormat: "pdf",
            mimeType: "application/pdf",
            size: buffer.length,
            pdfSize: buffer.length,
            cloudinaryOriginalUrl: pdfUrl,
            cloudinaryPdfUrl: pdfUrl,
            extractedText: extractedText.substring(0, 10000),
            numPages: metadata.pageCount,
            wordCount: metadata.wordCount,
            charCount: metadata.charCount,
            summary,
            scannedPdf,
            source: "onedrive",
            oneDriveFileId: fileId,
            analytics: {
              readabilityScore: analysis.readability,
              sentimentScore: analysis.sentiment,
              grammarIssues: analysis.grammar,
              spellingErrors: analysis.spelling,
              clarityScore: analysis.clarity,
              formalityLevel: analysis.formality,
              keywords: analysis.keywords,
              entities: analysis.entities,
              language: analysis.language,
              errorCounts: {
                grammar: analysis.grammar.length,
                spelling: analysis.spelling.length,
                clarity: analysis.clarity.length,
              },
              healthScore: analysis.healthScore,
            },
            updatedAt: new Date(),
            lastAnalyzedAt: new Date(),
          }
        }
      )

      await db.collection('analytics_logs').insertOne({
        documentId: existingDoc._id.toString(),
        action: 'version_created',
        userId: user.id,
        newVersion: (existingDoc.version || 1) + 1,
        previousVersion: existingDoc.version || 1,
        source: 'onedrive_import',
        timestamp: new Date(),
      })

      return NextResponse.json({
        success: true,
        message: 'New version created from OneDrive',
        documentId: existingDoc._id.toString(),
        version: (existingDoc.version || 1) + 1,
      }, { status: 200 })
    }

    // No existing doc — create new
    const document = {
      userId: user.id,
      plan: user.plan,
      organizationId,
      version: 1,
      originalFilename: fileName,
      originalFormat: "pdf",
      mimeType: "application/pdf",
      size: buffer.length,
      pdfSize: buffer.length,
      cloudinaryOriginalUrl: pdfUrl,
      cloudinaryPdfUrl: pdfUrl,
      extractedText: extractedText.substring(0, 10000),
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      charCount: metadata.charCount,
      summary,
      scannedPdf,
      source: "onedrive",
      oneDriveFileId: fileId,
      analytics: {
        readabilityScore: analysis.readability,
        sentimentScore: analysis.sentiment,
        grammarIssues: analysis.grammar,
        spellingErrors: analysis.spelling,
        clarityScore: analysis.clarity,
        formalityLevel: analysis.formality,
        keywords: analysis.keywords,
        entities: analysis.entities,
        language: analysis.language,
        errorCounts: {
          grammar: analysis.grammar.length,
          spelling: analysis.spelling.length,
          clarity: analysis.clarity.length,
        },
        healthScore: analysis.healthScore,
      },
      tracking: {
        views: 0,
        uniqueVisitors: [],
        downloads: 0,
        shares: 0,
        averageViewTime: 0,
        viewsByPage: Array(metadata.pageCount).fill(0),
        lastViewed: null,
      },
      isPublic: false,
      sharedWith: [],
      shareLinks: [],
      tags: [],
      folder: null,
      starred: false,
      archived: false,
      belongsToSpace: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: new Date(),
    }

    const result = await db.collection("documents").insertOne(document)
    console.log(`✅ [ONEDRIVE IMPORT] Document saved:`, result.insertedId.toString())

    return NextResponse.json({
      success: true,
      message: "File imported successfully from OneDrive",
      documentId: result.insertedId.toString(),
      version: 1,
      filename: fileName,
      numPages: metadata.pageCount,
      size: buffer.length,
    }, { status: 201 })

  } catch (error) {
    console.error("❌ [ONEDRIVE IMPORT] Error:", error)
    return NextResponse.json({
      error: "Failed to import file",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}