// app/api/integrations/google-drive/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../../lib/mongodb";
import { extractTextFromPdf, extractMetadata, analyzeDocument } from "@/lib/document-processor";
import cloudinary from "cloudinary";
import streamifier from "streamifier";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

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
        if (error) return reject(error);
        resolve(result?.secure_url || '');
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

function generateSummary(text: string) {
  const sentences = text.split(/[.!?]/).filter(Boolean);
  if (sentences.length <= 3) return text;
  return sentences.slice(0, 3).join(". ") + ".";
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 [IMPORT] Starting Google Drive import...');
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      console.log('❌ [IMPORT] Unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ [IMPORT] User verified:', user.id);

    const { fileId, fileName } = await request.json();
    console.log('📄 [IMPORT] File details:', { fileId, fileName });

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    const db = await dbPromise;
    
    // ✅ GET ORGANIZATION ID (same as upload.ts)
    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || user.id;
    console.log('🏢 [IMPORT] Organization ID:', organizationId);

    // ✅ GET GOOGLE DRIVE INTEGRATION
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "google_drive",
      isActive: true,
    });

    if (!integration) {
      console.log('❌ [IMPORT] Google Drive not connected');
      return NextResponse.json({ error: "Google Drive not connected" }, { status: 404 });
    }

    console.log('✅ [IMPORT] Integration found');

    // ✅ CHECK IF TOKEN EXPIRED & REFRESH IF NEEDED
    const now = new Date();
    if (integration.expiresAt && new Date(integration.expiresAt) < now) {
      console.log("🔄 [IMPORT] Token expired, refreshing...");

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
        console.error("❌ [IMPORT] Token refresh failed:", refreshData);
        return NextResponse.json(
          { error: "Session expired. Please reconnect Google Drive." },
          { status: 401 }
        );
      }

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

      integration.accessToken = refreshData.access_token;
      console.log("✅ [IMPORT] Token refreshed successfully");
    }

    // ✅ DOWNLOAD FILE FROM GOOGLE DRIVE
    console.log('📥 [IMPORT] Downloading from Google Drive...');
    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    );

    if (!fileResponse.ok) {
      console.log('❌ [IMPORT] Download failed:', fileResponse.status);
      const errorText = await fileResponse.text();
      console.log('❌ [IMPORT] Error:', errorText);
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
    }

    const buffer = Buffer.from(await fileResponse.arrayBuffer());
    console.log(`✅ [IMPORT] Downloaded ${buffer.length} bytes`);

    // ✅ PROCESS PDF (PARALLEL - same as upload.ts)
    console.log('⚙️ [IMPORT] Processing PDF...');
    const [metadata, extractedText] = await Promise.all([
      extractMetadata(buffer, "pdf"),
      extractTextFromPdf(buffer)
    ]);

    const scannedPdf = !extractedText || extractedText.trim().length < 30;
    const summary = generateSummary(extractedText);
    console.log('✅ [IMPORT] PDF processed:', { pages: metadata.pageCount, words: metadata.wordCount });

    // ✅ ANALYSIS + CLOUDINARY UPLOAD (PARALLEL - same as upload.ts)
    console.log('☁️ [IMPORT] Uploading to Cloudinary & analyzing...');
    const folder = `users/${user.id}/documents`;
    const [analysis, pdfUrl] = await Promise.all([
      analyzeDocument(extractedText, user.plan || "free"),
      uploadToCloudinary(buffer, fileName, folder)
    ]);
    console.log(`✅ [IMPORT] Uploaded to Cloudinary:`, pdfUrl);

    // 🆕 ✅ CHECK FOR EXISTING DOCUMENT WITH SAME FILENAME (VERSION LOGIC!)
    const existingDoc = await db.collection('documents').findOne({
      originalFilename: fileName,
      userId: user.id,
      organizationId,
      archived: { $ne: true }
    });

    if (existingDoc) {
      console.log('📦 [IMPORT] Existing document found - creating new version');

      // ✅ Save current version to history
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
        changeLog: `Version ${existingDoc.version || 1} - Replaced by Google Drive import`,
        source: existingDoc.source || 'upload'
      };

      await db.collection('documentVersions').insertOne(versionSnapshot);
      console.log(`✅ [IMPORT] Version ${existingDoc.version || 1} saved to history`);

      // ✅ Update existing document with new version
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
            source: "google_drive", // ✅ Track that this version came from Drive
            googleDriveFileId: fileId,
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
      );

      console.log(`✅ [IMPORT] Document updated to version ${(existingDoc.version || 1) + 1}`);

      // ✅ Log version creation
      await db.collection('analytics_logs').insertOne({
        documentId: existingDoc._id.toString(),
        action: 'version_created',
        userId: user.id,
        newVersion: (existingDoc.version || 1) + 1,
        previousVersion: existingDoc.version || 1,
        source: 'google_drive_import',
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'New version created from Google Drive',
        documentId: existingDoc._id.toString(),
        version: (existingDoc.version || 1) + 1,
        previousVersion: existingDoc.version || 1,
        filename: fileName,
        format: "pdf",
        numPages: metadata.pageCount,
        wordCount: metadata.wordCount,
        size: buffer.length,
        cloudinaryPdfUrl: pdfUrl,
        analytics: {
          healthScore: analysis.healthScore,
          readabilityScore: analysis.readability,
          errorCounts: {
            grammar: analysis.grammar.length,
            spelling: analysis.spelling.length,
            clarity: analysis.clarity.length,
          },
          topKeywords: analysis.keywords.slice(0, 5),
        },
        hasIssues: analysis.grammar.length > 0 || analysis.spelling.length > 0,
        issuesSummary: `Found ${analysis.grammar.length} grammar issues, ${analysis.spelling.length} spelling errors`,
      }, { status: 200 });
    }

    // ✅ NO EXISTING DOCUMENT - CREATE NEW ONE
    console.log('💾 [IMPORT] Creating new document (no existing version found)');
    const document = {
      userId: user.id,
      plan: user.plan,
      organizationId,
      version: 1, // ✅ START AT VERSION 1
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
      source: "google_drive",
      googleDriveFileId: fileId,
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
    };

    const result = await db.collection("documents").insertOne(document);
    console.log(`✅ [IMPORT] Document saved with ID:`, result.insertedId.toString());

    return NextResponse.json({
      success: true,
      message: "File imported successfully from Google Drive",
      documentId: result.insertedId.toString(),
      version: 1,
      filename: fileName,
      format: "pdf",
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      size: buffer.length,
      cloudinaryPdfUrl: pdfUrl,
      analytics: {
        healthScore: analysis.healthScore,
        readabilityScore: analysis.readability,
        errorCounts: {
          grammar: analysis.grammar.length,
          spelling: analysis.spelling.length,
          clarity: analysis.clarity.length,
        },
        topKeywords: analysis.keywords.slice(0, 5),
      },
      hasIssues: analysis.grammar.length > 0 || analysis.spelling.length > 0,
      issuesSummary: `Found ${analysis.grammar.length} grammar issues, ${analysis.spelling.length} spelling errors`,
    }, { status: 201 });

  } catch (error) {
    console.error("❌ [IMPORT] Error:", error);
    return NextResponse.json({ 
      error: "Failed to import file",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}