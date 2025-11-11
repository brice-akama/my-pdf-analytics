// app/api/documents/[id]/signature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

interface SignatureFieldType {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  required?: boolean;
  assignedTo?: string;
  label?: string;
  value?: any;
  completedAt?: Date | null;
  completedBy?: string | null;
}

// ✅ POST - Create signature request (outsmart DocSend!)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Verify user via HTTP-only cookie
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Validate document ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(params.id);

    // ✅ Verify ownership and get document
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ✅ Parse signature request data
    const body = await request.json();
    const {
      recipients, // Array of signers [{email, name, role, order}]
      message = '',
      subject = `Please sign: ${document.originalFilename}`,
      dueDate = null,
      reminderFrequency = 'none', // 'none', 'daily', 'weekly'
      
      // Advanced features
      signatureFields = [], // [{page, x, y, width, height, type, required, assignedTo}]
      requireAllSignatures = true, // All must sign vs any can sign
      signatureOrder = 'parallel', // 'parallel' (all at once) or 'sequential' (one by one)
      allowDecline = true,
      allowComments = true,
      requireInitials = false,
      requireDateSigned = true,
      
      // Security features
      requirePhoneVerification = false,
      requireIdVerification = false,
      accessCode = null, // Optional PIN for extra security
      ipRestriction = null, // Restrict to specific IP ranges
      allowForwarding = false,
      
      // Notifications
      notifyOnView = true,
      notifyOnSign = true,
      notifyOnDecline = true,
      notifyOnComplete = true,
      
      // Legal & Compliance
      legalNotice = null, // Custom legal text
      requireAcceptTerms = true,
      electronicConsentText = null,
      
      // Branding (Premium feature)
      customBranding = null, // {logo, colors, companyName}
      
      // Expiration
      expiresIn = 30, // Days until request expires
    } = body;

    // ✅ Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({
        error: 'At least one recipient is required',
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const recipient of recipients) {
      if (!recipient.email || !emailRegex.test(recipient.email)) {
        return NextResponse.json({
          error: `Invalid email address: ${recipient.email}`,
        }, { status: 400 });
      }
      if (!recipient.name) {
        return NextResponse.json({
          error: 'Recipient name is required',
        }, { status: 400 });
      }
    }

    // ✅ Check plan limits
    const signatureLimit = user.plan === 'premium' ? 50 : 5; // Premium = 50/month, Free = 5/month
    
    // Count signatures sent this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const signaturesThisMonth = await db.collection('signature_requests').countDocuments({
      userId: user.id,
      createdAt: { $gte: startOfMonth },
    });

    if (signaturesThisMonth >= signatureLimit) {
      return NextResponse.json({
        error: `Signature request limit reached. ${user.plan === 'free' ? 'Upgrade to Premium for more signatures.' : 'Monthly limit reached.'}`,
        limit: signatureLimit,
        used: signaturesThisMonth,
        upgrade: user.plan === 'free',
      }, { status: 403 });
    }

    // ✅ Validate premium features
    if (user.plan === 'free') {
      if (requirePhoneVerification || requireIdVerification) {
        return NextResponse.json({
          error: 'Advanced verification requires Premium plan',
          upgrade: true,
        }, { status: 403 });
      }
      if (customBranding) {
        return NextResponse.json({
          error: 'Custom branding requires Premium plan',
          upgrade: true,
        }, { status: 403 });
      }
      if (recipients.length > 3) {
        return NextResponse.json({
          error: 'Free plan allows maximum 3 recipients. Upgrade to Premium for unlimited recipients.',
          upgrade: true,
        }, { status: 403 });
      }
    }

    // ✅ Generate secure tokens for each recipient
    const recipientsWithTokens = recipients.map((recipient, index) => ({
      id: new ObjectId().toString(),
      email: recipient.email.toLowerCase().trim(),
      name: recipient.name.trim(),
      role: recipient.role || 'Signer',
      order: signatureOrder === 'sequential' ? (recipient.order || index + 1) : 1,
      
      // Security
      signatureToken: crypto.randomBytes(32).toString('base64url'),
      accessCode: accessCode ? crypto.createHash('sha256').update(accessCode).digest('hex') : null,
      
      // Status
      status: 'pending', // 'pending', 'sent', 'viewed', 'signed', 'declined', 'expired'
      canSign: signatureOrder === 'parallel' || index === 0, // First signer can sign immediately
      
      // Tracking
      emailSentAt: null,
      viewedAt: null,
      signedAt: null,
      declinedAt: null,
      lastReminderAt: null,
      reminderCount: 0,
      
      // Signature data
      signatureData: null, // Will store base64 signature image
      initialsData: null,
      signedFromIp: null,
      signedFromDevice: null,
      signedFromLocation: null,
      
      // Verification
      phoneVerified: !requirePhoneVerification,
      idVerified: !requireIdVerification,
      verificationAttempts: 0,
      
      // Decline info
      declineReason: null,
      comments: [],
    }));

    // ✅ Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresIn || 30));

    // ✅ Parse due date
    let parsedDueDate = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (parsedDueDate < new Date()) {
        return NextResponse.json({
          error: 'Due date must be in the future',
        }, { status: 400 });
      }
    }

    // ✅ Generate master signature token (for tracking the entire request)
    const masterToken = crypto.randomBytes(32).toString('base64url');

    // ✅ Create comprehensive signature request
    const signatureRequest = {
      // Document reference
      documentId,
      userId: user.id,
      documentSnapshot: {
        filename: document.originalFilename,
        format: document.originalFormat,
        numPages: document.numPages,
        size: document.size,
        cloudinaryPdfUrl: document.cloudinaryPdfUrl,
      },

      // Request metadata
      masterToken,
      subject,
      message,
      dueDate: parsedDueDate,
      expiresAt,
      reminderFrequency,

      // Recipients
      recipients: recipientsWithTokens,
      requireAllSignatures,
      signatureOrder,
      totalRecipients: recipients.length,
      
      // Signature fields configuration
      signatureFields: signatureFields.map((field: SignatureFieldType) => ({
  id: new ObjectId().toString(),
  page: field.page,
  x: field.x,
  y: field.y,
  width: field.width,
  height: field.height,
  type: field.type || 'signature',
  label: field.label || 'Signature',
  required: field.required !== false,
  assignedTo: field.assignedTo,
  value: null,
  completedAt: null,
  completedBy: null,
})),
      // Settings
      settings: {
        allowDecline,
        allowComments,
        requireInitials,
        requireDateSigned,
        requirePhoneVerification,
        requireIdVerification,
        allowForwarding,
        ipRestriction,
      },

      // Notifications
      notifications: {
        notifyOnView,
        notifyOnSign,
        notifyOnDecline,
        notifyOnComplete,
      },

      // Legal & Compliance
      legal: {
        legalNotice,
        requireAcceptTerms,
        electronicConsentText: electronicConsentText || getDefaultConsentText(),
        consentAcceptedBy: [], // [{recipientId, acceptedAt, ip}]
      },

      // Branding (Premium)
      branding: customBranding,

      // Status tracking
      status: 'draft', // 'draft', 'sent', 'in_progress', 'completed', 'declined', 'expired', 'cancelled'
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,

      // Progress tracking
      progress: {
        sent: 0,
        viewed: 0,
        signed: 0,
        declined: 0,
        pending: recipients.length,
        percentComplete: 0,
      },

      // Activity log
      activityLog: [
        {
          action: 'request_created',
          actor: {
            userId: user.id,
            email: user.email,
            name: (user as any).name || user.email,
          },
          timestamp: new Date(),
          details: {
            recipientCount: recipients.length,
            signatureOrder,
          },
        }
      ],

      // Audit trail (for legal compliance)
      auditTrail: [
        {
          event: 'signature_request_created',
          timestamp: new Date(),
          userId: user.id,
          userEmail: user.email,
          userIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
          details: {
            documentId: documentId.toString(),
            recipientEmails: recipients.map(r => r.email),
          },
        }
      ],

      // Analytics
      analytics: {
        emailOpenRate: 0,
        averageTimeToView: null,
        averageTimeToSign: null,
        deviceBreakdown: {},
        locationBreakdown: {},
      },

      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      sentAt: null,
      lastActivityAt: new Date(),

      // Creator info
      createdBy: {
        userId: user.id,
        email: user.email,
        name: (user as any).name || user.email,
        plan: user.plan,
      },
    };

    // ✅ Insert signature request
    const result = await db.collection('signature_requests').insertOne(signatureRequest);
    const requestId = result.insertedId.toString();

    // ✅ Update document with signature request reference
    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $push: {
          signatureRequests: {
            id: requestId,
            masterToken,
            createdAt: new Date(),
            status: 'draft',
            recipients: recipients.map(r => ({ email: r.email, name: r.name })),
          },
        },
        $set: { updatedAt: new Date() },
      } as any
    );

    // ✅ Log signature request creation
    await db.collection('analytics_logs').insertOne({
      documentId: params.id,
      action: 'signature_request_created',
      userId: user.id,
      signatureRequestId: requestId,
      recipientCount: recipients.length,
      signatureOrder,
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }).catch(err => console.error('Failed to log signature request:', err));

    // ✅ Generate signature links for each recipient
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const recipientLinks = recipientsWithTokens.map(recipient => ({
      email: recipient.email,
      name: recipient.name,
      signatureLink: `${baseUrl}/sign/${recipient.signatureToken}`,
      order: recipient.order,
    }));

    // ✅ TODO: Send emails to recipients (in production)
    // For now, log the signature links
    console.log('📧 Signature request emails would be sent:');
    recipientLinks.forEach(link => {
      console.log(`  → ${link.name} <${link.email}>: ${link.signatureLink}`);
    });

    // ✅ Return comprehensive response
    return NextResponse.json({
      success: true,
      signatureRequest: {
        id: requestId,
        masterToken,
        status: 'draft',
        documentId: documentId.toString(),
        documentName: document.originalFilename,
        
        recipients: recipientLinks,
        totalRecipients: recipients.length,
        signatureOrder,
        
        settings: {
          requireAllSignatures,
          allowDecline,
          requirePhoneVerification,
          requireIdVerification,
        },
        
        timeline: {
          createdAt: signatureRequest.createdAt,
          dueDate: parsedDueDate,
          expiresAt,
        },
        
        tracking: {
          masterLink: `${baseUrl}/signature/${masterToken}`, // Track all signers
          statusPage: `${baseUrl}/signature/status/${masterToken}`,
        },
      },
      message: 'Signature request created successfully. Ready to send.',
      nextSteps: [
        'Review the signature request',
        'Send emails to recipients',
        'Track signature progress in real-time',
      ],
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create signature request error:', error);
    return NextResponse.json({
      error: 'Failed to create signature request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ GET - List all signature requests for a document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Validate document ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(params.id);

    // ✅ Verify ownership
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ✅ Fetch all signature requests for this document
    const signatureRequests = await db.collection('signature_requests')
      .find({ documentId, userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // ✅ Format signature requests with progress
    const formattedRequests = signatureRequests.map(request => ({
      id: request._id.toString(),
      masterToken: request.masterToken,
      subject: request.subject,
      status: request.status,
      
      recipients: request.recipients.map((r: any) => ({
        name: r.name,
        email: r.email,
        role: r.role,
        status: r.status,
        signedAt: r.signedAt,
        viewedAt: r.viewedAt,
      })),
      
      progress: request.progress,
      
      timeline: {
        createdAt: request.createdAt,
        sentAt: request.sentAt,
        completedAt: request.completedAt,
        dueDate: request.dueDate,
        expiresAt: request.expiresAt,
      },
      
      isExpired: request.expiresAt ? new Date(request.expiresAt) < new Date() : false,
      isOverdue: request.dueDate ? new Date(request.dueDate) < new Date() && request.status !== 'completed' : false,
    }));

    return NextResponse.json({
      success: true,
      signatureRequests: formattedRequests,
      total: formattedRequests.length,
      summary: {
        draft: formattedRequests.filter(r => r.status === 'draft').length,
        sent: formattedRequests.filter(r => r.status === 'sent').length,
        inProgress: formattedRequests.filter(r => r.status === 'in_progress').length,
        completed: formattedRequests.filter(r => r.status === 'completed').length,
        declined: formattedRequests.filter(r => r.status === 'declined').length,
        expired: formattedRequests.filter(r => r.isExpired).length,
      },
      document: {
        id: document._id.toString(),
        filename: document.originalFilename,
      }
    });

  } catch (error) {
    console.error('❌ Fetch signature requests error:', error);
    return NextResponse.json({
      error: 'Failed to fetch signature requests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ PATCH - Update signature request (send, cancel, remind)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action, data } = body;
    // action: 'send', 'cancel', 'remind', 'update_settings'

    if (!requestId || !ObjectId.isValid(requestId)) {
      return NextResponse.json({ error: 'Valid request ID required' }, { status: 400 });
    }

    const db = await dbPromise;

    // ✅ Verify ownership
    const signatureRequest = await db.collection('signature_requests').findOne({
      _id: new ObjectId(requestId),
      userId: user.id,
    });

    if (!signatureRequest) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    let updateFields: any = {
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    };

    let activityLogEntry: any = null;
    let auditTrailEntry: any = null;

    // ✅ Handle different actions
    switch (action) {
      case 'send':
        if (signatureRequest.status !== 'draft') {
          return NextResponse.json({
            error: 'Can only send draft signature requests',
          }, { status: 400 });
        }

        updateFields.status = 'sent';
        updateFields.sentAt = new Date();
        updateFields['recipients.$[].emailSentAt'] = new Date();
        updateFields['recipients.$[].status'] = 'sent';

        activityLogEntry = {
          action: 'request_sent',
          actor: { userId: user.id, email: user.email },
          timestamp: new Date(),
          details: { recipientCount: signatureRequest.recipients.length },
        };

        auditTrailEntry = {
          event: 'signature_request_sent',
          timestamp: new Date(),
          userId: user.id,
          userEmail: user.email,
          details: {
            requestId,
            recipientEmails: signatureRequest.recipients.map((r: any) => r.email),
          },
        };

        // TODO: Actually send emails to recipients
        console.log('📧 Sending signature request emails...');

        break;

      case 'cancel':
        if (signatureRequest.status === 'completed' || signatureRequest.status === 'cancelled') {
          return NextResponse.json({
            error: 'Cannot cancel completed or already cancelled requests',
          }, { status: 400 });
        }

        updateFields.status = 'cancelled';
        updateFields.cancelledAt = new Date();
        updateFields.cancellationReason = data?.reason || 'Cancelled by sender';

        activityLogEntry = {
          action: 'request_cancelled',
          actor: { userId: user.id, email: user.email },
          timestamp: new Date(),
          details: { reason: data?.reason },
        };

        auditTrailEntry = {
          event: 'signature_request_cancelled',
          timestamp: new Date(),
          userId: user.id,
          userEmail: user.email,
          details: { requestId, reason: data?.reason },
        };

        break;

      case 'remind':
        // Send reminder to pending recipients
        const pendingRecipients = signatureRequest.recipients.filter(
          (r: any) => r.status === 'sent' || r.status === 'viewed'
        );

        if (pendingRecipients.length === 0) {
          return NextResponse.json({
            error: 'No pending recipients to remind',
          }, { status: 400 });
        }

        // Update reminder timestamps
        pendingRecipients.forEach((recipient: any) => {
          updateFields[`recipients.$[elem${recipient.id}].lastReminderAt`] = new Date();
          updateFields[`recipients.$[elem${recipient.id}].reminderCount`] = (recipient.reminderCount || 0) + 1;
        });

        activityLogEntry = {
          action: 'reminder_sent',
          actor: { userId: user.id, email: user.email },
          timestamp: new Date(),
          details: { recipientCount: pendingRecipients.length },
        };

        // TODO: Send reminder emails
        console.log('📧 Sending reminder emails...');

        break;

      default:
        return NextResponse.json({
          error: 'Invalid action',
        }, { status: 400 });
    }

    // ✅ Update signature request
    if (activityLogEntry) {
      updateFields.$push = { activityLog: activityLogEntry };
    }
    if (auditTrailEntry) {
      if (!updateFields.$push) updateFields.$push = {};
      updateFields.$push.auditTrail = auditTrailEntry;
    }

    await db.collection('signature_requests').updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateFields, ...(updateFields.$push && { $push: updateFields.$push }) }
    );

    // ✅ Log action
    await db.collection('analytics_logs').insertOne({
      documentId: params.id,
      action: `signature_${action}`,
      userId: user.id,
      signatureRequestId: requestId,
      timestamp: new Date(),
    }).catch(err => console.error('Failed to log action:', err));

    return NextResponse.json({
      success: true,
      message: `Signature request ${action} successful`,
    });

  } catch (error) {
    console.error('❌ Update signature request error:', error);
    return NextResponse.json({
      error: 'Failed to update signature request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ DELETE - Delete signature request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId || !ObjectId.isValid(requestId)) {
      return NextResponse.json({ error: 'Valid request ID required' }, { status: 400 });
    }

    const db = await dbPromise;

    // ✅ Verify ownership
    const signatureRequest = await db.collection('signature_requests').findOne({
      _id: new ObjectId(requestId),
      userId: user.id,
    });

    if (!signatureRequest) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    // ✅ Only allow deletion of draft or cancelled requests
    if (!['draft', 'cancelled', 'expired'].includes(signatureRequest.status)) {
      return NextResponse.json({
        error: 'Can only delete draft, cancelled, or expired signature requests',
        currentStatus: signatureRequest.status,
      }, { status: 400 });
    }

    // ✅ Delete signature request
    await db.collection('signature_requests').deleteOne({ _id: new ObjectId(requestId) });

    // ✅ Remove from document's signatureRequests array
    await db.collection('documents').updateOne(
      { _id: signatureRequest.documentId },
      {
        $pull: { signatureRequests: { id: requestId } },
        $set: { updatedAt: new Date() },
      } as any
    );

    // ✅ Log deletion
    await db.collection('analytics_logs').insertOne({
      documentId: params.id,
      action: 'signature_request_deleted',
      userId: user.id,
      signatureRequestId: requestId,
      timestamp: new Date(),
    }).catch(err => console.error('Failed to log deletion:', err));

    return NextResponse.json({
      success: true,
      message: 'Signature request deleted successfully',
    });

  } catch (error) {
    console.error('❌ Delete signature request error:', error);
    return NextResponse.json({
      error: 'Failed to delete signature request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ Helper: Default electronic consent text
function getDefaultConsentText(): string {
  return `By clicking "I Agree", you consent to the use of electronic records and signatures. You acknowledge that:

1. You have the ability to access and retain electronic records
2. Electronic signatures have the same legal effect as handwritten signatures
3. You consent to conduct this transaction electronically
4. You may request a paper copy of the signed document

You may withdraw your consent at any time by contacting the sender.`;
}