import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await verifyUserFromRequest(authHeader);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();
    
    // Generate unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiry date
    let expiresAt = null;
    if (settings.expiresIn !== 'never') {
      const days = parseInt(settings.expiresIn);
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    const db = await dbPromise;
    
    // Create share record
    const shareRecord = {
      documentId: new ObjectId(params.id),
      userId: user.id,
      shareToken,
      settings: {
        requireEmail: settings.requireEmail || false,
        allowDownload: settings.allowDownload || true,
        notifyOnView: settings.notifyOnView || true,
        password: settings.password || null,
      },
      expiresAt,
      createdAt: new Date(),
      views: 0,
      viewedBy: [],
    };

    await db.collection('shares').insertOne(shareRecord);

    // Generate share link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareLink = `${baseUrl}/view/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareLink,
      shareToken,
    });

  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}