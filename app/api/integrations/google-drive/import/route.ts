 

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
    
    // ✅ GET ORGANIZATION ID (CRITICAL - same as your upload.ts)
    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || user.id;
    console.log('🏢 [IMPORT] Organization ID:', organizationId);

    // ✅ GET GOOGLE DRIVE INTEGRATION
    // The integration was saved with email, so search by email
    const integration = await db.collection("integrations").findOne({
      userId: user.id, // user.id IS the email in your system
      provider: "google_drive",
      isActive: true,
    });

    if (!integration) {
      console.log('❌ [IMPORT] Google Drive not connected');
      console.log('🔍 [IMPORT] Searched for userId:', user.id);
      
      // DEBUG: Show what's in database
      const allIntegrations = await db.collection("integrations").find({ 
        provider: "google_drive" 
      }).toArray();
     
      
      return NextResponse.json({ error: "Google Drive not connected" }, { status: 404 });
    }

    console.log('✅ [IMPORT] Integration found');

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

    // ✅ PROCESS PDF
    console.log('⚙️ [IMPORT] Processing PDF...');
    const metadata = await extractMetadata(buffer, "pdf");
    const extractedText = await extractTextFromPdf(buffer);
    const analysis = await analyzeDocument(extractedText, user.plan || "free");
    const scannedPdf = !extractedText || extractedText.trim().length < 30;
    console.log('✅ [IMPORT] PDF processed:', { pages: metadata.pageCount, words: metadata.wordCount });

    // ✅ UPLOAD TO CLOUDINARY
    console.log('☁️ [IMPORT] Uploading to Cloudinary...');
    const folder = `users/${user.id}/documents`;
    const pdfUrl = await uploadToCloudinary(buffer, fileName, folder);
    console.log(`✅ [IMPORT] Uploaded to Cloudinary:`, pdfUrl);

    // ✅ SAVE TO DATABASE - MATCH YOUR UPLOAD.TS EXACTLY
    console.log('💾 [IMPORT] Saving to database...');
    const document = {
      userId: user.id, // ✅ user.id (which is email)
      plan: user.plan,
      organizationId, // ✅ CRITICAL - this was missing in first code!
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
      googleDriveFileId: fileId,
      isPublic: false,
      sharedWith: [],
      shareLinks: [],
      tags: [],
      folder: null,
      starred: false,
      archived: false,
      belongsToSpace: false, // ✅ Add this so it shows in personal documents
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: new Date(),
    };

    const result = await db.collection("documents").insertOne(document);
    console.log(`✅ [IMPORT] Document saved with ID:`, result.insertedId.toString());

    return NextResponse.json({
      success: true,
      documentId: result.insertedId.toString(),
      message: "File imported successfully"
    });

  } catch (error) {
    console.error("❌ [IMPORT] Error:", error);
    return NextResponse.json({ 
      error: "Failed to import file",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}