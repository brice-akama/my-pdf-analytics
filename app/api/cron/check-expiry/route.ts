import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { 
  send30DayExpiryWarning, 
  send7DayExpiryWarning,
  sendDocumentExpiredNotification 
} from '@/lib/expiry-notifications';

export async function GET(request: NextRequest) {
  try {
    // ✅ Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Starting expiry check cron job...');

    const db = await dbPromise;
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let emailsSent = 0;
    let errors = 0;

    // ✅ Check current documents
    const documents = await db.collection('documents')
      .find({
        expiryDate: { $exists: true, $ne: null },
        archived: { $ne: true }
      })
      .toArray();

    for (const doc of documents) {
      const expiryDate = new Date(doc.expiryDate);
      const diffTime = expiryDate.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Get owner info
      const owner = await db.collection('profiles').findOne({
        user_id: doc.userId
      });

      if (!owner?.email) continue;

      const ownerName = owner.full_name || owner.name || owner.email.split('@')[0];
      const docName = doc.originalFilename || doc.filename;

      try {
        // 📧 Send appropriate notification
        if (daysUntilExpiry === 30) {
          await send30DayExpiryWarning({
            recipientName: ownerName,
            recipientEmail: owner.email,
            documentName: docName,
            documentId: doc._id.toString(),
            expiryDate: doc.expiryDate,
            expiryReason: doc.expiryReason,
            daysUntilExpiry: 30
          });
          emailsSent++;
          console.log(`✅ Sent 30-day warning for: ${docName}`);

        } else if (daysUntilExpiry === 7) {
          await send7DayExpiryWarning({
            recipientName: ownerName,
            recipientEmail: owner.email,
            documentName: docName,
            documentId: doc._id.toString(),
            expiryDate: doc.expiryDate,
            expiryReason: doc.expiryReason,
            daysUntilExpiry: 7
          });
          emailsSent++;
          console.log(`✅ Sent 7-day warning for: ${docName}`);

        } else if (daysUntilExpiry === 0) {
          await sendDocumentExpiredNotification({
            recipientName: ownerName,
            recipientEmail: owner.email,
            documentName: docName,
            documentId: doc._id.toString(),
            expiryDate: doc.expiryDate,
            expiryReason: doc.expiryReason
          });
          
          // ✅ Update document status
          await db.collection('documents').updateOne(
            { _id: doc._id },
            { $set: { status: 'expired' } }
          );
          
          emailsSent++;
          console.log(`✅ Sent expired notification for: ${docName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to send email for ${docName}:`, error);
        errors++;
      }
    }

    // ✅ Check versions
    const versions = await db.collection('documentVersions')
      .find({
        expiryDate: { $exists: true, $ne: null }
      })
      .toArray();

    for (const version of versions) {
      const expiryDate = new Date(version.expiryDate);
      const diffTime = expiryDate.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const doc = await db.collection('documents').findOne({
        _id: version.documentId
      });

      if (!doc) continue;

      const owner = await db.collection('profiles').findOne({
        user_id: doc.userId
      });

      if (!owner?.email) continue;

      const ownerName = owner.full_name || owner.name || owner.email.split('@')[0];
      const versionName = `${version.filename} (v${version.version})`;

      try {
        if (daysUntilExpiry === 30 || daysUntilExpiry === 7 || daysUntilExpiry === 0) {
          const sendFunction = 
            daysUntilExpiry === 30 ? send30DayExpiryWarning :
            daysUntilExpiry === 7 ? send7DayExpiryWarning :
            sendDocumentExpiredNotification;

          await sendFunction({
            recipientName: ownerName,
            recipientEmail: owner.email,
            documentName: versionName,
            documentId: doc._id.toString(),
            expiryDate: version.expiryDate,
            expiryReason: version.expiryReason,
            daysUntilExpiry
          });

          if (daysUntilExpiry === 0) {
            await db.collection('documentVersions').updateOne(
              { _id: version._id },
              { $set: { status: 'expired' } }
            );
          }

          emailsSent++;
          console.log(`✅ Sent notification for version: ${versionName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to send email for ${versionName}:`, error);
        errors++;
      }
    }

    console.log(`✅ Cron job complete: ${emailsSent} emails sent, ${errors} errors`);

    return NextResponse.json({
      success: true,
      emailsSent,
      errors,
      message: `Expiry check complete: ${emailsSent} notifications sent`
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}