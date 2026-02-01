// app/api/view/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { sendNdaAcceptanceNotification } from '@/lib/email-nda-notification';

// ✅ POST - View shared document (with optional authentication)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: 'Share token required' }, { status: 400 });
    }

    const db = await dbPromise;

    // ✅ Find share record by token
    const share = await db.collection('shares').findOne({
      shareToken: token,
    });

    if (!share) {
      return NextResponse.json({ 
        error: 'Share link not found or has been revoked',
        notFound: true
      }, { status: 404 });
    }

    // ✅ Check if share is active
    if (!share.active) {
      return NextResponse.json({ 
        error: 'This share link has been deactivated',
        deactivated: true
      }, { status: 403 });
    }

    // ✅ Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ 
        error: 'This share link has expired',
        expired: true
      }, { status: 410 });
    }

    // ✅ Check max views
    if (share.settings.maxViews && share.tracking.views >= share.settings.maxViews) {
      return NextResponse.json({ 
        error: 'This share link has reached its maximum number of views',
        maxViewsReached: true
      }, { status: 403 });
    }

    // ✅ Parse authentication data from request
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    // ✅ Check if email is required
    if (share.settings.requireEmail && !email) {
      return NextResponse.json({
        requiresAuth: true,
        requiresEmail: true,
        requiresPassword: share.settings.hasPassword,
        settings: {
          customMessage: share.settings.customMessage,
        },
      }, { status: 401 });
    }

    // ✅ Check if password is required
    if (share.settings.hasPassword && !password) {
      return NextResponse.json({
        requiresAuth: true,
        requiresEmail: share.settings.requireEmail,
        requiresPassword: true,
        settings: {
          customMessage: share.settings.customMessage,
        },
      }, { status: 401 });
    }

    // ✅ Verify password if provided
    if (share.settings.hasPassword && password) {
      const passwordValid = await bcrypt.compare(password, share.password);
      if (!passwordValid) {
        // Track failed attempt
        await db.collection('shares').updateOne(
          { _id: share._id },
          { $inc: { 'tracking.blockedAttempts': 1 } }
        );

        return NextResponse.json({
          error: 'Incorrect password',
          requiresAuth: true,
          requiresPassword: true,
        }, { status: 401 });
      }
    }

    // ✅ Verify email whitelist if set
if (share.settings.allowedEmails && share.settings.allowedEmails.length > 0) {
  // If no email provided, ask for it
  if (!email) {
    return NextResponse.json({
      requiresAuth: true,
      requiresEmail: true,
      requiresPassword: share.settings.hasPassword,
      settings: {
        customMessage: share.settings.customMessage,
      },
      error: 'Email verification required to access this document',
    }, { status: 401 });
  }

  // Check if email is in whitelist (case-insensitive)
  const emailAllowed = share.settings.allowedEmails.some(
    (allowedEmail: string) => allowedEmail.toLowerCase() === email.toLowerCase()
  );

  if (!emailAllowed) {
    // Track blocked attempt
    await db.collection('shares').updateOne(
      { _id: share._id },
      { $inc: { 'tracking.blockedAttempts': 1 } }
    );

    return NextResponse.json({
      error: `Access denied. Your email (${email}) is not authorized to view this document.`,
      unauthorized: true,
      emailNotAllowed: true,
      requiresAuth: true,
      settings: {
        customMessage: share.settings.customMessage,
      },
    }, { status: 403 });
  }
}

    // ✅ Get document details
    const document = await db.collection('documents').findOne({
      _id: share.documentId,
    });

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found',
        documentDeleted: true
      }, { status: 404 });
    }

