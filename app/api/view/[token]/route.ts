// app/api/view/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { sendNdaAcceptanceNotification } from '@/lib/email-nda-notification';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// Send NDA certificate to the recipient (viewer) after they sign
// Uses Resend directly — viewer has no Gmail/Outlook integration
// ─────────────────────────────────────────────────────────────────────────────
async function sendRecipientNdaEmail({
  viewerEmail,
  viewerName,
  documentTitle,
  certificateId,
  senderName,
  senderEmail,
  token,
  baseUrl,
}: {
  viewerEmail: string;
  viewerName: string;
  documentTitle: string;
  certificateId: string;
  senderName: string;
  senderEmail: string | null;
  token: string;
  baseUrl: string;
}) {
  const certificateUrl = `${baseUrl}/api/nda-certificates/${certificateId}`;
  // ✅ Link directly to the agreement PDF proxy — no auth wall
  const agreementUrl = `${baseUrl}/api/view/${token}/agreement`;

  await resend.emails.send({
    // ✅ From the actual sender's name, not "via DocMetrics"
    from: senderEmail
      ? `${senderName} <support@docmetrics.io>`
      : `${senderName} <support@docmetrics.io>`,
    replyTo: senderEmail || undefined,
    to: [viewerEmail],
    subject: `Your signed NDA — ${documentTitle}`,
    html: buildRecipientNdaHtml({
      viewerName,
      documentTitle,
      senderName,
      certificateId,
      certificateUrl,
      agreementUrl,
    }),
  });
}

