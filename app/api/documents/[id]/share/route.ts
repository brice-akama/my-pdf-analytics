// app/api/documents/[id]/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createNotification } from '@/lib/notifications';
import { canAccessDocument } from '@/lib/teamAccess';
// import { sendShareEmailViaGmailOrResend } from '@/lib/emails/shareEmails';

 
interface ShareSettings {
  requireEmail: boolean;
  allowDownload: boolean;
  allowPrint: boolean;
  notifyOnView: boolean;
  hasPassword: boolean;
  maxViews: number | null;
  allowedEmails: string[] | null;
  customMessage: string | null;
  trackDetailedAnalytics: boolean;
  enableWatermark: boolean;
  watermarkText: string | null;
  watermarkPosition: 'top' | 'bottom' | 'center' | 'diagonal';
  requireNDA: boolean;
  ndaText: string | null;
  ndaTemplate: string | null;
  ndaTemplateId: string | null;
  allowForwarding: boolean;
  notifyOnDownload: boolean;
  downloadLimit: number | null;
  viewLimit: number | null;
  selfDestruct: boolean;
  availableFrom: Date | null;
  linkType: 'public' | 'email-gated' | 'domain-restricted';
  sharedByName: string | null;
  sendEmailNotification: boolean;
}

// ✅ POST - Create new share link with advanced settings
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('\n🟢 ===== CREATE SHARE API =====');
    
  try {
    const user = await verifyUserFromRequest(request);
    console.log('👤 User:', user?.email);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    const document = await db.collection('documents').findOne({
      _id: documentId,
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.userId !== user.id) {
      return NextResponse.json({ 
        error: 'Only the document owner can perform this action',
        code: 'NOT_OWNER'
      }, { status: 403 })
    }

    

    const body = await request.json();
    console.log('📨 Request body:', body);
    const {
      requireEmail = false,
      recipientNames = [],
      allowDownload = true,
      allowPrint = true,
      notifyOnView = true,
      password = null,
      expiresIn = 'never',
      ndaAgreementId = null,   
      ndaUrl = null,  
      maxViews = null,
      allowedEmails = [],
      customMessage = null,
      trackDetailedAnalytics = true,
      enableWatermark = false,  
      recipientEmails = [],
      watermarkText = null,
      watermarkPosition = 'bottom',
      requireNDA = false,  
      ndaText = null, 
      ndaTemplateId = null,
      customNdaText = null,
      allowForwarding = true,
      notifyOnDownload = false,
      downloadLimit = null,
      viewLimit = null,
      selfDestruct = false,
      availableFrom = null,
      linkType = 'public',
      sharedByName = null,
      allowedDomain = null,
      sendEmailNotification = false,
      logoUrl = null,
    } = body;

    const emailWhitelist = allowedEmails.length > 0 ? allowedEmails : recipientEmails;

    let ndaTemplate = null;

    if (requireNDA) {
      if (customNdaText) {
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
          await db.collection('nda_templates').updateOne(
            { _id: template._id },
            { $inc: { usageCount: 1 } }
          );
        }
      } else {
        const systemDefault = await db.collection('nda_templates').findOne({
          isSystemDefault: true,
        });
        
        if (systemDefault) {
          ndaTemplate = systemDefault.template;
        }
      }
    }

    const shareRecords = [];
    const shareLinks = [];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (emailWhitelist.length > 0) {
      console.log(`📧 Creating ${emailWhitelist.length} unique share links...`);
      
      for (let i = 0; i < emailWhitelist.length; i++) {
        const recipientEmail = emailWhitelist[i];
        const recipientName = recipientNames[i] || recipientEmail.split('@')[0];
        const shareToken = crypto.randomBytes(32).toString('base64url');
        
        let hashedPassword = null;
        if (password) {
          hashedPassword = await bcrypt.hash(password, 10);
        }
        
        let expiresAt = null;
        if (expiresIn !== 'never') {
          const days = parseInt(expiresIn);
          if (isNaN(days) || days <= 0) {
            return NextResponse.json({ error: 'Invalid expiration period' }, { status: 400 });
          }
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + days);
        }
        
        const shareRecord = {
          documentId,
          userId: user.id,
          shareToken,
          recipientEmail,
          recipientName,
          settings: {
            requireEmail,
            allowDownload,
            allowPrint,
            notifyOnView,
            hasPassword: !!password,
            maxViews: viewLimit,
            allowedEmails: [recipientEmail],
            recipientNames: [recipientName],
            customMessage,
            trackDetailedAnalytics,
            enableWatermark,
            watermarkText,
            ndaAgreementId: ndaAgreementId || null,   
            ndaUrl: ndaUrl || null, 
            watermarkPosition,
            requireNDA,
            ndaText,
            ndaTemplate,
            ndaTemplateId,
            allowForwarding,
            notifyOnDownload,
            downloadLimit,
            viewLimit,
            selfDestruct,
            availableFrom: availableFrom ? new Date(availableFrom) : null,
            linkType: 'email-gated',
            sharedByName,
            allowedDomain: allowedDomain || null,
            logoUrl,
            sendEmailNotification: false, // emails are sent manually by the user
          },
          password: hashedPassword,
          expiresAt,
          tracking: {
            views: 0,
            uniqueViewers: [],
            downloads: 0,
            prints: 0,
            totalTimeSpent: 0,
            timeSpentByViewer: {},
            pageViews: {},
            totalPageViews: 0,
            pageViewsByViewer: {},
            scrollDepth: {},
            scrollDepthByViewer: {},
            lastViewedAt: null,
            firstViewedAt: null,
            viewsByDate: {},
            viewerEmails: [],
            blockedAttempts: 0,
            downloadAttempts: 0,
            blockedDownloads: 0,
            printAttempts: 0,
            blockedPrints: 0,
            downloadEvents: [],
            printEvents: [],
            ndaAcceptances: [],
          },
          active: true,
          deactivatedAt: null,
          deactivatedBy: null,
          deactivationReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: {
            userId: user.id,
            email: user.email,
            plan: user.plan,
          },
          documentSnapshot: {
            filename: document.originalFilename,
            format: document.originalFormat,
            numPages: document.numPages,
            size: document.size,
          },
        };
        
        shareRecords.push(shareRecord);
        shareLinks.push({
          recipientEmail,
          recipientName,
          shareToken,
          shareLink: `${baseUrl}/view/${shareToken}`,
        });
      }
    } else {
      console.log('📧 Creating 1 public share link...');
      
      const shareToken = crypto.randomBytes(32).toString('base64url');
      let hashedPassword = null;
      if (password) hashedPassword = await bcrypt.hash(password, 10);
      
      let expiresAt = null;
      if (expiresIn !== 'never') {
        const days = parseInt(expiresIn);
        if (isNaN(days) || days <= 0) {
          return NextResponse.json({ error: 'Invalid expiration period' }, { status: 400 });
        }
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }
      
      const shareRecord = {
        documentId,
        userId: user.id,
        shareToken,
        recipientEmail: null,
        recipientName: null,
        settings: {
          requireEmail,
          allowDownload,
          allowPrint,
          notifyOnView,
          hasPassword: !!password,
          maxViews: viewLimit,
          allowedEmails: null,
          recipientNames: null,
          customMessage,
          trackDetailedAnalytics,
          enableWatermark,
          watermarkText,
          watermarkPosition,
          requireNDA,
          ndaText,
          ndaTemplate,
          ndaTemplateId,
          ndaAgreementId: ndaAgreementId || null,
          ndaUrl: ndaUrl || null,
          allowForwarding,
          notifyOnDownload,
          downloadLimit,
          viewLimit,
          selfDestruct,
          availableFrom: availableFrom ? new Date(availableFrom) : null,
          linkType,
          sharedByName,
          allowedDomain: allowedDomain || null,
          logoUrl,
          sendEmailNotification: false,
        },
        password: hashedPassword,
        expiresAt,
        tracking: {
          views: 0,
          uniqueViewers: [],
          downloads: 0,
          prints: 0,
          totalTimeSpent: 0,
          timeSpentByViewer: {},
          pageViews: {},
          totalPageViews: 0,
          pageViewsByViewer: {},
          scrollDepth: {},
          scrollDepthByViewer: {},
          lastViewedAt: null,
          firstViewedAt: null,
          viewsByDate: {},
          viewerEmails: [],
          blockedAttempts: 0,
          downloadAttempts: 0,
          blockedDownloads: 0,
          printAttempts: 0,
          blockedPrints: 0,
          downloadEvents: [],
          printEvents: [],
          ndaAcceptances: [],
        },
        active: true,
        deactivatedAt: null,
        deactivatedBy: null,
        deactivationReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: {
          userId: user.id,
          email: user.email,
          plan: user.plan,
        },
        documentSnapshot: {
          filename: document.originalFilename,
          format: document.originalFormat,
          numPages: document.numPages,
          size: document.size,
        },
      };
      
      shareRecords.push(shareRecord);
      shareLinks.push({
        recipientEmail: null,
        recipientName: 'Public link',
        shareToken,
        shareLink: `${baseUrl}/view/${shareToken}`,
      });
    }

    const result = await db.collection('shares').insertMany(shareRecords);
    const insertedIds = Object.values(result.insertedIds).map(id => id.toString());

    console.log(`✅ Created ${shareRecords.length} share link(s)`);

    // ── Notifications only — email sending removed, users send links manually ──
    const profile = await db.collection('profiles').findOne({ user_id: user.id });

    for (let i = 0; i < shareRecords.length; i++) {
      const share = shareRecords[i];

      createNotification({
        userId: user.id,
        type: 'share',
        title: 'Share Link Created',
        message: share.recipientEmail
          ? `Share link created for ${share.recipientEmail}`
          : `Public share link created for "${document.originalFilename}"`,
        documentId: documentId.toString(),
        metadata: {
          shareToken: share.shareToken,
          recipientEmail: share.recipientEmail,
        },
      }).catch((err: unknown) =>
        console.error('⚠️ Notification error (non-fatal):', err)
      );

      // ── Email sending is intentionally disabled ────────────────────────────
      // Users copy the generated link and send it manually via their own email.
      // This avoids spam filter issues entirely.
      //
      // To re-enable in future:
      //
      // if (sendEmailNotification && share.recipientEmail) {
      //   try {
      //     await Promise.race([
      //       sendShareEmailViaGmailOrResend({
      //         userId: user.id,
      //         recipientEmail: share.recipientEmail,
      //         senderName: profile?.full_name || user.email.split('@')[0],
      //         senderEmail: user.email,
      //         documentName: document.originalFilename,
      //         shareLink: shareLinks[i].shareLink,
      //         customMessage,
      //         expiresAt: share.expiresAt,
      //         sharedByName,
      //         logoUrl,
      //       }),
      //       new Promise<never>((_, reject) =>
      //         setTimeout(() => reject(new Error('Email timeout after 8s')), 8000)
      //       ),
      //     ]);
      //     console.log(`✅ Email sent to: ${share.recipientEmail}`);
      //   } catch (emailError: unknown) {
      //     const msg = emailError instanceof Error ? emailError.message : 'Unknown error';
      //     console.error(`⚠️ Email failed for ${share.recipientEmail} (non-fatal): ${msg}`);
      //   }
      // }
    }

    await db.collection('documents').updateOne(
      { _id: documentId },
      {
        $inc: { 'tracking.shares': shareRecords.length },
        $set: { updatedAt: new Date() },
      }
    );

    for (let i = 0; i < shareRecords.length; i++) {
      await db.collection('analytics_logs').insertOne({
        documentId: id,
        action: 'share_created',
        userId: user.id,
        shareId: insertedIds[i],
        shareToken: shareRecords[i].shareToken,
        recipientEmail: shareRecords[i].recipientEmail,
        settings: {
          requireEmail,
          allowDownload,
          hasPassword: !!password,
          expiresIn,
          maxViews: viewLimit,
        },
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      }).catch(err => console.error('Failed to log share creation:', err));
    }

    if (shareLinks.length === 1 && !shareLinks[0].recipientEmail) {
      return NextResponse.json({
        success: true,
        shareLink: shareLinks[0].shareLink,
        share: {
          id: insertedIds[0],
          shareLink: shareLinks[0].shareLink,
          shareToken: shareLinks[0].shareToken,
          shortLink: `${baseUrl}/s/${shareLinks[0].shareToken.substring(0, 8)}`,
          qrCode: `${baseUrl}/api/qr?url=${encodeURIComponent(shareLinks[0].shareLink)}`,
          settings: shareRecords[0].settings,
          document: {
            id: document._id.toString(),
            filename: document.originalFilename,
            format: document.originalFormat,
            numPages: document.numPages,
          },
          createdAt: shareRecords[0].createdAt,
        },
        message: 'Share link created successfully',
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: true,
        shareLinks: shareLinks.map((link, i) => ({
          recipientEmail: link.recipientEmail,
          recipientName: link.recipientName,
          shareLink: link.shareLink,
          shareToken: link.shareToken,
          id: insertedIds[i],
        })),
        totalLinks: shareLinks.length,
        message: `${shareLinks.length} share link${shareLinks.length > 1 ? 's' : ''} created successfully`,
      }, { status: 201 });
    }

  } catch (error) {
    console.error('❌ Create share link error:', error);
    return NextResponse.json({
      error: 'Failed to create share link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

//  GET - List all share links for a document
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserFromRequest(request);
    console.log('👤 User requesting shares:', user?.id, user?.email);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    console.log('📌 Document ID param:', id);

    if (!ObjectId.isValid(id)) {
      console.warn('❌ Invalid document ID');
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = await dbPromise;
    const documentId = new ObjectId(id);

    const document = await db.collection('documents').findOne({
      
      _id: documentId,
    })
    console.log('📋 Document found:', !!document);
    console.log('📋 Document owner:', document?.userId);
    console.log('📋 sharedToTeam:', document?.sharedToTeam);
    console.log('📋 workspaceId:', document?.workspaceId);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const hasAccess = await canAccessDocument(db, document, user.id);
    console.log('🔐 Has access:', hasAccess);
if (!hasAccess) {
  return NextResponse.json({ 
    error: 'Access denied',
    code: 'NO_ACCESS'
  }, { status: 403 });
}

   const shares = await db.collection('shares')
  .find({ documentId })
  .sort({ createdAt: -1 })
  .toArray();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://docmetrics.io';
    const formattedShares = await Promise.all(
      shares.map(async (share) => {
        const pageLogs = await db.collection('analytics_logs').find({
          documentId: id,
          action: 'page_view',
          ...(share.recipientEmail ? { email: share.recipientEmail } : {}),
        }).toArray();

        const totalTimeSpent = pageLogs.reduce(
          (sum: number, log: any) => sum + (log.viewTime || 0), 
          0
        );

        return {
          id: share._id.toString(),
          shareLink: `${baseUrl}/view/${share.shareToken}`,
          shareToken: share.shareToken,
          recipientEmail: share.recipientEmail || null,
          recipientName: share.recipientName || null,
          active: share.active,
          settings: {
            requireEmail: share.settings.requireEmail,
            allowDownload: share.settings.allowDownload,
            allowPrint: share.settings.allowPrint,
            hasPassword: share.settings.hasPassword,
            maxViews: share.settings.maxViews,
            allowedEmails: share.settings.allowedEmails || [],
            allowForwarding: share.settings.allowForwarding ?? true,
            notifyOnDownload: share.settings.notifyOnDownload ?? false,
            selfDestruct: share.settings.selfDestruct ?? false,
            enableWatermark: share.settings.enableWatermark ?? false,
            watermarkText: share.settings.watermarkText || '',
            watermarkPosition: share.settings.watermarkPosition || 'bottom',
            requireNDA: share.settings.requireNDA ?? false,
            ndaTemplateId: share.settings.ndaTemplateId || '',
            customMessage: share.settings.customMessage || '',
            sharedByName: share.settings.sharedByName || '',
            logoUrl: share.settings.logoUrl || '',
            viewLimit: share.settings.viewLimit ?? undefined,
            downloadLimit: share.settings.downloadLimit ?? undefined,
            linkType: share.settings.linkType || 'public',
            allowedDomain: share.settings.allowedDomain || null,
            expiresIn: share.expiresAt
              ? Math.ceil((new Date(share.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : 0,
          },
          tracking: {
            views: share.tracking.views,
            uniqueViewers: share.tracking.uniqueViewers.length,
            downloads: share.tracking.downloads,
            prints: share.tracking.prints,
            totalTimeSpent,
            lastViewedAt: share.tracking.lastViewedAt,
            firstViewedAt: share.tracking.firstViewedAt,
          },
          expiresAt: share.expiresAt,
          expired: share.expiresAt ? new Date(share.expiresAt) < new Date() : false,
          maxViewsReached: share.settings.maxViews ? share.tracking.views >= share.settings.maxViews : false,
          createdAt: share.createdAt,
          updatedAt: share.updatedAt,
        };
      })
    );

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
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    console.log('📨 Request body:', body);
    const { shareId, active, settings } = body;

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 });
    }

    const db = await dbPromise;

    const share = await db.collection('shares').findOne({
      _id: new ObjectId(shareId),
      userId: user.id,
    });

    if (!share) {
      return NextResponse.json({ 
        error: 'Only the document owner can perform this action',
        code: 'NOT_OWNER'
      }, { status: 403 })
    }

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

    await db.collection('shares').updateOne(
      { _id: new ObjectId(shareId) },
      { $set: updateFields }
    );

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
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId || !ObjectId.isValid(shareId)) {
      return NextResponse.json({ error: 'Valid share ID required' }, { status: 400 });
    }

    const db = await dbPromise;

    const share = await db.collection('shares').findOne({
      _id: new ObjectId(shareId),
      userId: user.id,
    });

    if (!share) {
      return NextResponse.json({ 
        error: 'Only the document owner can perform this action',
        code: 'NOT_OWNER'
      }, { status: 403 })
    }

    await db.collection('shares').deleteOne({ _id: new ObjectId(shareId) });

    await db.collection('documents').updateOne(
      { _id: share.documentId },
      {
        $pull: { shareLinks: { id: { $eq: shareId } } as any },
        $inc: { 'tracking.shares': -1 },
        $set: { updatedAt: new Date() },
      }
    );

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