// ✅ Check if NDA acceptance is required
if (share.settings.requireNDA) {
  const { ndaAccepted, viewerName, viewerCompany } = body;
  
  if (!ndaAccepted) {
    // ⭐ Process NDA template with variables
    const processedNDA = share.settings.ndaTemplate 
      ? processNdaTemplate(share.settings.ndaTemplate, {
          viewerName: viewerName || '',
          viewerEmail: email || '',
          viewerCompany: viewerCompany || '',
          documentTitle: document.originalFilename,
          ownerName: share.createdBy.name || share.createdBy.email,
          ownerCompany: share.createdBy.company || '',
          viewDate: new Date(),
        })
      : getDefaultNDA();
    
    return NextResponse.json({
      requiresAuth: true,
      requiresNDA: true,
      ndaText: processedNDA,
      requiresEmail: share.settings.requireEmail,
      requiresPassword: share.settings.hasPassword,
      settings: {
        customMessage: share.settings.customMessage,
      },
    }, { status: 401 });
  }
 // ✅ Generate certificate ID
const certificateId = `NDA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // ✅ Track NDA acceptance with FULL details
  const ndaAcceptanceRecord = {
    viewerName: viewerName || 'Unknown',
    viewerEmail: email || 'anonymous',
    viewerCompany: viewerCompany || null,
    timestamp: new Date(),
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    ndaVersion: share.settings.ndaTemplateId || 'custom',
    ndaTextSnapshot: share.settings.ndaTemplate, // Store exact text they accepted
    documentTitle: document.originalFilename,
    geolocation: null, // You can add geolocation API here
    certificateId,
  };

  // ✅ Get owner info
const owner = await db.collection('users').findOne({ id: share.userId });

  
  await db.collection('shares').updateOne(
    { _id: share._id },
    {
      $push: {
        'tracking.ndaAcceptances': ndaAcceptanceRecord
      } as any,
    }
  );

  // ✅ Log NDA acceptance for legal records
  await db.collection('nda_acceptances').insertOne({
    shareId: share._id.toString(),
    documentId: document._id.toString(),
    ownerId: share.userId,
    ...ndaAcceptanceRecord,
    certificateId: `NDA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ownerName: owner?.name || share.createdBy.email, // ⭐ NEW
  ownerCompany: owner?.company || '', // ⭐ NEW
  });
  // ⭐ NEW: Send email notification to owner
