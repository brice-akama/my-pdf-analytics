// app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ GET - Fetch single document details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Verify user via HTTP-only cookie
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Validate document ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(params.id);

    // ✅ Verify ownership and fetch document
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ✅ Return full document details
    return NextResponse.json({
      success: true,
      document: {
        id: document._id.toString(),
        userId: document.userId,
        plan: document.plan,
        
        // File information
        originalFilename: document.originalFilename,
        originalFormat: document.originalFormat,
        mimeType: document.mimeType,
        size: document.size,
        pdfSize: document.pdfSize,
        numPages: document.numPages,
        wordCount: document.wordCount,
        charCount: document.charCount,
        summary: document.summary,
        scannedPdf: document.scannedPdf,
        
        // Storage URLs
        cloudinaryOriginalUrl: document.cloudinaryOriginalUrl,
        cloudinaryPdfUrl: document.cloudinaryPdfUrl,
        
        // Content
        extractedText: document.extractedText,
        notes: document.notes || '',
        
        // Analytics summary
        analytics: {
          healthScore: document.analytics?.healthScore || 0,
          readabilityScore: document.analytics?.readabilityScore || 0,
          sentimentScore: document.analytics?.sentimentScore || 0,
          errorCounts: document.analytics?.errorCounts || {},
          topKeywords: document.analytics?.keywords?.slice(0, 10) || [],
          language: document.analytics?.language || 'en',
          formalityLevel: document.analytics?.formalityLevel || 'neutral',
        },
        
        // Tracking summary
        tracking: {
          views: document.tracking?.views || 0,
          uniqueVisitors: document.tracking?.uniqueVisitors?.length || 0,
          downloads: document.tracking?.downloads || 0,
          shares: document.tracking?.shares || 0,
          lastViewed: document.tracking?.lastViewed || null,
        },
        
        // Organization
        tags: document.tags || [],
        folder: document.folder || null,
        starred: document.starred || false,
        archived: document.archived || false,
        
        // Sharing
        isPublic: document.isPublic || false,
        sharedWith: document.sharedWith || [],
        shareLinks: document.shareLinks || [],
        
        // Timestamps
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        lastAnalyzedAt: document.lastAnalyzedAt,
        lastAccessedAt: document.lastAccessedAt,
      }
    });

  } catch (error) {
    console.error('❌ Fetch document error:', error);
    return NextResponse.json({
      error: 'Failed to fetch document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ PATCH - Update document metadata (notes, tags, folder, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Verify user via HTTP-only cookie
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Validate document ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      notes,
      tags,
      folder,
      starred,
      archived,
      isPublic,
      sharedWith,
      originalFilename, // Allow renaming
    } = body;

    const db = await dbPromise;
    const documentId = new ObjectId(params.id);

    // ✅ Verify ownership
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ✅ Build update object (only update provided fields)
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (notes !== undefined) updateFields.notes = notes;
    if (tags !== undefined) updateFields.tags = tags;
    if (folder !== undefined) updateFields.folder = folder;
    if (starred !== undefined) updateFields.starred = starred;
    if (archived !== undefined) updateFields.archived = archived;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;
    if (sharedWith !== undefined) updateFields.sharedWith = sharedWith;
    if (originalFilename !== undefined) updateFields.originalFilename = originalFilename;

    // ✅ Validate plan limits for public sharing
    if (isPublic === true && user.plan === 'free') {
      return NextResponse.json({ 
        error: 'Public sharing requires a premium plan',
        upgrade: true
      }, { status: 403 });
    }

    // ✅ Update document
    const result = await db.collection('documents').updateOne(
      { _id: documentId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ✅ Log the update action
    await db.collection('analytics_logs').insertOne({
      documentId: params.id,
      action: 'document_updated',
      userId: user.id,
      updatedFields: Object.keys(updateFields),
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }).catch(err => console.error('Failed to log update:', err));

    // ✅ Fetch and return updated document
    const updatedDocument = await db.collection('documents').findOne({ _id: documentId });

    return NextResponse.json({
      success: true,
      message: 'Document updated successfully',
      document: {
        id: updatedDocument?._id.toString(),
        notes: updatedDocument?.notes,
        tags: updatedDocument?.tags,
        folder: updatedDocument?.folder,
        starred: updatedDocument?.starred,
        archived: updatedDocument?.archived,
        isPublic: updatedDocument?.isPublic,
        sharedWith: updatedDocument?.sharedWith,
        originalFilename: updatedDocument?.originalFilename,
        updatedAt: updatedDocument?.updatedAt,
      }
    });

  } catch (error) {
    console.error('❌ Update document error:', error);
    return NextResponse.json({
      error: 'Failed to update document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ DELETE - Delete document and cleanup
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Verify user via HTTP-only cookie
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Validate document ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(params.id);

    // ✅ Verify ownership and get document
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ✅ Delete from Cloudinary (optional - can be done async)
    // Note: You may want to keep files for backup/recovery
    // If you want to delete immediately from Cloudinary:
    /*
    try {
      if (document.cloudinaryOriginalUrl) {
        const publicId = extractPublicIdFromUrl(document.cloudinaryOriginalUrl);
        await cloudinary.v2.uploader.destroy(publicId);
      }
      if (document.cloudinaryPdfUrl) {
        const publicId = extractPublicIdFromUrl(document.cloudinaryPdfUrl);
        await cloudinary.v2.uploader.destroy(publicId);
      }
    } catch (cloudinaryError) {
      console.error('Failed to delete from Cloudinary:', cloudinaryError);
    }
    */

    // ✅ Delete document from MongoDB
    await db.collection('documents').deleteOne({ _id: documentId });

    // ✅ Delete related analytics logs (optional - for GDPR compliance)
    await db.collection('analytics_logs')
      .deleteMany({ documentId: params.id })
      .catch(err => console.error('Failed to delete analytics logs:', err));

    // ✅ Delete related document views
    await db.collection('document_views')
      .deleteMany({ documentId })
      .catch(err => console.error('Failed to delete document views:', err));

    // ✅ Delete related shares
    await db.collection('shares')
      .deleteMany({ documentId })
      .catch(err => console.error('Failed to delete shares:', err));

    // ✅ Log deletion action
    await db.collection('analytics_logs').insertOne({
      documentId: params.id,
      action: 'document_deleted',
      userId: user.id,
      documentInfo: {
        filename: document.originalFilename,
        format: document.originalFormat,
        size: document.size,
      },
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }).catch(err => console.error('Failed to log deletion:', err));

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      deletedDocument: {
        id: document._id.toString(),
        filename: document.originalFilename,
      }
    });

  } catch (error) {
    console.error('❌ Delete document error:', error);
    return NextResponse.json({
      error: 'Failed to delete document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ Helper function to extract Cloudinary public ID from URL
function extractPublicIdFromUrl(url: string): string {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
}