// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // Get user's notifications (sorted by newest first)
    const notifications = await db.collection('notifications')
      .find({ 
        userId: user.id,
        archived: { $ne: true }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Count unread
    const unreadCount = await db.collection('notifications')
      .countDocuments({ 
        userId: user.id, 
        read: false,
        archived: { $ne: true }
      });

    return NextResponse.json({
      success: true,
      notifications: notifications.map(n => ({
        _id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        documentId: n.documentId,
        spaceId: n.spaceId,
        actorName: n.actorName,
        actorEmail: n.actorEmail,
        metadata: n.metadata,
        createdAt: n.createdAt
      })),
      unreadCount
    });

  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch notifications' 
    }, { status: 500 });
  }
}

// Mark as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await request.json();
    const db = await dbPromise;

    if (notificationId) {
      // Mark single notification as read
      await db.collection('notifications').updateOne(
        { _id: notificationId, userId: user.id },
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
    return NextResponse.json({ 
      error: 'Failed to mark as read' 
    }, { status: 500 });
  }
}

// ✅ DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    const db = await dbPromise;

    if (clearAll) {
      // ✅ DELETE ALL notifications for this user
      const result = await db.collection('notifications').deleteMany({
        userId: user.id
      });

      console.log(`🗑️ Deleted ${result.deletedCount} notifications for user ${user.id}`);

      return NextResponse.json({ 
        success: true,
        deletedCount: result.deletedCount,
        message: 'All notifications cleared'
      });

    } else if (notificationId) {
      // ✅ DELETE SINGLE notification
      const result = await db.collection('notifications').deleteOne({
        _id: new ObjectId(notificationId),
        userId: user.id // Security: only delete if it belongs to this user
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      console.log(`🗑️ Deleted notification ${notificationId} for user ${user.id}`);

      return NextResponse.json({ 
        success: true,
        message: 'Notification deleted'
      });

    } else {
      return NextResponse.json(
        { error: 'Missing notificationId or clearAll parameter' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete notification' 
    }, { status: 500 });
  }
}