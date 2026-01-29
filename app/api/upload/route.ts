// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { 
  convertToPdf, 
  extractTextFromPdf, 
  analyzeDocument,
  extractMetadata 
} from '@/lib/document-processor';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
export const maxDuration = 60;
const SUPPORTED_FORMATS = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/markdown': 'md',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};
// Configure Cloudinary
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
        type: 'upload', // ADD THIS - ensures it's public
        access_mode: 'public' // ADD THIS - makes URL publicly accessible
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
    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;
    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || user.id;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const fileType = SUPPORTED_FORMATS[file.type as keyof typeof SUPPORTED_FORMATS];
    if (!fileType) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const maxSize = user.plan === 'premium' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return NextResponse.json({ error: `File too large` }, { status: 400 });
    }

    // ✅ STEP 1: Convert to PDF + Extract Metadata (PARALLEL)
    const [pdfBuffer, metadata] = await Promise.all([
      fileType !== 'pdf' ? convertToPdf(buffer, fileType, file.name) : Promise.resolve(buffer),
      extractMetadata(buffer, fileType)
    ]);

    // ✅ STEP 2: Extract Text
    const extractedText = await extractTextFromPdf(pdfBuffer);
    const scannedPdf = !extractedText || extractedText.trim().length < 30;
    const summary = generateSummary(extractedText);

    // ✅ STEP 3: Analysis + Cloudinary Upload (PARALLEL)
    const folder = `users/${user.id}/documents`;
    const [analysis, originalUrl, pdfUrl] = await Promise.all([
      analyzeDocument(extractedText, user.plan),
      uploadToCloudinary(buffer, file.name, folder),
      uploadToCloudinary(pdfBuffer, file.name.replace(/\.[^/.]+$/, ".pdf"), folder)
    ]);

    // ✅ STEP 4: Single DB Write
    const doc = {
      userId: user.id,
      plan: user.plan,
      organizationId,
      originalFilename: file.name,
      originalFormat: fileType,
      mimeType: file.type,
      size: buffer.length,
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

    const result = await db.collection('documents').insertOne(doc);

    return NextResponse.json({
      success: true,
      documentId: result.insertedId.toString(),
      filename: file.name,
      format: fileType,
      numPages: metadata.pageCount,
      wordCount: metadata.wordCount,
      size: buffer.length,
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
    console.error('❌ Document upload error:', error);
    return NextResponse.json({
      error: 'Failed to process document. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateSummary(text: string) {
  const sentences = text.split(/[.!?]/).filter(Boolean);
  if (sentences.length <= 3) return text;
  return sentences.slice(0, 3).join(". ") + ".";
}