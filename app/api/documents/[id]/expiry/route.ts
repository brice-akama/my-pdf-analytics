import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ SET expiry date for document or version
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expiryDate, versionId, reason } = body;

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // ✅ Verify ownership
    const document = await db.collection('documents').findOne({
      _id: documentId,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || user.id;

    const hasAccess = 
      document.userId === user.id || 
      document.organizationId === organizationId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // ✅ Set expiry on specific version or current document
    if (versionId) {
      const versionObjectId = new ObjectId(versionId);
      
      await db.collection('documentVersions').updateOne(
        { _id: versionObjectId, documentId: documentId },
        {
          $set: {
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            expiryReason: reason || null,
            expirySetAt: new Date(),
            expirySetBy: user.id,
            status: expiryDate && new Date(expiryDate) < new Date() ? 'expired' : 'active'
          }
        }
      );

      console.log('✅ Version expiry set:', versionId);
    } else {
      // Set on current document
      await db.collection('documents').updateOne(
        { _id: documentId },
        {
          $set: {
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            expiryReason: reason || null,
            expirySetAt: new Date(),
            expirySetBy: user.id,
            status: expiryDate && new Date(expiryDate) < new Date() ? 'expired' : 'active'
          }
        }
      );

      console.log('✅ Document expiry set');
    }

    return NextResponse.json({
      success: true,
      message: 'Expiry date set successfully'
    });

  } catch (error) {
    console.error('❌ Set expiry error:', error);
    return NextResponse.json(
      { error: 'Failed to set expiry date' },
      { status: 500 }
    );
  }
}

// ✅ GET expiry status
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    const document = await db.collection('documents').findOne({
      _id: documentId,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ✅ Check expiry status
    const now = new Date();
    const expiryDate = document.expiryDate ? new Date(document.expiryDate) : null;
    
    let status = 'active';
    let daysUntilExpiry = null;

    if (expiryDate) {
      const diffTime = expiryDate.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring_soon';
      }
    }

    return NextResponse.json({
      success: true,
      expiryDate: document.expiryDate,
      expiryReason: document.expiryReason,
      status,
      daysUntilExpiry,
      expirySetAt: document.expirySetAt,
      expirySetBy: document.expirySetBy,
    });

  } catch (error) {
    console.error('❌ Get expiry error:', error);
    return NextResponse.json(
      { error: 'Failed to get expiry status' },
      { status: 500 }
    );
  }
}