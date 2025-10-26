import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await request.json();
    const db = await dbPromise;
    
    if (notificationId) {
      // Mark single notification as read
      await db.collection('notifications').updateOne(
        { _id: new ObjectId(notificationId), userId: user.id },
        { $set: { read: true, readAt: new Date() } }
      );
    } else {
      // Mark all as read
      await db.collection('notifications').updateMany(
        { userId: user.id, read: false },
        { $set: { read: true, readAt: new Date() } }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}