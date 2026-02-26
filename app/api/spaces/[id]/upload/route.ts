// app/api/spaces/[id]/upload/route.ts
// ONLY CHANGE: added audit log write at the bottom before the return statement
// Everything else is identical to your original

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import { 
  convertToPdf, 
  extractTextFromPdf, 
  analyzeDocument,
  extractMetadata 
} from '@/lib/document-processor';

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

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const spaceId = params.id;

    console.log('📤 Space upload started for space:', spaceId);
    
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    const spaceExists = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!spaceExists) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    let hasAccess = false;
    let userRole = 'viewer';

    if (spaceExists.userId === user.id) {
      hasAccess = true;
      userRole = 'owner';
    } else if (spaceExists.members && Array.isArray(spaceExists.members)) {
      const userMember = spaceExists.members.find((member: any) => 
        member.email === user.email || member.userId === user.id
      );

      if (userMember) {
        userRole = userMember.role || 'viewer';
        if (['editor', 'admin', 'owner'].includes(userRole)) {
          hasAccess = true;
        } else {
          return NextResponse.json(
            { error: 'You do not have permission to upload files. Editor role required.' },
            { status: 403 }
          );
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this space' }, { status: 403 });
    }

    const space = spaceExists;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (folderId) {
      const folder = await db.collection('space_folders').findOne({
        _id: new ObjectId(folderId),
        spaceId: spaceId
      });
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found in this space' }, { status: 404 });
      }
    }

    const fileType = SUPPORTED_FORMATS[file.type as keyof typeof SUPPORTED_FORMATS];
    if (!fileType) {
      return NextResponse.json({ 
        error: 'Unsupported file type',
        supported: Object.values(SUPPORTED_FORMATS)
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const maxSize = user.plan === 'premium' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    const pdfBuffer = fileType !== 'pdf'
      ? await convertToPdf(buffer, fileType, file.name)
      : buffer;

    const extractedText = await extractTextFromPdf(pdfBuffer);
    const analysis = await analyzeDocument(extractedText, user.plan);
    const metadata = await extractMetadata(pdfBuffer, fileType);

    const scannedPdf = !extractedText || extractedText.trim().length < 30;

    function generateSummary(text: string) {
      const sentences = text.split(/[.!?]/).filter(Boolean);
      if (sentences.length <= 3) return text;
      return sentences.slice(0, 3).join(". ") + ".";
    }
    const summary = generateSummary(extractedText);

    const cloudinaryFolder = `spaces/${spaceId}/documents`;
    const [originalUrl, pdfUrl] = await Promise.all([
      uploadToCloudinary(buffer, file.name, cloudinaryFolder),
      uploadToCloudinary(pdfBuffer, file.name.replace(/\.[^/.]+$/, ".pdf"), cloudinaryFolder)
    ]);

    const documentRecord = {
      userId: user.id,
      plan: user.plan,
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
      belongsToSpace: true,
      spaceId: spaceId,
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
      folder: folderId || null,
      starred: false,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAnalyzedAt: new Date(),
    };

    const docResult = await db.collection('documents').insertOne(documentRecord);
    const documentId = docResult.insertedId.toString();

    const spaceFileRecord = {
      spaceId: spaceId,
      folderId: folderId || null,
      documentId: documentId,
      filename: file.name,
      size: buffer.length,
      mimeType: file.type,
      numPages: metadata.pageCount,
      viewsInSpace: 0,
      downloadsInSpace: 0,
      lastViewedInSpace: null,
      addedBy: user.id,
      addedAt: new Date(),
      order: 0,
    };

    await db.collection('space_files').insertOne(spaceFileRecord);

    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      { 
        $inc: { documentsCount: 1 },
        $set: { lastActivity: new Date(), updatedAt: new Date() }
      }
    );

    // ✅ AUDIT LOG — write document upload event
    await db.collection('activityLogs').insertOne({
      spaceId: new ObjectId(spaceId),
      shareLink: null,
      visitorEmail: null,
      performedBy: user.email || user.id,
      performedByRole: userRole,
      event: 'document_uploaded',
      documentId: docResult.insertedId,
      documentName: file.name,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      meta: {
        folderId: folderId || null,
        fileSize: buffer.length,
        fileType,
        numPages: metadata.pageCount,
      }
    });

    console.log(`✅ File uploaded to space ${spaceId}: ${file.name}`);

    return NextResponse.json({
      success: true,
      documentId,
      filename: file.name,
      spaceId,
      folderId,
      numPages: metadata.pageCount,
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
      message: `${file.name} added to space successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Space upload error:', error);
    return NextResponse.json({
      error: 'Failed to upload file to space',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}