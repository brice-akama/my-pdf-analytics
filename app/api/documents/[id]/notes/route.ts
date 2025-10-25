import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notes } = await request.json();

    const db = await dbPromise;
    
    const result = await db.collection('documents').updateOne(
      {
        _id: new ObjectId(params.id),
        userId: user.id
      },
      {
        $set: { notes, updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notes updated successfully'
    });

  } catch (error) {
    console.error('Update notes error:', error);
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
  }
}