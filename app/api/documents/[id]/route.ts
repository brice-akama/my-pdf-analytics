import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
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
    
    const document = await db.collection('documents').findOne({
      _id: new ObjectId(params.id),
      userId: user.id
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      document: {
        _id: document._id.toString(),
        filename: document.filename,
        size: document.size,
        numPages: document.numPages,
        createdAt: document.createdAt
      }
    });
    
  } catch (error) {
    console.error('Fetch document error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(
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
    
    const result = await db.collection('documents').deleteOne({
      _id: new ObjectId(params.id),
      userId: user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}