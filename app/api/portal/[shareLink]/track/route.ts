import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const shareLink = params.shareLink;
    const body = await request.json();
    const { email, event, documentId, documentName } = body;

    console.log('📊 Tracking event:', { shareLink, event, email });

    const db = await dbPromise;

    // Find space
    const space = await db.collection('spaces').findOne({
      'publicAccess.shareLink': shareLink
    });

    if (!space) {
      return NextResponse.json({
        success: false,
        error: 'Space not found'
      }, { status: 404 });
    }

    // Log the activity
    await db.collection('activityLogs').insertOne({
      spaceId: space._id,
      visitorEmail: email,
      event,
      documentId: documentId ? new ObjectId(documentId) : null,
      documentName,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    console.log('✅ Event tracked');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Track error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to track event'
    }, { status: 500 });
  }
}