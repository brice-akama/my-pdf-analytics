// app/api/documents/[id]/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ✅ POST - Create new share link with advanced settings
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Verify user via HTTP-only cookie
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Await params (Next.js 15)
    const { id } = await context.params;

    // ✅ Validate document ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // ✅ Verify ownership and check document exists
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ✅ Parse share settings
    const body = await request.json();
    const {
      requireEmail = false,
      allowDownload = true,
      allowPrint = true,
      notifyOnView = true,
      password = null,
      expiresIn = 'never', // 'never', '1', '7', '30', '90'
      maxViews = null, // null = unlimited, number = max views
      allowedEmails = [], // Whitelist specific emails
      customMessage = null, // Message shown to viewers
      trackDetailedAnalytics = true, // Track page views, time spent, etc.
      enableWatermark = false,  
      recipientEmails = [],
  watermarkText = null,
   watermarkPosition = 'bottom',
   requireNDA = false,  
  ndaText = null, 
  ndaTemplateId = null, // ⭐ NEW - Template ID instead of raw text
  customNdaText = null,
    } = body;

    // ⭐ Use whichever one has data
const emailWhitelist = allowedEmails.length > 0 ? allowedEmails : recipientEmails;

    // ✅ Check plan limits
    const shareLimit = user.plan === 'premium' ? 100 : 10; // Premium = 100 shares, Free = 10
    const existingShares = await db.collection('shares').countDocuments({
      userId: user.id,
      active: true,
    });

    if (existingShares >= shareLimit) {
      return NextResponse.json({
        error: `Share limit reached. ${user.plan === 'free' ? 'Upgrade to Premium for more shares.' : 'Maximum shares reached.'}`,
        limit: shareLimit,
        current: existingShares,
        upgrade: user.plan === 'free',
      }, { status: 403 });
    }

    // ✅ Validate premium features
    // Declare ndaTemplate so it's always in scope
    let ndaTemplate = null;

    if (user.plan === 'free') {
      if (password) {
        return NextResponse.json({
          error: 'Password protection requires Premium plan',
          upgrade: true,
        }, { status: 403 });
      }
     // ⭐ TESTING: Email whitelist disabled for testing
// if (emailWhitelist.length > 0) {
//   return NextResponse.json({
//     error: 'Email whitelist requires Premium plan',
//     upgrade: true,
//   }, { status: 403 });
// }

// for TESTING purposes only DISABLE NDA check
// ⭐ NEW: NDA check
//  if (requireNDA) {
 //   return NextResponse.json({
  //    error: 'NDA requirement requires Premium plan',
  //    upgrade: true,
 //   }, { status: 403 });
 // }
    }

    //   Process NDA template
    if (requireNDA) {
      if (customNdaText) {
        // User provided custom NDA text
        ndaTemplate = customNdaText;
      } else if (ndaTemplateId && ObjectId.isValid(ndaTemplateId)) {
  const template = await db.collection('nda_templates').findOne({
    _id: new ObjectId(ndaTemplateId),
          $or: [
            { userId: user.id },
            { isSystemDefault: true }
          ]
        });
        
        if (template) {
          ndaTemplate = template.template;
          
          // Increment usage count
          await db.collection('nda_templates').updateOne(
            { _id: template._id },
            { $inc: { usageCount: 1 } }
          );
        }
      } else {
        // Use system default
        const systemDefault = await db.collection('nda_templates').findOne({
          isSystemDefault: true,
        });
        
        if (systemDefault) {
          ndaTemplate = systemDefault.template;
        }
      }
    }
   
      if (maxViews) {
        return NextResponse.json({
          error: 'View limits require Premium plan',
          upgrade: true,
        }, { status: 403 });
      }
      // ⭐ TESTING: Watermark check disabled for testing