function buildRecipientNdaHtml({
  viewerName,
  documentTitle,
  senderName,
  certificateId,
  certificateUrl,
  agreementUrl,
}: {
  viewerName: string;
  documentTitle: string;
  senderName: string;
  certificateId: string;
  certificateUrl: string;
  agreementUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your signed NDA</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <tr>
            <td>
              <p style="font-size:15px; color:#374151; margin:0 0 16px; line-height:1.6;">
                Hi ${viewerName || 'there'},
              </p>
              <p style="font-size:15px; color:#374151; margin:0 0 20px; line-height:1.6;">
                You've successfully signed the NDA for <strong>${documentTitle}</strong>,
                shared by <strong>${senderName}</strong>.
              </p>

              <!-- Certificate card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="border:1px solid #e5e7eb; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0; font-size:13px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; font-weight:500;">Certificate ID</p>
                    <p style="margin:6px 0 0; font-size:15px; color:#111827; font-weight:600; font-family:monospace;">${certificateId}</p>
                  </td>
                </tr>
              </table>

              <!-- Download certificate CTA -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
                <tr>
                  <td style="border-radius:6px; background:#111827;">
                    <a href="${certificateUrl}"
                      style="display:inline-block; padding:12px 28px; font-size:15px; font-weight:500; color:#ffffff; text-decoration:none; border-radius:6px;">
                      Download Your Certificate
                    </a>
                  </td>
                </tr>
              </table>

              <!-- View agreement — goes directly to the PDF, no auth wall -->
              <p style="font-size:14px; color:#6b7280; margin:0 0 32px;">
                You can also
                <a href="${agreementUrl}" style="color:#4f46e5; text-decoration:none;">view the signed agreement here</a>.
              </p>

              <hr style="border:none; border-top:1px solid #f3f4f6; margin:0 0 24px;" />

              <p style="font-size:12px; color:#9ca3af; margin:0; line-height:1.6;">
                This is a record of your NDA acceptance. Keep this email for your records.
                Powered by <a href="https://docmetrics.io" style="color:#9ca3af; text-decoration:none;">DocMetrics</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────

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
          senderEmail: ownerProfile?.email || null,
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
          senderEmail: ownerProfile?.email || null,
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
            senderEmail: ownerProfile?.email || null,
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
            senderEmail: ownerProfile?.email || null,
          },
        }, { status: 403 });
      }
    }

    // ✅ Domain restriction check
    if (share.settings.linkType === 'domain-restricted' && share.settings.allowedDomain) {
      if (!email) {
        return NextResponse.json({
          requiresAuth: true,
          requiresEmail: true,
          settings: {
            customMessage: share.settings.customMessage,
            sharedByName: share.settings.sharedByName || null,
            logoUrl: share.settings.logoUrl || null,
            senderEmail: ownerProfile?.email || null,
          },
          error: 'Email required to verify your domain',
        }, { status: 401 });
      }

      const viewerDomain = email.split('@')[1]?.toLowerCase();

      const blockedDomains = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','aol.com','protonmail.com','mail.com','zoho.com','yandex.com','gmx.com','live.com','msn.com'];
      if (blockedDomains.includes(viewerDomain)) {
        return NextResponse.json({
          error: 'Domain restriction requires a company email address. Personal email providers are not accepted.',
          unauthorized: true,
          requiresAuth: true,
          settings: {
            customMessage: share.settings.customMessage,
            senderEmail: ownerProfile?.email || null,
          },
        }, { status: 403 });
      }

      if (viewerDomain !== share.settings.allowedDomain.toLowerCase()) {
        return NextResponse.json({
          error: `Access restricted to @${share.settings.allowedDomain} email addresses only.`,
          unauthorized: true,
          requiresAuth: true,
          settings: {
            customMessage: share.settings.customMessage,
            senderEmail: ownerProfile?.email || null,
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

    let { ndaAccepted, viewerName, viewerCompany } = body;

    // ✅ Check if this viewer already signed — skip NDA gate entirely
    if (share.settings.requireNDA && !ndaAccepted && email) {
      const alreadySigned = await db.collection('nda_acceptances').findOne({
        shareId: share._id.toString(),
        viewerEmail: email.toLowerCase(),
      });
      if (alreadySigned) {
        console.log('✅ NDA already signed by:', email, '— skipping gate');
        ndaAccepted = true;
        viewerName = viewerName || alreadySigned.viewerName;
        viewerCompany = viewerCompany || alreadySigned.viewerCompany;
      }
    }

    if (share.settings.requireNDA) {
      if (!ndaAccepted) {
        // ── Resolve agreement URL ────────────────────────────────────────────
        // Priority 1: ndaAgreementId on share settings → look up agreements collection
        // Priority 2: ndaUrl already stored directly on share settings
        // Priority 3: ndaAgreementUrl alternate field name
        let resolvedNdaAgreementId: string | null = share.settings.ndaAgreementId || null;
        let resolvedNdaUrl: string | null =
          share.settings.ndaUrl ||
          share.settings.ndaAgreementUrl ||
          null;

        // If we have an agreement ID but no URL, fetch the URL from the agreements collection
        if (resolvedNdaAgreementId && !resolvedNdaUrl) {
          try {
            const { ObjectId } = await import('mongodb');
            const agreementDoc = await db.collection('agreements').findOne({
              _id: new ObjectId(resolvedNdaAgreementId),
            });
            if (agreementDoc?.cloudinaryPdfUrl) {
              resolvedNdaUrl = agreementDoc.cloudinaryPdfUrl;
              console.log('📜 Resolved NDA URL from agreements collection:', resolvedNdaUrl);
            }
          } catch (lookupErr) {
            console.warn('⚠️ Could not look up agreement by ID:', lookupErr);
          }
        }

        if (resolvedNdaAgreementId || resolvedNdaUrl) {
          console.log('📜 NDA PDF resolved:', {
            ndaAgreementId: resolvedNdaAgreementId,
            hasUrl: !!resolvedNdaUrl,
          });
          return NextResponse.json({
            requiresAuth: true,
            requiresNDA: true,
            // Always proxy through our agreement route — keeps Cloudinary URL private
            ndaUrl: `/api/view/${token}/agreement`,
            ndaAgreementId: resolvedNdaAgreementId,
            ndaText: null,
            requiresEmail: share.settings.requireEmail,
            requiresPassword: share.settings.hasPassword,
            settings: {
              customMessage: share.settings.customMessage,
              sharedByName: share.settings.sharedByName || null,
              logoUrl: share.settings.logoUrl || null,
              senderEmail: ownerProfile?.email || null,
            },
          }, { status: 401 });
        }

        console.warn('📜 NDA required but no agreement PDF found anywhere');
        return NextResponse.json({
          requiresAuth: true,
          requiresNDA: true,
          ndaError: 'No agreement document has been configured for this share link. Please contact the sender for access.',
          ndaUrl: null,
          requiresEmail: share.settings.requireEmail,
          requiresPassword: share.settings.hasPassword,
          settings: {
            customMessage: share.settings.customMessage,
            sharedByName: share.settings.sharedByName || null,
            logoUrl: share.settings.logoUrl || null,
            senderEmail: ownerProfile?.email || null,
          },
        }, { status: 401 });
      }

// ✅ NDA accepted — generate certificate ID
certificateId = `NDA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

// Get viewer IP for geolocation
const ip = request.headers.get('x-forwarded-for') ||
  request.headers.get('x-real-ip') ||
  'unknown';

// Reverse geocode the viewer's IP to get state + country
let viewerLocation: string | undefined;
try {
  const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,countryCode`);
  if (geoRes.ok) {
    const geo = await geoRes.json();
    if (geo.city || geo.regionName) {
      viewerLocation = [geo.city || geo.regionName, geo.countryCode].filter(Boolean).join(', ');
    }
  }
} catch { /* non-fatal */ }

const ndaAcceptanceRecord = {
  viewerName: viewerName || 'Unknown',
  viewerEmail: email || 'anonymous',
  viewerCompany: viewerCompany || null,
  timestamp: new Date(),
  ip: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        ndaVersion: share.settings.ndaTemplateId || 'custom',
        ndaTextSnapshot: share.settings.ndaTemplate,
        documentTitle: document.originalFilename,
         geolocation: viewerLocation || null,
        certificateId,
      };

      const owner = await db.collection('users').findOne({ id: share.userId });

      // ✅ Push to share tracking (unchanged)
      await db.collection('shares').updateOne(
        { _id: share._id },
        { $push: { 'tracking.ndaAcceptances': ndaAcceptanceRecord } as any }
      );

      // ✅ Store in `agreements` collection (NOT `documents`)
      await db.collection('agreements').insertOne({
        shareId: share._id.toString(),
        shareToken: token,
        documentId: document._id.toString(),
        ownerId: share.userId,
        ...ndaAcceptanceRecord,
        ownerName: owner?.name || share.createdBy?.name || share.createdBy?.email || 'Document Owner',
        ownerCompany: owner?.company || share.createdBy?.company || '',
        // Keep nda_acceptances mirror for backward compat with certificate route
        _mirroredToNdaAcceptances: true,
      });

      // ✅ Also insert into nda_acceptances for certificate route compatibility
      await db.collection('nda_acceptances').insertOne({
        shareId: share._id.toString(),
        documentId: document._id.toString(),
        ownerId: share.userId,
        ...ndaAcceptanceRecord,
        ownerName: owner?.name || share.createdBy?.name || share.createdBy?.email || 'Document Owner',
        ownerCompany: owner?.company || share.createdBy?.company || '',
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const senderDisplayName = share.settings.sharedByName 
  || ownerProfile?.full_name 
  || (ownerProfile?.first_name ? `${ownerProfile.first_name}${ownerProfile.last_name ? ' ' + ownerProfile.last_name : ''}`.trim() : null)
  || ownerProfile?.email 
  || 'DocMetrics';

      // ✅ Notify doc owner of NDA acceptance
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
          documentUrl: `${baseUrl}/documents/${document._id.toString()}`,
        }).catch(err => console.error('Failed to send NDA notification:', err));
      }

      // ✅ Send certificate copy to the viewer (recipient) via Resend
      if (email && email !== 'anonymous') {
        sendRecipientNdaEmail({
          viewerEmail: email,
          viewerName: viewerName || 'there',
          documentTitle: document.originalFilename,
          certificateId,
          senderName: senderDisplayName,
          senderEmail: ownerProfile?.email || null,
          token,
          baseUrl,
        }).catch(err => console.error('Failed to send recipient NDA email:', err));
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
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
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
        senderEmail: ownerProfile?.email || null,
        enableWatermark: share.settings.enableWatermark || false,
        watermarkText: share.settings.watermarkText || null,
        watermarkPosition: share.settings.watermarkPosition || 'bottom',
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