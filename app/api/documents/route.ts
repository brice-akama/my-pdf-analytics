// app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // ✅ Verify user using the cookie-based auth
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // ✅ Fetch user documents, excluding large binary data
    const documents = await db.collection('documents')
      .find(
        { userId: user.id },
        { projection: { fileData: 0 } } // omit heavy fields
      )
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error('❌ Fetch documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
