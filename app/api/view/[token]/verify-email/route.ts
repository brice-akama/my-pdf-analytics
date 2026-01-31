// app/api/view/[token]/verify-email/route.ts
// NEW: Email verification before viewing document

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { sendEmail } from '@/lib/email';  

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    const { email, name, company } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ 
        error: 'Valid email is required' 
      }, { status: 400 });
    }

    const db = await dbPromise;

    // Find share record
    const share = await db.collection('shares').findOne({
      shareToken: token,
      active: true,
    });

    if (!share) {
      return NextResponse.json({ 
        error: 'Share link not found or expired' 
      }, { status: 404 });
    }

    // Check if share requires email
    if (!share.settings?.requireEmail) {
      return NextResponse.json({ 
        success: true, 
        emailRequired: false 
      });
    }

    // Check email whitelist if configured
    if (share.settings.allowedEmails && share.settings.allowedEmails.length > 0) {
      const isAllowed = share.settings.allowedEmails.some(
        (allowed: string) => allowed.toLowerCase() === email.toLowerCase()
      );
      
      if (!isAllowed) {
        return NextResponse.json({ 
          error: 'Your email is not authorized to view this document',
          unauthorized: true 
        }, { status: 403 });
      }
    }

    // Get document details
    const document = await db.collection('documents').findOne({
      _id: share.documentId,
    });

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found' 
      }, { status: 404 });
    }

    // Get viewer IP and user agent
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                request.headers.get('x-real-ip') || 
                'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const viewerId = Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);

    const now = new Date();

    // Store viewer information
    await db.collection('share_viewers').insertOne({
      shareId: share._id.toString(),
      documentId: share.documentId.toString(),
      email: email.toLowerCase(),
      name: name || null,
      company: company || null,
      viewerId,
      ip,
      userAgent,
      firstAccessAt: now,
      lastAccessAt: now,
      totalViews: 1,
      totalTimeSpent: 0,
      accessHistory: [{
        timestamp: now,
        ip,
        userAgent,
      }],
    });

    // Update share tracking
    await db.collection('shares').updateOne(
      { _id: share._id },
      {
        $addToSet: {
          'tracking.viewerEmails': email.toLowerCase(),
        },
        $inc: {
          'tracking.emailVerifications': 1,
        },
        $set: {
          updatedAt: now,
        },
      }
    );

    // Log verification event
    await db.collection('analytics_logs').insertOne({
      documentId: document._id.toString(),
      shareId: share._id.toString(),
      action: 'email_verified',
      userId: share.userId,
      email: email.toLowerCase(),
      viewerInfo: {
        name,
        company,
        viewerId,
      },
      timestamp: now,
      userAgent,
      ip,
    });

    // 🔔 SEND REAL-TIME NOTIFICATION TO DOCUMENT OWNER
    await sendNotificationToOwner(db, share, document, email, name, company, ip);

    // 📧 SEND WELCOME EMAIL TO VIEWER (Optional)
    if (share.settings.sendWelcomeEmail) {
      await sendViewerWelcomeEmail(email, name, document, share);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      viewerInfo: {
        email,
        name,
        company,
      },
      message: 'Email verified successfully',
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.json({
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 🔔 Send notification to document owner
async function sendNotificationToOwner(
  db: any,
  share: any,
  document: any,
  viewerEmail: string,
  viewerName: string | null,
  viewerCompany: string | null,
  ip: string
) {
  try {
    // Get owner details
    const owner = await db.collection('users').findOne({
      id: share.userId,
    });

    if (!owner) return;

    // Create in-app notification
    await db.collection('notifications').insertOne({
      userId: share.userId,
      type: 'document_viewed',
      title: `${viewerName || viewerEmail} is viewing your document`,
      message: `${viewerName || viewerEmail}${viewerCompany ? ` from ${viewerCompany}` : ''} just opened "${document.originalFilename}"`,
      documentId: document._id.toString(),
      shareId: share._id.toString(),
      viewerInfo: {
        email: viewerEmail,
        name: viewerName,
        company: viewerCompany,
        ip,
      },
      read: false,
      createdAt: new Date(),
      actionUrl: `/documents/${document._id.toString()}`,
    });

    // Send email notification if enabled
    if (share.settings.notifyOnView && owner.email) {
      await sendEmail({
        to: owner.email,
        subject: `📄 ${viewerName || viewerEmail} is viewing "${document.originalFilename}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B5CF6;">🔔 Your document is being viewed!</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Viewer Information:</h3>
              <p><strong>Name:</strong> ${viewerName || 'Not provided'}</p>
              <p><strong>Email:</strong> ${viewerEmail}</p>
              ${viewerCompany ? `<p><strong>Company:</strong> ${viewerCompany}</p>` : ''}
              <p><strong>Document:</strong> ${document.originalFilename}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/documents/${document._id.toString()}" 
                 style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Analytics
              </a>
            </p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
            
            <p style="color: #6b7280; font-size: 14px;">
              You're receiving this because you enabled view notifications for this document.
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/documents/${document._id.toString()}" style="color: #8B5CF6;">Manage settings</a>
            </p>
          </div>
        `,
      });
    }

    console.log('✅ Notification sent to owner:', owner.email);
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
  }
}

// 📧 Send welcome email to viewer
async function sendViewerWelcomeEmail(
  email: string,
  name: string | null,
  document: any,
  share: any
) {
  try {
    await sendEmail({
      to: email,
      subject: `Access granted: ${document.originalFilename}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Welcome!</h2>
          
          <p>Hi ${name || 'there'},</p>
          
          <p>You now have access to view <strong>${document.originalFilename}</strong>.</p>
          
          ${share.settings.customMessage ? `
            <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;">${share.settings.customMessage}</p>
            </div>
          ` : ''}

          <p>
            <strong>Document Details:</strong><br/>
            Pages: ${document.numPages}<br/>
            ${share.settings.allowDownload ? '✅ Download enabled' : '❌ Download disabled'}<br/>
            ${share.settings.allowPrint ? '✅ Print enabled' : '❌ Print disabled'}
          </p>

          <p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/view/${share.shareToken}" 
               style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Open Document
            </a>
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          
          <p style="color: #6b7280; font-size: 14px;">
            This document was shared with you securely via DocMetrics.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
  }
}