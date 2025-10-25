import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
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

    // Get document
    const document = await db.collection('documents').findOne(
      { _id: share.documentId },
      { projection: { fileData: 0 } }
    );

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document: {
        _id: document._id.toString(),
        filename: document.filename,
        numPages: document.numPages,
        size: document.size,
      },
      settings: share.settings
    });

  } catch (error) {
    console.error('View document error:', error);
    return NextResponse.json({ error: 'Failed to load document' }, { status: 500 });
  }
}