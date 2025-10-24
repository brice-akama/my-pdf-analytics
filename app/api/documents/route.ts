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
    
    // Fetch documents but exclude fileData field for performance
    const documents = await db.collection('documents')
      .find(
        { userId: user.id },
        { projection: { fileData: 0 } } // Exclude fileData from list
      )
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      documents: documents
    });
    
  } catch (error) {
    console.error('Fetch documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}