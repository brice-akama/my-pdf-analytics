import { NextRequest, NextResponse } from 'next/server';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { dbPromise } from '../../lib/mongodb';

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
    
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(params.id),
      userId: user.id
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      space: {
        ...space,
        _id: space._id.toString()
      }
    });

  } catch (error) {
    console.error('Get space error:', error);
    return NextResponse.json({ error: 'Failed to get space' }, { status: 500 });
  }
}