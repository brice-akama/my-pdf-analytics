import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    
    // Get document with file data
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(params.id),
      userId: user.id
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.fileData) {
      return NextResponse.json({ error: 'File data not found' }, { status: 404 });
    }

    // Convert base64 back to buffer
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