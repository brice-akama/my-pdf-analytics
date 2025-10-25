import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '../../../lib/mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { password } = await request.json();
    
    const db = await dbPromise;
    
    const share = await db.collection('shares').findOne({
      shareToken: params.token
    });

    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // Check password
    if (share.settings.password === password) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });

  } catch (error) {
    console.error('Verify password error:', error);
    return NextResponse.json({ error: 'Failed to verify password' }, { status: 500 });
  }
}