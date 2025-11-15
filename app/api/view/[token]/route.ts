// app/api/view/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

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
      if (!email || !share.settings.allowedEmails.includes(email.toLowerCase())) {
        return NextResponse.json({
          error: 'Your email is not authorized to view this document',
          unauthorized: true,
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