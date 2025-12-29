// app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = parseInt(searchParams.get('sortOrder') || '-1');
    const spaceId = searchParams.get('spaceId'); // ← NEW: Get spaceId parameter

    const db = await dbPromise;

    // ✅ Build query based on whether spaceId is provided
    let query: any;
    
    if (spaceId) {
      // If spaceId provided, fetch documents belonging to that space
      console.log('🔍 Fetching documents for space:', spaceId);
      query = { 
        spaceId: spaceId,
        belongsToSpace: true 
      };
    } else {
      // Otherwise, fetch user's personal documents (not in any space)
      console.log('🔍 Fetching personal documents for user:', user.id);
      query = { 
        userId: user.id,
        $or: [
          { belongsToSpace: { $exists: false } },
          { belongsToSpace: false }
        ]
      };
    }

    const documents = await db.collection('documents')
      .find(query, { projection: { fileData: 0 } })
      .sort({ [sortBy]: sortOrder } as any)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    console.log(`✅ Found ${documents.length} documents`);

    // ✅ Transform documents to include 'id' field for frontend
    const transformedDocuments = documents.map(doc => ({
      id: doc._id.toString(), // ← Frontend expects 'id'
      name: doc.originalFilename,
      type: doc.originalFormat || doc.mimeType,
      size: `${(doc.size / 1024).toFixed(2)} KB`,
      views: doc.tracking?.views || 0,
      downloads: doc.tracking?.downloads || 0,
      lastUpdated: new Date(doc.updatedAt).toLocaleDateString(),
      folderId: doc.folder || null,
      cloudinaryPdfUrl: doc.cloudinaryPdfUrl,
      // Include all original fields too
      ...doc,
      _id: doc._id.toString() // Convert ObjectId to string
    }));

    const totalDocuments = await db.collection('documents').countDocuments(query);

    console.log('📦 Sending response with', transformedDocuments.length, 'documents');

    return NextResponse.json({
      success: true,
      documents: transformedDocuments,
      totalDocuments,
      currentPage: page,
      totalPages: Math.ceil(totalDocuments / limit),
    });
  } catch (error) {
    console.error('❌ Fetch documents error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
