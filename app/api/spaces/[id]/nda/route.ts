import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Check if user needs to sign NDA
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbPromise;
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Space not found' },
        { status: 404 }
      );
    }

    // ✅ OWNERS BYPASS NDA
    const isOwner = space.userId === user.id;
    if (isOwner) {
      return NextResponse.json({
        needsNDA: false,
        isOwner: true,
        hasAccess: true
      });
    }

    // ✅ Check if NDA is enabled
    const ndaEnabled = space.ndaSettings?.enabled || false;

    if (!ndaEnabled) {
      return NextResponse.json({
        needsNDA: false,
        hasAccess: true
      });
    }

    // ✅ Check if user already signed
    const hasSigned = space.ndaSignatures?.some(
      (sig: any) => sig.email === user.email
    );

    return NextResponse.json({
      needsNDA: !hasSigned,
      hasAccess: hasSigned,
      ndaDocumentUrl: space.ndaSettings?.ndaDocumentUrl,
      ndaDocumentName: space.ndaSettings?.ndaDocumentName
    });

  } catch (error) {
    console.error('❌ Check NDA error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

// POST - Sign NDA (Clients only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbPromise;
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Space not found' },
        { status: 404 }
      );
    }

    // ✅ Owners can't sign their own NDA
    const isOwner = space.userId === user.id;
    if (isOwner) {
      return NextResponse.json(
        { success: false, error: 'Owners do not need to sign NDA' },
        { status: 400 }
      );
    }

    // ✅ Check if already signed
    const alreadySigned = space.ndaSignatures?.some(
      (sig: any) => sig.email === user.email
    );

    if (alreadySigned) {
      return NextResponse.json({
        success: true,
        message: 'NDA already signed'
      });
    }

    // ✅ Record signature
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const signature = {
      email: user.email,
      userId: user.id,
      signedAt: new Date(),
      ipAddress,
      userAgent,
      ndaDocumentId: space.ndaSettings?.ndaDocumentId,
      ndaVersion: space.ndaSettings?.uploadedAt
    };

    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      {
        $push: { ndaSignatures: signature } as any
      }
    );

    console.log(`✅ NDA signed by ${user.email} for space ${spaceId}`);

    return NextResponse.json({
      success: true,
      message: 'NDA signed successfully'
    });

  } catch (error) {
    console.error('❌ Sign NDA error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

// PUT - Upload/Update NDA (Owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params;
    const user = await verifyUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await dbPromise;
    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json(
        { success: false, error: 'Space not found' },
        { status: 404 }
      );
    }

    // ✅ Only owner can set NDA
    const isOwner = space.userId === user.id;
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Only space owner can set NDA' },
        { status: 403 }
      );
    }

    const { 
      enabled, 
      ndaDocumentId, 
      ndaDocumentName, 
      ndaDocumentUrl 
    } = await request.json();

    // ✅ If enabling, must have NDA document
    if (enabled && !ndaDocumentUrl) {
      return NextResponse.json(
        { success: false, error: 'NDA document required when enabling' },
        { status: 400 }
      );
    }

    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      {
        $set: {
          'ndaSettings.enabled': enabled,
          'ndaSettings.ndaDocumentId': ndaDocumentId || null,
          'ndaSettings.ndaDocumentName': ndaDocumentName || null,
          'ndaSettings.ndaDocumentUrl': ndaDocumentUrl || null,
          'ndaSettings.uploadedAt': enabled ? new Date() : null,
          'ndaSettings.uploadedBy': enabled ? user.id : null
        }
      }
    );

    console.log(`✅ NDA settings updated for space ${spaceId}`);

    return NextResponse.json({
      success: true,
      message: 'NDA settings updated successfully'
    });

  } catch (error) {
    console.error('❌ Update NDA error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}