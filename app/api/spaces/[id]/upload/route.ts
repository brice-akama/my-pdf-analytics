//app/api/spaces/[id]/upload/route.ts
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

// ✅ Universal handler - works with both Next.js 14 and 15
export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // ✅ Handle both sync and async params
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const spaceId = params.id;

    console.log('📤 Space upload started for space:', spaceId);
    
    // ✅ Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      console.log('❌ Unauthorized upload attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User verified:', user.id);

    const db = await dbPromise;

    // ✅ First check if space exists at all
    const spaceExists = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!spaceExists) {
      console.log('❌ Space does not exist in database:', spaceId);
      return NextResponse.json({ 
        error: 'Space not found' 
      }, { status: 404 });
    }

    console.log('📋 Space found in DB:', {
      name: spaceExists.name,
      ownerId: spaceExists.ownerId,
      members: spaceExists.members || []
    });

    // ✅ Check user access - handle both ownerId and members array patterns
    let hasAccess = false;
    
    // Check if user is the owner (if ownerId exists)
    if (spaceExists.ownerId) {
      const ownerIdStr = typeof spaceExists.ownerId === 'string' 
        ? spaceExists.ownerId 
        : spaceExists.ownerId.toString();
      
      if (ownerIdStr === user.id) {
        hasAccess = true;
        console.log('✅ Access granted: User is owner via ownerId');
      }
    }
    
    // Check if user is in members array (by email or userId)
    if (!hasAccess && spaceExists.members && Array.isArray(spaceExists.members)) {
      const userMember = spaceExists.members.find((member: any) => {
        // Check by email
        if (member.email && user.email && member.email === user.email) {
          return true;
        }
        // Check by userId
        if (member.userId && member.userId === user.id) {
          return true;
        }
        return false;
      });
      
      if (userMember) {
        hasAccess = true;
        console.log('✅ Access granted: User is member with role:', userMember.role);
      }
    }

    if (!hasAccess) {
      console.log('❌ User does not have access to this space');
      console.log('   User ID:', user.id);
      console.log('   User Email:', user.email);
      console.log('   Space ownerId:', spaceExists.ownerId);
      console.log('   Space members:', JSON.stringify(spaceExists.members, null, 2));
      return NextResponse.json({ 
        error: 'Access denied to this space' 
      }, { status: 403 });
    }

    const space = spaceExists;

    console.log('✅ Space found:', space.name);

    // ✅ Get file and folder info
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('📄 Processing file:', file.name, 'Size:', file.size);

    // ✅ Validate folder if specified
    if (folderId) {
      const folder = await db.collection('space_folders').findOne({
        _id: new ObjectId(folderId),
        spaceId: spaceId
      });
      
      if (!folder) {
        console.log('❌ Folder not found:', folderId);
        return NextResponse.json({ 
          error: 'Folder not found in this space' 
        }, { status: 404 });
      }
      console.log('✅ Folder validated:', folder.name);
    }

    // ✅ Validate file type
    const fileType = SUPPORTED_FORMATS[file.type as keyof typeof SUPPORTED_FORMATS];
    if (!fileType) {
      console.log('❌ Unsupported file type:', file.type);
      return NextResponse.json({ 
        error: 'Unsupported file type',
        supported: Object.values(SUPPORTED_FORMATS)
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Check file size
    const maxSize = user.plan === 'premium' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      console.log('❌ File too large:', buffer.length);
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    console.log('⚙️ Converting to PDF...');
    
    // ✅ Convert to PDF if needed
    const pdfBuffer = fileType !== 'pdf'
      ? await convertToPdf(buffer, fileType, file.name)
      : buffer;

    console.log('📝 Extracting text and metadata...');

    // ✅ Extract text & metadata
    const extractedText = await extractTextFromPdf(pdfBuffer);
    const analysis = await analyzeDocument(extractedText, user.plan);
    const metadata = await extractMetadata(pdfBuffer, fileType);

    // ✅ Detect scanned or image-only PDFs
    const scannedPdf = !extractedText || extractedText.trim().length < 30;

    // ✅ Generate quick text summary
    function generateSummary(text: string) {
      const sentences = text.split(/[.!?]/).filter(Boolean);
      if (sentences.length <= 3) return text;
      return sentences.slice(0, 3).join(". ") + ".";
    }
    const summary = generateSummary(extractedText);

    console.log('☁️ Uploading to Cloudinary...');

    // ✅ Upload to Cloudinary in space-specific folder
    const cloudinaryFolder = `spaces/${spaceId}/documents`;
    const [originalUrl, pdfUrl] = await Promise.all([
      uploadToCloudinary(buffer, file.name, cloudinaryFolder),
      uploadToCloudinary(pdfBuffer, file.name.replace(/\.[^/.]+$/, ".pdf"), cloudinaryFolder)
    ]);

    console.log('💾 Saving to database...');

    // ✅ Create document record
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
      
      // Mark as belonging to a space
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

    console.log('✅ Document created:', documentId);

    // ✅ Create space_files link
    const spaceFileRecord = {
      spaceId: spaceId,
      folderId: folderId || null,
      documentId: documentId,
      
      // Denormalized for quick access
      filename: file.name,
      size: buffer.length,
      mimeType: file.type,
      numPages: metadata.pageCount,
      
      // Space-specific tracking
      viewsInSpace: 0,
      downloadsInSpace: 0,
      lastViewedInSpace: null,
      
      addedBy: user.id,
      addedAt: new Date(),
      order: 0,
    };

    await db.collection('space_files').insertOne(spaceFileRecord);

    console.log('✅ Space file link created');

    // ✅ Update space document count
    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      { 
        $inc: { documentsCount: 1 },
        $set: { 
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      }
    );

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