if (share.settings.notifyOnView && owner?.email) {
  // Don't await - send in background
  sendNdaAcceptanceNotification({
    ownerEmail: owner.email,
    ownerName: owner.name || owner.email,
    viewerName: viewerName || 'Unknown',
    viewerEmail: email || 'anonymous',
    viewerCompany: viewerCompany || undefined,
    documentTitle: document.originalFilename,
    acceptedAt: new Date(),
    certificateId,
    certificateData: {
      certificateId,
      viewerName: viewerName || 'Unknown',
      viewerEmail: email || 'anonymous',
      viewerCompany: viewerCompany || undefined,
      documentTitle: document.originalFilename,
      ownerName: owner?.name || share.createdBy.email,
      ownerCompany: owner?.company || '',
      acceptedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      ndaTextSnapshot: share.settings.ndaTemplate,
      ndaVersion: share.settings.ndaTemplateId || 'custom',
    },
    documentUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/documents/${document._id.toString()}`,
  }).catch(err => console.error('Failed to send NDA notification:', err));
}

console.log('✅ NDA accepted by:', email);

}

    // ✅ Check if document has Cloudinary PDF URL
    if (!document.cloudinaryPdfUrl) {
      console.error('❌ Document missing cloudinaryPdfUrl:', {
        documentId: document._id.toString(),
        hasCloudinaryOriginalUrl: !!document.cloudinaryOriginalUrl,
        filename: document.originalFilename,
      });
      
      return NextResponse.json({ 
        error: 'Document file not available',
        details: 'PDF file URL is missing from document record'
      }, { status: 404 });
    }

    // ✅ Generate viewer ID (IP + User Agent hash)
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const viewerId = Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);

    // ✅ Check if this is a unique viewer
    const isUniqueViewer = !share.tracking.uniqueViewers.includes(viewerId);

    // ✅ Update tracking
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const trackingUpdate: any = {
      $inc: {
        'tracking.views': 1,
        [`tracking.viewsByDate.${dateKey}`]: 1,
      },
      $set: {
        'tracking.lastViewedAt': now,
        updatedAt: now,
      },
    };

    if (isUniqueViewer) {
      trackingUpdate.$addToSet = {
        'tracking.uniqueViewers': viewerId,
      };
    }

    if (!share.tracking.firstViewedAt) {
      trackingUpdate.$set['tracking.firstViewedAt'] = now;
    }

    if (email) {
      trackingUpdate.$addToSet = {
        ...trackingUpdate.$addToSet,
        'tracking.viewerEmails': email.toLowerCase(),
      };
    }

    await db.collection('shares').updateOne(
      { _id: share._id },
      trackingUpdate
    );

    // ✅ Log view event
    await db.collection('analytics_logs').insertOne({
      documentId: document._id.toString(),
      shareId: share._id.toString(),
      action: 'document_viewed',
      viewerId,
      email: email || null,
      timestamp: now,
      userAgent,
      ip,
      isUniqueView: isUniqueViewer,
    }).catch(err => console.error('Failed to log view:', err));

    // ✅ Send notification if enabled
    if (share.settings.notifyOnView && isUniqueViewer) {
      // TODO: Send email notification to document owner
      console.log(`📧 Notify ${share.createdBy.email}: Document viewed by ${email || 'anonymous'}`);
    }

    // ✅ Generate the proxied PDF URL through your API
    // This handles Cloudinary authentication and access control
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const pdfUrl = `${baseUrl}/api/view/${token}/file`;

    console.log('✅ Sharing document:', {
      documentId: document._id.toString(),
      filename: document.originalFilename,
      shareToken: token.substring(0, 8) + '...',
      pdfUrl,
      hasCloudinaryUrl: !!document.cloudinaryPdfUrl,
    });

    // ✅ Return document data
    return NextResponse.json({
      success: true,
      document: {
        id: document._id.toString(),
        filename: document.originalFilename,
        format: document.originalFormat,
        numPages: document.numPages,

        
        // Use proxied URL that handles Cloudinary authentication
        pdfUrl,
        previewUrls: [],
      },
      settings: {
        allowDownload: share.settings.allowDownload,
        allowPrint: share.settings.allowPrint,
        customMessage: share.settings.customMessage,
      },
      tracking: {
        views: share.tracking.views + 1, // Include this view
        uniqueViewers: share.tracking.uniqueViewers.length + (isUniqueViewer ? 1 : 0),
      },
      certificateId: RTCCertificate || null,
    });

  } catch (error) {
    console.error('❌ View shared document error:', error);
    return NextResponse.json({
      error: 'Failed to load document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ GET - Quick check if share link exists (without tracking view)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const db = await dbPromise;
    const share = await db.collection('shares').findOne(
      { shareToken: token },
      { projection: { shareToken: 1, active: 1, expiresAt: 1 } }
    );

    if (!share) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    const expired = share.expiresAt && new Date(share.expiresAt) < new Date();

    return NextResponse.json({
      exists: true,
      active: share.active,
      expired,
    });

  } catch (error) {
    console.error('❌ Check share link error:', error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}


// ⭐ Default NDA Template
function getDefaultNDA(): string {
  return `NON-DISCLOSURE AGREEMENT

By accessing this document, you acknowledge and agree to the following terms:

1. CONFIDENTIALITY
All information contained in this document is confidential and proprietary. You agree to maintain the confidentiality of this information and not disclose it to any third party without prior written consent.

2. USE RESTRICTIONS
You agree to use this information solely for the purpose for which it was shared and not for any other purpose, including competitive analysis or business development.

3. NO COPYING OR DISTRIBUTION
You will not copy, reproduce, distribute, or share this document or any part of its contents with any third party without explicit authorization.

4. RETURN OR DESTRUCTION
Upon request or completion of the intended purpose, you agree to return or destroy all copies of this document in your possession.

5. LEGAL CONSEQUENCES
You understand that unauthorized disclosure or use of this confidential information may result in legal action, including claims for damages and injunctive relief.

By clicking "I Accept," you acknowledge that you have read, understood, and agree to be bound by these terms.

Date: ${new Date().toLocaleDateString()}`;
}


// ⭐ Process NDA template variables
function processNdaTemplate(
  template: string,
  data: {
    viewerName?: string;
    viewerEmail?: string;
    viewerCompany?: string;
    documentTitle: string;
    ownerName?: string;
    ownerCompany?: string;
    viewDate: Date;
  }
): string {
  let processed = template;
  
  const replacements: Record<string, string> = {
    '{{viewer_name}}': data.viewerName || 'Viewer',
    '{{viewer_email}}': data.viewerEmail || '',
    '{{viewer_company}}': data.viewerCompany || '',
    '{{document_title}}': data.documentTitle,
    '{{owner_name}}': data.ownerName || 'Document Owner',
    '{{owner_company}}': data.ownerCompany || '',
    '{{view_date}}': data.viewDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    '{{view_time}}': data.viewDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
  };
  
  for (const [variable, value] of Object.entries(replacements)) {
    processed = processed.replace(new RegExp(variable, 'g'), value);
  }
  
  return processed;
}