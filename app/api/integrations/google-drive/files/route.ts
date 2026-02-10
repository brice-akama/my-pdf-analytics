// app/api/integrations/google-drive/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/auth";
import { dbPromise } from "../../../lib/mongodb";
import { extractTextFromPdf, extractMetadata, analyzeDocument } from "@/lib/document-processor";
import cloudinary from "cloudinary";
import streamifier from "streamifier";

// Configure Cloudinary (for preview generation if needed)
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

export async function GET(request: NextRequest) {
  try {
    // ✅ Authenticate user
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await dbPromise;

    // ✅ Get Google Drive integration for this user
    const integration = await db.collection("integrations").findOne({
      userId: user.id,
      provider: "google_drive",
      isActive: true,
    });
    if (!integration) return NextResponse.json({ error: "Google Drive not connected" }, { status: 404 });

    // ✅ Fetch Google Drive files (PDFs)
    const driveResponse = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=mimeType='application/pdf'&pageSize=50&fields=files(id,name,mimeType,createdTime,size,webViewLink)",
      { headers: { Authorization: `Bearer ${integration.accessToken}` } }
    );
    if (!driveResponse.ok) return NextResponse.json({ error: "Failed to fetch Google Drive files" }, { status: 500 });

    const data = await driveResponse.json();
    const files = data.files || [];

    // ✅ Map Google Drive files to match your regular document structure
    const mappedFiles = await Promise.all(files.map(async (file: any) => {
      // Optional: download small file to generate PDF preview or extract metadata (skip for large files)
      const fileBufferResp = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: { Authorization: `Bearer ${integration.accessToken}` },
      });
      const buffer = Buffer.from(await fileBufferResp.arrayBuffer());

      const metadata = await extractMetadata(buffer, "pdf");
      const extractedText = await extractTextFromPdf(buffer);
      const analysis = await analyzeDocument(extractedText, user.plan || "free");
      const scannedPdf = !extractedText || extractedText.trim().length < 30;

      // Upload preview PDF to Cloudinary
      const folder = `users/${user.id}/documents`;
      const pdfUrl = await uploadToCloudinary(buffer, file.name.replace(/\.[^/.]+$/, ".pdf"), folder);

      return {
        userId: user.id,
        plan: user.plan,
        originalFilename: file.name,
        originalFormat: "pdf",
        mimeType: file.mimeType,
        size: Number(file.size || buffer.length),
        pdfSize: buffer.length,
        cloudinaryOriginalUrl: pdfUrl, // treat as original for Drive import
        cloudinaryPdfUrl: pdfUrl,
        extractedText: extractedText.substring(0, 10000),
        numPages: metadata.pageCount,
        wordCount: metadata.wordCount,
        charCount: metadata.charCount,
        summary: extractedText.substring(0, 200),
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
        googleDriveFileId: file.id,
        isPublic: false,
        sharedWith: [],
        shareLinks: [],
        tags: [],
        folder: null,
        starred: false,
        archived: false,
        createdAt: new Date(file.createdTime),
        updatedAt: new Date(file.createdTime),
        lastAnalyzedAt: new Date(),
        webViewLink: file.webViewLink,
      };
    }));

    return NextResponse.json({ success: true, files: mappedFiles });
  } catch (error) {
    console.error("❌ Google Drive GET error:", error);
    return NextResponse.json({ error: "Failed to fetch Google Drive files", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
