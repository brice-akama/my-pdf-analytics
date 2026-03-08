// app/api/view/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { sendNdaAcceptanceNotification } from '@/lib/email-nda-notification';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  console.log('\n🔵 ===== VIEW API CALLED =====');

  try {
    const { token } = await context.params;
    console.log('🔑 Share token received:', token ? token.slice(0, 8) + '...' : '❌ MISSING');

    if (!token) {
      console.warn('❌ No token provided');
      return NextResponse.json({ error: 'Share token required' }, { status: 400 });
    }

    const db = await dbPromise;

    // ✅ Find share record by token
    const share = await db.collection('shares').findOne({ shareToken: token });

    if (!share) {
      console.warn('❌ Share not found');
      return NextResponse.json({
        error: 'Share link not found or has been revoked',
        notFound: true,
      }, { status: 404 });
    }

    // ✅ Fetch owner profile RIGHT AFTER share is confirmed — needed for senderEmail in all responses
    const ownerProfile = await db.collection('profiles').findOne({ user_id: share.userId });
    console.log('👤 Owner profile:', { found: !!ownerProfile, email: ownerProfile?.email });

    console.log('📦 Share lookup:', {
      found: !!share,
      active: share?.active,
      expiresAt: share?.expiresAt,
      hasPassword: share?.settings?.hasPassword,
      requireEmail: share?.settings?.requireEmail,
      requireNDA: share?.settings?.requireNDA,
      views: share?.tracking?.views,
    });

    // ✅ Check if share is active
    if (!share.active) {
      console.warn('⛔ Share deactivated');
      return NextResponse.json({
        error: 'This share link has been deactivated',
        deactivated: true,
      }, { status: 403 });
    }

    // ✅ Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      console.warn('⏰ Share expired');
      return NextResponse.json({
        error: 'This share link has expired',
        expired: true,
      }, { status: 410 });
    }

    // ✅ Check max views
    if (share.settings.maxViews && share.tracking.views >= share.settings.maxViews) {
      return NextResponse.json({
        error: 'This share link has reached its maximum number of views',
        maxViewsReached: true,
      }, { status: 403 });
    }

    // ✅ Parse request body
    const body = await request.json().catch(() => ({}));
    console.log('📨 Request body:', body);

    const { email, password } = body;
    console.log('👤 Auth data received:', {
      email: email ? email : '❌ none',
      password: password ? '✅ provided' : '❌ none',
    });

    console.log('🎨 [VIEW API] Branding data in share settings:', {
      sharedByName: share.settings.sharedByName,
      logoUrl: share.settings.logoUrl,
    });

    // ✅ Check if email is required
    if (share.settings.requireEmail && !email) {
      return NextResponse.json({
        requiresAuth: true,
        requiresEmail: true,
        requiresPassword: share.settings.hasPassword,
        settings: {
          customMessage: share.settings.customMessage,
          sharedByName: share.settings.sharedByName || null,
          logoUrl: share.settings.logoUrl || null,
          senderEmail: ownerProfile?.email || null,   // ✅ FIXED
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
          sharedByName: share.settings.sharedByName || null,
          logoUrl: share.settings.logoUrl || null,
          senderEmail: ownerProfile?.email || null,   // ✅ FIXED
        },
      }, { status: 401 });
    }

    // ✅ Verify password if provided
    if (share.settings.hasPassword && password) {
      const passwordValid = await bcrypt.compare(password, share.password);
      if (!passwordValid) {
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
      if (!email) {
        return NextResponse.json({
          requiresAuth: true,
          requiresEmail: true,
          requiresPassword: share.settings.hasPassword,
          settings: {
            customMessage: share.settings.customMessage,
            sharedByName: share.settings.sharedByName || null,
            logoUrl: share.settings.logoUrl || null,
            senderEmail: ownerProfile?.email || null,   // ✅ FIXED
          },
          error: 'Email verification required to access this document',
        }, { status: 401 });
      }

      const emailAllowed = share.settings.allowedEmails.some(
        (allowedEmail: string) => allowedEmail.toLowerCase() === email.toLowerCase()
      );

      if (!emailAllowed) {
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
            senderEmail: ownerProfile?.email || null,   // ✅ FIXED
          },
        }, { status: 403 });
      }
    }

    // ✅ Get document details
    const document = await db.collection('documents').findOne({ _id: share.documentId });

    console.log('📄 Document lookup:', {
      found: !!document,
      id: document?._id?.toString(),
      filename: document?.originalFilename,
      hasPdfUrl: !!document?.cloudinaryPdfUrl,
    });

    if (!document) {
      return NextResponse.json({
        error: 'Document not found',
        documentDeleted: true,
      }, { status: 404 });
    }

    // 📜 NDA FLOW
    console.log('📜 NDA check:', { required: share.settings.requireNDA });

    let certificateId: string | null = null;

    if (share.settings.requireNDA) {
      const { ndaAccepted, viewerName, viewerCompany } = body;

      if (!ndaAccepted) {
        // ✅ FIXED: If a PDF agreement was uploaded, send its URL — don't process text
        if (share.settings.ndaAgreementId && share.settings.ndaUrl) {
          console.log('📜 Using uploaded PDF agreement:', share.settings.ndaAgreementId);
          return NextResponse.json({
            requiresAuth: true,
            requiresNDA: true,
            ndaUrl: share.settings.ndaUrl,
            ndaAgreementId: share.settings.ndaAgreementId,
            ndaText: null,
            requiresEmail: share.settings.requireEmail,
            requiresPassword: share.settings.hasPassword,
            settings: {
              customMessage: share.settings.customMessage,
              sharedByName: share.settings.sharedByName || null,
              logoUrl: share.settings.logoUrl || null,
              senderEmail: ownerProfile?.email || null,   // ✅ FIXED
            },
          }, { status: 401 });
        }

        // Fallback: old text-based NDA
        const owner = await db.collection('users').findOne({ id: share.userId });
        const templateText = share.settings.ndaTemplate || getDefaultNDA();
        const processedNDA = processNdaTemplate(templateText, {
          viewerName: viewerName || '',
          viewerEmail: email || '',
          viewerCompany: viewerCompany || '',
          documentTitle: document.originalFilename,
          ownerName: owner?.name || share.createdBy?.name || share.createdBy?.email || 'Document Owner',
          ownerCompany: owner?.company || share.createdBy?.company || '',
          viewDate: new Date(),
        });

        console.log('📜 Processed NDA text preview:', processedNDA.substring(0, 200) + '...');

        return NextResponse.json({
          requiresAuth: true,
          requiresNDA: true,
          ndaText: processedNDA,
          ndaUrl: null,
          requiresEmail: share.settings.requireEmail,
          requiresPassword: share.settings.hasPassword,
          settings: {
            customMessage: share.settings.customMessage,
            sharedByName: share.settings.sharedByName || null,
            logoUrl: share.settings.logoUrl || null,
            senderEmail: ownerProfile?.email || null,   // ✅ FIXED
          },
        }, { status: 401 });
      }

      // ✅ NDA accepted — generate certificate
      certificateId = `NDA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const ndaAcceptanceRecord = {
        viewerName: viewerName || 'Unknown',
        viewerEmail: email || 'anonymous',
        viewerCompany: viewerCompany || null,
        timestamp: new Date(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        ndaVersion: share.settings.ndaTemplateId || 'custom',
        ndaTextSnapshot: share.settings.ndaTemplate,
        documentTitle: document.originalFilename,
        geolocation: null,
        certificateId,
      };

      const owner = await db.collection('users').findOne({ id: share.userId });

      await db.collection('shares').updateOne(
        { _id: share._id },
        { $push: { 'tracking.ndaAcceptances': ndaAcceptanceRecord } as any }
      );

      await db.collection('nda_acceptances').insertOne({
        shareId: share._id.toString(),
        documentId: document._id.toString(),
        ownerId: share.userId,
        ...ndaAcceptanceRecord,
        ownerName: owner?.name || share.createdBy?.name || share.createdBy?.email || 'Document Owner',
        ownerCompany: owner?.company || share.createdBy?.company || '',
      });

      if (share.settings.notifyOnView && owner?.email) {
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
            ownerName: owner?.name || share.createdBy?.email,
            ownerCompany: owner?.company || '',
            acceptedAt: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            ndaTextSnapshot: share.settings.ndaTemplate,
            ndaVersion: share.settings.ndaTemplateId || 'custom',
          },
          documentUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/documents/${document._id.toString()}`,
        }).catch(err => console.error('Failed to send NDA notification:', err));
      }

      console.log('✅ NDA accepted by:', email, '| Certificate:', certificateId);
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
        details: 'PDF file URL is missing from document record',
      }, { status: 404 });
    }

    // ✅ Generate viewer ID
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const viewerId = Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);

    const isUniqueViewer = !share.tracking.uniqueViewers.includes(viewerId);

    // ✅ Update tracking
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];

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
      trackingUpdate.$addToSet = { 'tracking.uniqueViewers': viewerId };
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

    await db.collection('shares').updateOne({ _id: share._id }, trackingUpdate);

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

    if (share.settings.notifyOnView && isUniqueViewer) {
      console.log(`📧 Notify ${share.createdBy.email}: Document viewed by ${email || 'anonymous'}`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const pdfUrl = `${baseUrl}/api/view/${token}/file`;

    // ✅ Return document data
    return NextResponse.json({
      success: true,
      document: {
        id: document._id.toString(),
        filename: document.originalFilename,
        format: document.originalFormat,
        numPages: document.numPages,
        pdfUrl,
        previewUrls: [],
      },
      settings: {
        allowDownload: share.settings.allowDownload,
        allowPrint: share.settings.allowPrint,
        customMessage: share.settings.customMessage,
        sharedByName: share.settings.sharedByName || null,
        logoUrl: share.settings.logoUrl || null,
        senderEmail: ownerProfile?.email || null,   // ✅ already correct here
      },
      tracking: {
        views: share.tracking.views + 1,
        uniqueViewers: share.tracking.uniqueViewers.length + (isUniqueViewer ? 1 : 0),
      },
      certificateId: certificateId || null,
    });

  } catch (error) {
    console.error('❌ View shared document error:', error);
    return NextResponse.json({
      error: 'Failed to load document',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ✅ GET - Quick check if share link exists
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

    return NextResponse.json({ exists: true, active: share.active, expired });

  } catch (error) {
    console.error('❌ Check share link error:', error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}

// ─── Default NDA Template ─────────────────────────────────────────────────────
function getDefaultNDA(): string {
  return `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {{view_date}} between:

DISCLOSING PARTY: {{owner_name}}{{owner_company}} ("Owner")
RECEIVING PARTY: {{viewer_name}} ({{viewer_email}}){{viewer_company}} ("Recipient")

SUBJECT MATTER: "{{document_title}}"

1. CONFIDENTIAL INFORMATION
The Recipient acknowledges that the document titled "{{document_title}}" contains confidential and proprietary information belonging to the Owner.

2. OBLIGATIONS
The Recipient agrees to:
   a) Maintain the confidentiality of all information contained in the document
   b) Not disclose, copy, or distribute any part of the document to third parties without prior written consent
   c) Use the information solely for the purpose for which it was shared and not for any other purpose
   d) Not use the information for competitive purposes

3. NO COPYING OR DISTRIBUTION
You will not copy, reproduce, distribute, or share this document or any part of its contents with any third party without explicit authorization.

4. RETURN OR DESTRUCTION
Upon request or completion of the intended purpose, you agree to return or destroy all copies of this document in your possession.

5. TERM
This Agreement shall remain in effect for a period of two (2) years from {{view_date}}.

6. LEGAL CONSEQUENCES
Unauthorized disclosure or use of this confidential information may result in legal action, including claims for damages and injunctive relief.

ACCEPTANCE:
By clicking "I Accept," {{viewer_name}} acknowledges having read and agreed to these terms on {{view_date}} at {{view_time}}.

Recipient: {{viewer_name}}
Company: {{viewer_company}}
Date: {{view_date}}`;
}

// ─── Process NDA Template Variables ──────────────────────────────────────────
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