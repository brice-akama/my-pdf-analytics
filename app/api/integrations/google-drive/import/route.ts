// app/api/integrations/google-drive/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../../lib/mongodb";
import { 
  convertToPdf, 
  extractTextFromPdf, 
  analyzeDocument,
  extractMetadata 
} from "@/lib/document-processor";
import cloudinary from "cloudinary";
import streamifier from "streamifier";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// Helper to upload buffer to Cloudinary
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

// Helper to generate a short summary from text
function generateSummary(text: string) {
  const sentences = text.split(/[.!?]/).filter(Boolean);
  if (sentences.length <= 3) return text;
  return sentences.slice(0, 3).join(". ") + ".";
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { fileId, originalname } = await request.json();
    if (!fileId) return NextResponse.json({ error: "File ID required" }, { status: 400 });

    const db = await dbPromise;
    const integration = await db.collection("integrations").findOne({
      userId: user.id, // match your regular uploads
      provider: "google_drive",
      isActive: true,
    });
    if (!integration) return NextResponse.json({ error: "Google Drive not connected" }, { status: 404 });

    // Download file from Google Drive
    const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${integration.accessToken}` },
    });
    if (!fileResponse.ok) return NextResponse.json({ error: "Failed to download file" }, { status: 500 });

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    // Convert to PDF if needed + extract metadata
    const fileType = originalname.split(".").pop()?.toLowerCase() || "pdf";
    const [pdfBuffer, metadata] = await Promise.all([
      fileType !== "pdf" ? convertToPdf(fileBuffer, fileType, originalname) : Promise.resolve(fileBuffer),
      extractMetadata(fileBuffer, fileType)
    ]);

    // Extract text from PDF
    const extractedText = await extractTextFromPdf(pdfBuffer);
    const scannedPdf = !extractedText || extractedText.trim().length < 30;
    const summary = generateSummary(extractedText);

    // Upload original + PDF to Cloudinary
    const folder = `users/${user.id}/documents`;
    const [originalUrl, pdfUrl, analysis] = await Promise.all([
      uploadToCloudinary(fileBuffer, originalname, folder),
      uploadToCloudinary(pdfBuffer, originalname.replace(/\.[^/.]+$/, ".pdf"), folder),
      analyzeDocument(extractedText, user.plan)
    ]);

    // Save to documents collection (matches regular upload)
    const document = {
      userId: user.id,
      plan: user.plan,
      originalFilename: originalname,
      originalFormat: fileType,
      mimeType: "application/octet-stream",
      size: fileBuffer.length,
      pdfSize: pdfBuffer.length,
      cloudinaryOriginalUrl: originalUrl,
      cloudinaryPdfUrl: pdfUrl,
      extractedText: extractedText.substring(0, 10000),
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      charCount: metadata.charCount,
      summary,
      scannedPdf,
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
      source: "google_drive",
      googleDriveFileId: fileId,
      isPublic: false,
      sharedWith: [],
      shareLinks: [],
      tags: [],
      folder: null,
      starred: false,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: new Date(),
    };

    const result = await db.collection("documents").insertOne(document);

    return NextResponse.json({
      success: true,
      documentId: result.insertedId.toString(),
      filename: originalname,
      format: fileType,
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      size: fileBuffer.length,
      cloudinaryOriginalUrl: originalUrl,
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
    console.error("❌ Google Drive import error:", error);
    return NextResponse.json({
      error: "Failed to import file from Google Drive",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
