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

    const db = await dbPromise;

    const documents = await db.collection('documents')
      .find(
        { userId: user.id },
        { projection: { fileData: 0 } }
      )
      .sort({ [sortBy]: sortOrder } as any)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const totalDocuments = await db.collection('documents').countDocuments({ userId: user.id });

    return NextResponse.json({
      success: true,
      documents,
      totalDocuments,
      currentPage: page,
      totalPages: Math.ceil(totalDocuments / limit),
    });
  } catch (error) {
    console.error('❌ Fetch documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
