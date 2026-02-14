import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;
    const profile = await db.collection('profiles').findOne({ user_id: user.id });
    const organizationId = profile?.organization_id || user.id;

    const now = new Date();

    // ✅ Get all documents in organization
    const documents = await db.collection('documents')
      .find({
        organizationId,
        archived: { $ne: true }
      })
      .toArray();

    // ✅ Get all versions
    const documentIds = documents.map(d => d._id);
    const versions = await db.collection('documentVersions')
      .find({
        documentId: { $in: documentIds }
      })
      .toArray();

    // ✅ Categorize by expiry status
    const expired = [];
    const expiringSoon = [];
    const active = [];

    // Check current documents
    for (const doc of documents) {
      if (doc.expiryDate) {
        const expiryDate = new Date(doc.expiryDate);
        const diffTime = expiryDate.getTime() - now.getTime();
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const item = {
          _id: doc._id.toString(),
          filename: doc.originalFilename || doc.filename,
          type: 'current',
          version: doc.version || 1,
          expiryDate: doc.expiryDate,
          expiryReason: doc.expiryReason,
          daysUntilExpiry,
          createdAt: doc.createdAt,
        };

        if (daysUntilExpiry < 0) {
          expired.push({ ...item, daysExpired: Math.abs(daysUntilExpiry) });
        } else if (daysUntilExpiry <= 30) {
          expiringSoon.push(item);
        } else {
          active.push(item);
        }
      }
    }

    // Check versions
    for (const version of versions) {
      if (version.expiryDate) {
        const expiryDate = new Date(version.expiryDate);
        const diffTime = expiryDate.getTime() - now.getTime();
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const doc = documents.find(d => d._id.toString() === version.documentId.toString());
        if (!doc) continue;

        const item = {
          _id: version._id.toString(),
          documentId: version.documentId.toString(),
          filename: doc.originalFilename || doc.filename,
          type: 'version',
          version: version.version,
          expiryDate: version.expiryDate,
          expiryReason: version.expiryReason,
          daysUntilExpiry,
          createdAt: version.createdAt,
        };

        if (daysUntilExpiry < 0) {
          expired.push({ ...item, daysExpired: Math.abs(daysUntilExpiry) });
        } else if (daysUntilExpiry <= 30) {
          expiringSoon.push(item);
        } else {
          active.push(item);
        }
      }
    }

    // ✅ Get compliance logs (blocked downloads/signatures)
    const complianceLogs = await db.collection('compliance_logs')
      .find({
        userId: user.id,
        action: { $in: ['blocked_expired_download', 'blocked_expired_signature'] }
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      summary: {
        totalExpired: expired.length,
        totalExpiringSoon: expiringSoon.length,
        totalActive: active.length,
        totalWithExpiry: expired.length + expiringSoon.length + active.length,
      },
      expired: expired.sort((a, b) => (b.daysExpired || 0) - (a.daysExpired || 0)),
      expiringSoon: expiringSoon.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
      active: active.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
      complianceLogs: complianceLogs.map(log => ({
        _id: log._id.toString(),
        action: log.action,
        documentId: log.documentId,
        version: log.version,
        userEmail: log.userEmail,
        expiryReason: log.expiryReason,
        timestamp: log.timestamp,
      })),
    });

  } catch (error) {
    console.error('❌ Compliance report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}