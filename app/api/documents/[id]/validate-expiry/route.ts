import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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

    // ✅ Check if document is expired
    if (document.expiryDate) {
      const expiryDate = new Date(document.expiryDate);
      const now = new Date();
      
      if (expiryDate < now) {
        const daysExpired = Math.ceil((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return NextResponse.json({
          valid: false,
          expired: true,
          expiryDate: document.expiryDate,
          expiryReason: document.expiryReason,
          daysExpired,
          message: 'This document has expired and cannot be used for signatures'
        });
      }

      // ✅ Warn if expiring soon
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 7) {
        return NextResponse.json({
          valid: true,
          expiringSoon: true,
          expiryDate: document.expiryDate,
          daysUntilExpiry,
          warning: `This document expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
        });
      }
    }

    return NextResponse.json({
      valid: true,
      expired: false,
      expiringSoon: false
    });

  } catch (error) {
    console.error('❌ Validate expiry error:', error);
    return NextResponse.json(
      { error: 'Failed to validate expiry' },
      { status: 500 }
    );
  }
}