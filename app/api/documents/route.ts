// app/api/documents/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const documentsCollection = db.collection('documents');

    // 🔢 Pagination (optional but recommended for scalability)
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10'))); // max 100 per page
    const skip = (page - 1) * limit;

    // 📦 Project only necessary fields (improve perf + security)
    const projection = {
      _id: 1,
      filename: 1,
      numPages: 1,
      size: 1,
      createdAt: 1,
      plan: 1,
      mimeType: 1, // optional: remove if frontend doesn't need it
    };

    // 📂 Fetch user's documents
    const documents = await documentsCollection
      .find({ userId: user.id })
      .project(projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // 🔢 Get total count (for frontend pagination UI)
    const total = await documentsCollection.countDocuments({ userId: user.id });

    return NextResponse.json({
      success: true,
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Fetch documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}