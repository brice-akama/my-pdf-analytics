import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { email } = await request.json();
    
    const db = await dbPromise;
    
    // Find share record
    const share = await db.collection('shares').findOne({
      shareToken: params.token
    });

    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Get document with file data
    const document = await db.collection('documents').findOne({
      _id: share.documentId
    });

    if (!document || !document.fileData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(document.fileData, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Fetch file error:', error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}