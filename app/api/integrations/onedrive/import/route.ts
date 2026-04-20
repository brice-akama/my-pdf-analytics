// app/api/integrations/onedrive/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/app/api/lib/mongodb";
import { extractTextFromPdf, extractMetadata, analyzeDocument } from "@/lib/document-processor";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import { checkAccess } from "@/lib/checkAccess";
import {
  isFileSizeAllowed,
  isStorageAvailable,
  hasFeature,
} from "@/lib/planLimits";

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
        type: "upload",
        access_mode: "public",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || "");
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
    console.log("📥 [ONEDRIVE IMPORT] Starting...");

    // ── Step 1: Authenticate and get effective plan ────────────────────────
    // checkAccess reads the JWT cookie, fetches the user from MongoDB, and
    // computes the EFFECTIVE plan — if their trial expired they get free limits
    // even if user.plan still says "pro" in the DB.
    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const { user, plan, limits } = access;
    console.log("✅ [ONEDRIVE IMPORT] User verified:", user._id.toString(), "| Plan:", plan);

    // ── Step 2: Check OneDrive feature flag ───────────────────────────────
    // OneDrive integration is a Pro+ feature. Free and Starter users
    // cannot use this endpoint regardless of anything else.
    if (!hasFeature(plan, "oneDriveIntegration")) {
      console.log("❌ [ONEDRIVE IMPORT] Plan does not include OneDrive integration:", plan);
      return NextResponse.json(
        {
          error: `OneDrive integration is not available on the ${plan} plan. Upgrade to Pro or higher to connect OneDrive.`,
          code: "FEATURE_NOT_AVAILABLE",
          feature: "oneDriveIntegration",
          plan,
        },
        { status: 403 }
      );
    }

    // ── Step 3: Parse request body ─────────────────────────────────────────
    const { fileId, fileName } = await request.json();

    if (!fileId || !fileName) {
      return NextResponse.json(
        { error: "fileId and fileName required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;

    // ── Step 4: Resolve organizationId (matches upload.ts pattern) ─────────
    const profile = await db
      .collection("profiles")
      .findOne({ user_id: user._id.toString() });
    const organizationId = profile?.organization_id || null;

    // ── Step 5: Get OneDrive integration + refresh token if expired ────────
    const integration = await db.collection("integrations").findOne({
      userId: user._id.toString(),
      provider: "onedrive",
      isActive: true,
    });

    if (!integration) {
      return NextResponse.json(
        { error: "OneDrive not connected" },
        { status: 404 }
      );
    }

    const now = new Date();
    if (integration.expiresAt && new Date(integration.expiresAt) < now) {
      console.log("🔄 [ONEDRIVE IMPORT] Token expired, refreshing...");

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
      );

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        console.error("❌ [ONEDRIVE IMPORT] Token refresh failed:", refreshData);
        return NextResponse.json(
          { error: "Session expired. Please reconnect OneDrive." },
          { status: 401 }
        );
      }

      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);

      await db.collection("integrations").updateOne(
        { userId: user._id.toString(), provider: "onedrive" },
        {
          $set: {
            accessToken: refreshData.access_token,
            expiresAt: newExpiresAt,
            updatedAt: new Date(),
          },
        }
      );

      integration.accessToken = refreshData.access_token;
      console.log("✅ [ONEDRIVE IMPORT] Token refreshed");
    }

    // ── Step 6: Download file from OneDrive ────────────────────────────────
    console.log("📥 [ONEDRIVE IMPORT] Downloading file...");
    const downloadRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
      { headers: { Authorization: `Bearer ${integration.accessToken}` } }
    );

    if (!downloadRes.ok) {
      const errText = await downloadRes.text();
      console.error("❌ [ONEDRIVE IMPORT] Download failed:", errText);
      return NextResponse.json(
        { error: "Failed to download file from OneDrive" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await downloadRes.arrayBuffer());
    console.log(`✅ [ONEDRIVE IMPORT] Downloaded ${buffer.length} bytes`);

    // ── Step 7: Enforce per-file size limit ────────────────────────────────
    // Each plan has a different ceiling. Free = 10MB, Starter = 100MB, etc.
    // We check this after downloading because we need the actual byte size.
    if (!isFileSizeAllowed(plan, buffer.length)) {
      const limitMB = Math.round(limits.maxFileSizeBytes / (1024 * 1024));
      console.log("❌ [ONEDRIVE IMPORT] File too large:", buffer.length, "limit:", limits.maxFileSizeBytes);
      return NextResponse.json(
        {
          error: `File too large for your ${plan} plan. Maximum file size is ${limitMB}MB. Upgrade your plan to upload larger files.`,
          code: "FILE_TOO_LARGE",
          limitBytes: limits.maxFileSizeBytes,
          plan,
        },
        { status: 413 }
      );
    }

    // ── Step 8: Enforce total storage limit ───────────────────────────────
    // totalStorageUsedBytes is a running total kept accurate by $inc on every
    // upload/import/delete. We check if adding this file would exceed the
    // plan ceiling BEFORE doing any processing or Cloudinary upload.
    //
    // For VERSION UPDATES we compare against the storage delta (new - old),
    // not the full new file size, because the old file is being replaced.
    // We need the existing doc size now to compute that delta below.
    const existingDocForStorageCheck = await db.collection("documents").findOne(
      {
        originalFilename: fileName,
        userId: user._id.toString(),
        organizationId,
        archived: { $ne: true },
      },
      { projection: { size: 1, version: 1 } } // only fetch what we need
    );

    const oldSize: number = existingDocForStorageCheck?.size ?? 0;
    // If this is a version update, we only consume (newSize - oldSize) net bytes.
    // If oldSize >= buffer.length the replacement frees space, so storageDelta <= 0.
    const storageDelta = buffer.length - oldSize;
    const storageUsedBytes: number = user.totalStorageUsedBytes ?? 0;

    // Only block if we would actually consume MORE storage (delta > 0).
    // Replacing a larger file with a smaller one always passes this check.
    if (storageDelta > 0 && !isStorageAvailable(plan, storageUsedBytes, storageDelta)) {
      const usedMB = Math.round(storageUsedBytes / (1024 * 1024));
      const limitMB = Math.round(limits.storageLimitBytes / (1024 * 1024));
      console.log("❌ [ONEDRIVE IMPORT] Storage limit reached:", storageUsedBytes, "/", limits.storageLimitBytes);
      return NextResponse.json(
        {
          error: `Storage full. You are using ${usedMB}MB of your ${limitMB}MB limit. Delete some files or upgrade your plan.`,
          code: "STORAGE_LIMIT_REACHED",
          usedBytes: storageUsedBytes,
          limitBytes: limits.storageLimitBytes,
          plan,
        },
        { status: 403 }
      );
    }

    // ── Step 9: Process PDF (metadata + text extraction in parallel) ───────
    console.log("⚙️ [ONEDRIVE IMPORT] Processing PDF...");
    const [metadata, extractedText] = await Promise.all([
      extractMetadata(buffer, "pdf"),
      extractTextFromPdf(buffer),
    ]);

    const scannedPdf = !extractedText || extractedText.trim().length < 30;
    const summary = generateSummary(extractedText);
    console.log("✅ [ONEDRIVE IMPORT] PDF processed:", { pages: metadata.pageCount, words: metadata.wordCount });

    // ── Step 10: Upload to Cloudinary + analyze in parallel ────────────────
    console.log("☁️ [ONEDRIVE IMPORT] Uploading to Cloudinary & analyzing...");
    const folder = `users/${user._id.toString()}/documents`;

    const [analysis, pdfUrl] = await Promise.all([
      analyzeDocument(extractedText, plan),
      uploadToCloudinary(buffer, fileName, folder),
    ]);

    console.log("✅ [ONEDRIVE IMPORT] Cloudinary upload complete:", pdfUrl);

    // ── Step 11: VERSION UPDATE — existing doc with same filename ──────────
    if (existingDocForStorageCheck) {
      console.log("📦 [ONEDRIVE IMPORT] Existing document found — creating new version");

      // Fetch the full existing doc now (we only had a projection above)
      const existingDoc = await db.collection("documents").findOne({
        _id: existingDocForStorageCheck._id,
      });

      if (!existingDoc) {
        // Race condition: doc was deleted between our two reads — fall through
        // to the new-document insert path below.
        console.log("⚠️ [ONEDRIVE IMPORT] Existing doc vanished between reads — inserting as new");
      } else {
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
          changeLog: `Version ${existingDoc.version || 1} — Replaced by OneDrive import`,
          source: existingDoc.source || "upload",
        };

        const newVersion = (existingDoc.version || 1) + 1;

        await Promise.all([
          db.collection("documentVersions").insertOne(versionSnapshot),

          db.collection("documents").updateOne(
            { _id: existingDoc._id },
            {
              $set: {
                version: newVersion,
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
              },
            }
          ),

          db.collection("analytics_logs").insertOne({
            documentId: existingDoc._id.toString(),
            action: "version_created",
            userId: user._id.toString(),
            newVersion,
            previousVersion: existingDoc.version || 1,
            source: "onedrive_import",
            timestamp: new Date(),
          }),
        ]);

        // ── Storage delta update ───────────────────────────────────────────
        // storageDelta = newSize - oldSize.
        // Positive → user consumed more space (increment).
        // Negative → user freed space (increment with a negative = decrement).
        // Zero     → identical size, skip the write entirely.
        // $inc is atomic so concurrent requests never race-overwrite each other.
        if (storageDelta !== 0) {
          await db.collection("users").updateOne(
            { _id: user._id },
            { $inc: { totalStorageUsedBytes: storageDelta } }
          );
          console.log(
            `✅ [ONEDRIVE IMPORT] Storage updated by delta: ${storageDelta > 0 ? "+" : ""}${storageDelta} bytes`
          );
        }

        console.log(`✅ [ONEDRIVE IMPORT] Document updated to version ${newVersion}`);

        return NextResponse.json(
          {
            success: true,
            message: "New version created from OneDrive",
            documentId: existingDoc._id.toString(),
            version: newVersion,
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
          },
          { status: 200 }
        );
      }
    }

    // ── Step 12: NEW DOCUMENT — no existing doc with this filename ─────────
    console.log("💾 [ONEDRIVE IMPORT] No existing document found — inserting new");

    const document = {
      userId: user._id.toString(),
      plan,
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
    };

    const result = await db.collection("documents").insertOne(document);
    console.log("✅ [ONEDRIVE IMPORT] Document inserted:", result.insertedId.toString());

    // ── Storage increment ──────────────────────────────────────────────────
    // New document — always increment by the full file size.
    // $inc is atomic so concurrent imports cannot corrupt the running total.
    await db.collection("users").updateOne(
      { _id: user._id },
      { $inc: { totalStorageUsedBytes: buffer.length } }
    );
    console.log(`✅ [ONEDRIVE IMPORT] Storage incremented by ${buffer.length} bytes`);

    return NextResponse.json(
      {
        success: true,
        message: "File imported successfully from OneDrive",
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ [ONEDRIVE IMPORT] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to import file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}