// if (enableWatermark) {
//   return NextResponse.json({
//     error: 'Watermarking requires Premium plan',
//     upgrade: true,
//   }, { status: 403 });
// }

    

    // ✅ Generate secure share token (URL-safe)
    const shareToken = crypto.randomBytes(32).toString('base64url');

    // ✅ Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // ✅ Calculate expiry date
    let expiresAt = null;
    if (expiresIn !== 'never') {
      const days = parseInt(expiresIn);
      if (isNaN(days) || days <= 0) {
        return NextResponse.json({
          error: 'Invalid expiration period',
        }, { status: 400 });
      }
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    // ✅ Create comprehensive share record
    const shareRecord = {
      documentId,
      userId: user.id,
      shareToken,
      
      // Settings
      settings: {
        requireEmail,
        allowDownload,
        allowPrint,
        notifyOnView,
        hasPassword: !!password,
        maxViews,
        allowedEmails: emailWhitelist.length > 0 ? emailWhitelist : null,
        customMessage,
        trackDetailedAnalytics,
        enableWatermark,  
  watermarkText,  
  watermarkPosition,  
  requireNDA,  
  ndaText,  
  ndaTemplate, // ⭐ Store template (not just boolean)
  ndaTemplateId
      },

      // Security
      password: hashedPassword,
      expiresAt,

      // Tracking
     // ✅ UPDATED: Add this to your share creation in app/api/documents/[id]/share/route.ts
// Replace the tracking object in the shareRecord with this:

tracking: {
  // Basic counts
  views: 0,
  uniqueViewers: [],
  downloads: 0,
  prints: 0,
  
  // Time tracking - ✅ Initialize with 0 instead of null
  totalTimeSpent: 0,
  timeSpentByViewer: {},
  
  // Page tracking
  pageViews: {},
  totalPageViews: 0,
  pageViewsByViewer: {},
  
  // Scroll tracking
  scrollDepth: {},
  scrollDepthByViewer: {},
  
  // Timestamps
  lastViewedAt: null,
  firstViewedAt: null,
  
  // Date-based views
  viewsByDate: {},
  
  // Email tracking
  viewerEmails: [],
  
  // Attempt tracking
  blockedAttempts: 0,
  downloadAttempts: 0,
  blockedDownloads: 0,
  printAttempts: 0,
  blockedPrints: 0,
  
  // Event arrays
  downloadEvents: [],
  printEvents: [],
  ndaAcceptances: [],
  
},

      // Status
      active: true,
      deactivatedAt: null,
      deactivatedBy: null,
      deactivationReason: null,

      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: {
        userId: user.id,
        email: user.email,
        plan: user.plan,
      },

      // Document snapshot (for analytics)
      documentSnapshot: {
        filename: document.originalFilename,
        format: document.originalFormat,
        numPages: document.numPages,
        size: document.size,
      },
    };

    // ✅ Insert share record
    const result = await db.collection('shares').insertOne(shareRecord);

    // ✅ Update document's shareLinks array
    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $push: {
          shareLinks: {
            id: result.insertedId.toString(),
            token: shareToken,
            createdAt: new Date(),
            expiresAt,
            active: true,
          }
        },
        $inc: { 'tracking.shares': 1 },
        $set: { updatedAt: new Date() },
      } as any
    );

    // ✅ Log share creation
    await db.collection('analytics_logs').insertOne({
      documentId: id,
      action: 'share_created',
      userId: user.id,
      shareId: result.insertedId.toString(),
      shareToken,
      settings: {
        requireEmail,
        allowDownload,
        hasPassword: !!password,
        expiresIn,
        maxViews,
      },
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }).catch(err => console.error('Failed to log share creation:', err));

    // ✅ Generate share link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareLink = `${baseUrl}/view/${shareToken}`;

    // ✅ Return comprehensive response
    return NextResponse.json({
      success: true,
      shareLink, // This is what the frontend expects
      share: {
        id: result.insertedId.toString(),
        shareLink,
        shareToken,
        shortLink: `${baseUrl}/s/${shareToken.substring(0, 8)}`, // Short URL
        qrCode: `${baseUrl}/api/qr?url=${encodeURIComponent(shareLink)}`, // QR code endpoint
        settings: {
          requireEmail,
          allowDownload,
          allowPrint,
          notifyOnView,
          hasPassword: !!password,
          expiresAt,
          maxViews,
          allowedEmails: allowedEmails.length > 0 ? allowedEmails.length : null,
        },
        document: {
          id: document._id.toString(),
          filename: document.originalFilename,
          format: document.originalFormat,
          numPages: document.numPages,
        },
        createdAt: shareRecord.createdAt,
      },
      message: 'Share link created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create share link error:', error);
    return NextResponse.json({
      error: 'Failed to create share link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ GET - List all share links for a document
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Await params
    const { id } = await context.params;

    // ✅ Validate document ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    // ✅ Verify ownership
    const document = await db.collection('documents').findOne({
      _id: documentId,
      userId: user.id,
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ✅ Fetch all share links for this document
    const shares = await db.collection('shares')
      .find({ documentId, userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // ✅ Format share links with analytics
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const formattedShares = shares.map(share => ({
      id: share._id.toString(),
      shareLink: `${baseUrl}/view/${share.shareToken}`,
      shareToken: share.shareToken,
      active: share.active,
      
      settings: {
        requireEmail: share.settings.requireEmail,
        allowDownload: share.settings.allowDownload,
        allowPrint: share.settings.allowPrint,
        hasPassword: share.settings.hasPassword,
        maxViews: share.settings.maxViews,
        allowedEmails: share.settings.allowedEmails?.length || 0,
      },

      tracking: {
        views: share.tracking.views,
        uniqueViewers: share.tracking.uniqueViewers.length,
        downloads: share.tracking.downloads,
        prints: share.tracking.prints,
        lastViewedAt: share.tracking.lastViewedAt,
        firstViewedAt: share.tracking.firstViewedAt,
      },

      expiresAt: share.expiresAt,
      expired: share.expiresAt ? new Date(share.expiresAt) < new Date() : false,
      maxViewsReached: share.settings.maxViews ? share.tracking.views >= share.settings.maxViews : false,
      
      createdAt: share.createdAt,
      updatedAt: share.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      shares: formattedShares,
      total: formattedShares.length,
      active: formattedShares.filter(s => s.active && !s.expired && !s.maxViewsReached).length,
      document: {
        id: document._id.toString(),
        filename: document.originalFilename,
      }
    });

  } catch (error) {
    console.error('❌ Fetch share links error:', error);
    return NextResponse.json({
      error: 'Failed to fetch share links',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ PATCH - Update share link settings
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Await params
    const { id } = await context.params;

    const body = await request.json();
    const { shareId, active, settings } = body;

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 });
    }

    const db = await dbPromise;

    // ✅ Verify ownership of share link
    const share = await db.collection('shares').findOne({
      _id: new ObjectId(shareId),
      userId: user.id,
    });

    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // ✅ Build update object
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (active !== undefined) {
      updateFields.active = active;
      if (!active) {
        updateFields.deactivatedAt = new Date();
        updateFields.deactivatedBy = user.id;
        updateFields.deactivationReason = body.reason || 'Manually deactivated';
      }
    }

    if (settings) {
      if (settings.allowDownload !== undefined) updateFields['settings.allowDownload'] = settings.allowDownload;
      if (settings.allowPrint !== undefined) updateFields['settings.allowPrint'] = settings.allowPrint;
      if (settings.notifyOnView !== undefined) updateFields['settings.notifyOnView'] = settings.notifyOnView;
    }

    // ✅ Update share link
    await db.collection('shares').updateOne(
      { _id: new ObjectId(shareId) },
      { $set: updateFields }
    );

    // ✅ Log update
    await db.collection('analytics_logs').insertOne({
      documentId: id,
      action: 'share_updated',
      userId: user.id,
      shareId,
      changes: updateFields,
      timestamp: new Date(),
    }).catch(err => console.error('Failed to log share update:', err));

    return NextResponse.json({
      success: true,
      message: 'Share link updated successfully',
    });

  } catch (error) {
    console.error('❌ Update share link error:', error);
    return NextResponse.json({
      error: 'Failed to update share link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ DELETE - Delete/revoke share link
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Verify user
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Await params
    const { id } = await context.params;

    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId || !ObjectId.isValid(shareId)) {
      return NextResponse.json({ error: 'Valid share ID required' }, { status: 400 });
    }

    const db = await dbPromise;

    // ✅ Verify ownership
    const share = await db.collection('shares').findOne({
      _id: new ObjectId(shareId),
      userId: user.id,
    });

    if (!share) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    // ✅ Delete share link
    await db.collection('shares').deleteOne({ _id: new ObjectId(shareId) });

    // ✅ Remove from document's shareLinks array
    await db.collection('documents').updateOne(
      { _id: share.documentId },
      {
        $pull: { shareLinks: { id: { $eq: shareId } } as any },
        $inc: { 'tracking.shares': -1 },
        $set: { updatedAt: new Date() },
      }
    );

    // ✅ Log deletion
    await db.collection('analytics_logs').insertOne({
      documentId: id,
      action: 'share_deleted',
      userId: user.id,
      shareId,
      shareToken: share.shareToken,
      shareStats: {
        views: share.tracking.views,
        downloads: share.tracking.downloads,
      },
      timestamp: new Date(),
    }).catch(err => console.error('Failed to log share deletion:', err));

    return NextResponse.json({
      success: true,
      message: 'Share link deleted successfully',
      deletedShare: {
        id: shareId,
        views: share.tracking.views,
        downloads: share.tracking.downloads,
      }
    });

  } catch (error) {
    console.error('❌ Delete share link error:', error);
    return NextResponse.json({
      error: 'Failed to delete share link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}