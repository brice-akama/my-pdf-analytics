import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { needsNDA: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbPromise;
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json(
        { needsNDA: false, error: 'Space not found' },
        { status: 404 }
      );
    }

    // Check if NDA is enabled
    const ndaEnabled = space.ndaSettings?.enabled || false;

    if (!ndaEnabled) {
      return NextResponse.json({
        needsNDA: false,
        hasAccess: true
      });
    }

    // Check if user already signed
    const hasSigned = space.ndaSignatures?.some(
      (sig: any) => sig.email === user.email
    );

    // Owners bypass NDA (optional - you can change this)
    const isOwner = space.userId === user.id;

    return NextResponse.json({
      needsNDA: !hasSigned && !isOwner,
      hasAccess: hasSigned || isOwner,
      ndaSettings: space.ndaSettings
    });

  } catch (error) {
    console.error('❌ Check NDA error:', error);
    return NextResponse.json(
      { needsNDA: false, error: 'Server error' },
      { status: 500 }
    );
  }
}