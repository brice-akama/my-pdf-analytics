// lib/notifications.ts (FIXED VERSION)
import { dbPromise } from '@/app/api/lib/mongodb';

type NotificationType = 
  | 'view' 
  | 'download' 
  | 'signature' 
  | 'share' 
  | 'comment' 
  | 'upload'
  | 'space_access'
  | 'team_invite'
  | 'mention'
  | 'system'
  | 'billing'
  | 'security';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  documentId?: string;
  spaceId?: string;
  actorName?: string;
  redirectUrl?: string;
  actorEmail?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const db = await dbPromise;

    const notification = {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      documentId: params.documentId,
      spaceId: params.spaceId,
      actorName: params.actorName,
      actorEmail: params.actorEmail,
      redirectUrl: params.redirectUrl,
      metadata: params.metadata || {},
      read: false,
      readAt: null,
      archived: false,
      createdAt: new Date(),
    };

    await db.collection('notifications').insertOne(notification);

    console.log(`✅ Notification created for user ${params.userId}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Create notification error:', error);
    return { success: false, error };
  }
}

// ✅ FIXED: Changed documentName to originalFilename for consistency
export async function notifyDocumentView(
  ownerId: string,
  originalFilename: string,  // Changed parameter name
  documentId: string,
  viewerName: string,
  viewerEmail: string
) {
  return createNotification({
    userId: ownerId,
    type: 'view',
    title: 'Document Viewed',
    message: `${viewerName} viewed "${originalFilename}"`,  // ✅ Using correct field
    documentId,
    actorName: viewerName,
    actorEmail: viewerEmail,
    metadata: { viewedAt: new Date() }
  });
}

// ✅ FIXED: Removed incorrect __filename reference
export async function notifyFileUploaded(
  requestOwnerId: string,
  uploaderEmail: string,
  originalFilename: string,  // Changed parameter name
  fileRequestId: string
) {
  return createNotification({
    userId: requestOwnerId,
    type: 'upload',
    title: 'File Uploaded',
    message: `${uploaderEmail} uploaded "${originalFilename}"`,
    metadata: { 
      fileRequestId, 
      originalFilename,  // ✅ Correct field name
      uploadedAt: new Date() 
    }
  });
}

// ✅ FIXED: Notify when document is downloaded
export async function notifyDocumentDownload(
  ownerId: string,
  originalFilename: string,
  documentId: string,
  downloaderName: string,
  downloaderEmail: string,
  uniqueId?: string
) {
  return createNotification({
    userId: ownerId,
    type: 'download',
    title: 'Document Downloaded',
    message: `${downloaderName} downloaded "${originalFilename}"`,
    documentId,
    redirectUrl: uniqueId ? `/signed/${uniqueId}` : `/documents/${documentId}`, // ✅ This should work now
    actorName: downloaderName,
    actorEmail: downloaderEmail,
    metadata: { 
      downloadedAt: new Date(),
      uniqueId // ✅ Store uniqueId in metadata too
    }
  });
}

// ✅ FIXED: Notify when document is signed
export async function notifyDocumentSigned(
  ownerId: string,
  originalFilename: string,
  documentId: string,
  signerName: string,
  signerEmail: string
) {
  return createNotification({
    userId: ownerId,
    type: 'signature',
    title: 'Document Signed',
    message: `${signerName} signed "${originalFilename}"`,
    documentId,
    actorName: signerName,
    actorEmail: signerEmail,
    metadata: { signedAt: new Date() }
  });
}

// ✅ FIXED: Notify when document is shared
export async function notifyDocumentShared(
  recipientId: string,
  originalFilename: string,
  documentId: string,
  sharedByName: string,
  sharedByEmail: string
) {
  return createNotification({
    userId: recipientId,
    type: 'share',
    title: 'Document Shared With You',
    message: `${sharedByName} shared "${originalFilename}" with you`,
    documentId,
    actorName: sharedByName,
    actorEmail: sharedByEmail,
    metadata: { sharedAt: new Date() }
  });
}

// System notification (you send this manually)
export async function notifyAllUsers(
  title: string,
  message: string,
  metadata?: Record<string, any>
) {
  const db = await dbPromise;
  
  // Get all active users
  const users = await db.collection('users')
    .find({ status: 'active' })
    .project({ _id: 1 })
    .toArray();

  // Create notification for each user
  const notifications = users.map(user => ({
    userId: user._id.toString(),
    type: 'system' as NotificationType,
    title,
    message,
    read: false,
    metadata: metadata || {},
    createdAt: new Date(),
  }));

  if (notifications.length > 0) {
    await db.collection('notifications').insertMany(notifications);
  }
  
  console.log(`✅ Sent system notification to ${users.length} users`);
}