// app/api/shared/[linkId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { dbPromise } from "@/app/api/lib/mongodb"
import crypto from "crypto"
import { verifyUserFromRequest } from "@/lib/auth"

/* -------------------------------------------------------------------------- */
/* 🧩 Type Definitions                                                        */
/* -------------------------------------------------------------------------- */

interface ShareLinkAccess {
  linkId: string
  email?: string
  password?: string
  acceptTerms?: boolean
  captchaToken?: string
}

interface ShareLink {
  linkId: string
  createdBy: string
  createdAt: Date
  expiresAt: Date | null
  permissions: {
    canView: boolean
    canDownload: boolean
    canEdit: boolean
    canShare: boolean
    canViewAnalytics: boolean
  }
  accessCount: number
  lastAccessed: Date | null
  disabled: boolean
  // 🚀 Advanced features (beyond DocSend)
  requireEmail?: boolean
  requirePassword?: boolean
  password?: string // hashed
  allowedEmails?: string[] // whitelist
  blockedEmails?: string[] // blacklist
  requireNDA?: boolean
  ndaText?: string
  maxAccessCount?: number
  allowedDomains?: string[] // e.g., ["company.com"]
  requireCaptcha?: boolean
  watermarkEnabled?: boolean
  disableForwarding?: boolean
  notifyOnAccess?: boolean
  customMessage?: string
  redirectUrl?: string // redirect after view
  analytics: {
    uniqueVisitors: string[]
    viewsByCountry: Record<string, number>
    viewsByDevice: Record<string, number>
    averageViewTime: number
    totalDownloads: number
  }
}

interface DocumentType {
  _id: ObjectId
  userId: ObjectId
  originalFilename: string
  cloudinaryPdfUrl: string
  cloudinaryOriginalUrl: string
  size: number
  numPages: number
  shareLinks: ShareLink[]
  tracking: any
  extractedText: string
  analytics: any
}

/* -------------------------------------------------------------------------- */
/* 🧩 Helper Functions                                                        */
/* -------------------------------------------------------------------------- */

function getClientInfo(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const country = req.headers.get('cf-ipcountry') || 
                  req.headers.get('x-vercel-ip-country') || 
                  'unknown'
  
  // Detect device type
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent)
  const isTablet = /tablet|ipad/i.test(userAgent)
  const device = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'

  return { ip, userAgent, country, device }
}

function generateVisitorId(ip: string, userAgent: string): string {
  return crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex').substring(0, 16)
}

function isExpired(date: Date | null): boolean {
  if (!date) return false
  return new Date() > new Date(date)
}

function isEmailAllowed(email: string, link: ShareLink): boolean {
  // Check whitelist
  if (link.allowedEmails?.length && !link.allowedEmails.includes(email)) {
    return false
  }
  
  // Check blacklist
  if (link.blockedEmails?.includes(email)) {
    return false
  }
  
  // Check domain restrictions
  if (link.allowedDomains?.length) {
    const domain = email.split('@')[1]
    if (!link.allowedDomains.includes(domain)) {
      return false
    }
  }
  
  return true
}

async function verifyPassword(provided: string, hashed: string): Promise<boolean> {
  // Simple hash comparison (in production, use bcrypt)
  const hashedProvided = crypto.createHash('sha256').update(provided).digest('hex')
  return hashedProvided === hashed
}

async function sendAccessNotification(
  db: any,
  documentId: ObjectId,
  ownerId: ObjectId,
  accessDetails: any
) {
  await db.collection('notifications').insertOne({
    userId: ownerId,
    type: 'document_accessed',
    title: 'Document Accessed via Share Link',
    message: `Someone ${accessDetails.email ? `(${accessDetails.email})` : 'anonymous'} viewed your document`,
    metadata: {
      documentId: documentId.toString(),
      accessedBy: accessDetails.email || 'Anonymous',
      country: accessDetails.country,
      device: accessDetails.device,
      timestamp: new Date(),
    },
    read: false,
    actionUrl: `/documents/${documentId}/analytics`,
    createdAt: new Date(),
  })
}

/* -------------------------------------------------------------------------- */
/* 🟢 GET - Access document via share link (with validation)                  */
/* -------------------------------------------------------------------------- */
export async function GET(
  req: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token') // For email verification token

    const db = await dbPromise
    const documents = db.collection<DocumentType>("documents")

    // Find document with this share link
    const document = await documents.findOne({
      'shareLinks.linkId': linkId
    })

    if (!document) {
      return NextResponse.json({ 
        error: "Share link not found or has been removed" 
      }, { status: 404 })
    }

    const shareLink = document.shareLinks.find(link => link.linkId === linkId)
    if (!shareLink) {
      return NextResponse.json({ 
        error: "Share link not found" 
      }, { status: 404 })
    }

    // 🚨 Validation checks
    
    // 1. Check if disabled
    if (shareLink.disabled) {
      return NextResponse.json({ 
        error: "This share link has been disabled by the owner",
        code: "LINK_DISABLED"
      }, { status: 403 })
    }

    // 2. Check expiration
    if (isExpired(shareLink.expiresAt)) {
      return NextResponse.json({ 
        error: "This share link has expired",
        code: "LINK_EXPIRED",
        expiresAt: shareLink.expiresAt
      }, { status: 403 })
    }

    // 3. Check max access count
    if (shareLink.maxAccessCount && shareLink.accessCount >= shareLink.maxAccessCount) {
      return NextResponse.json({ 
        error: "This share link has reached its maximum access limit",
        code: "MAX_ACCESS_REACHED",
        maxAccess: shareLink.maxAccessCount
      }, { status: 403 })
    }

    // Get client info
    const clientInfo = getClientInfo(req)
    const visitorId = generateVisitorId(clientInfo.ip, clientInfo.userAgent)

    // 4. Check if requires authentication (email/password/NDA)
    const requiresAuth = shareLink.requireEmail || 
                         shareLink.requirePassword || 
                         shareLink.requireNDA ||
                         shareLink.requireCaptcha

    if (requiresAuth && !token) {
      // Return link requirements for frontend to show auth form
      return NextResponse.json({
        success: false,
        requiresAuth: true,
        requirements: {
          email: shareLink.requireEmail || false,
          password: shareLink.requirePassword || false,
          nda: shareLink.requireNDA || false,
          captcha: shareLink.requireCaptcha || false,
          ndaText: shareLink.ndaText || null,
          customMessage: shareLink.customMessage || null,
        },
        documentInfo: {
          filename: document.originalFilename,
          pages: document.numPages,
          size: document.size,
        }
      }, { status: 200 })
    }

    // ✅ All validations passed - Grant access

    // Update link analytics
    const updatedAnalytics = {
      ...shareLink.analytics,
      uniqueVisitors: shareLink.analytics?.uniqueVisitors || [],
      viewsByCountry: shareLink.analytics?.viewsByCountry || {},
      viewsByDevice: shareLink.analytics?.viewsByDevice || {},
    }

    // Track unique visitor
    if (!updatedAnalytics.uniqueVisitors.includes(visitorId)) {
      updatedAnalytics.uniqueVisitors.push(visitorId)
    }

    // Track by country
    updatedAnalytics.viewsByCountry[clientInfo.country] = 
      (updatedAnalytics.viewsByCountry[clientInfo.country] || 0) + 1

    // Track by device
    updatedAnalytics.viewsByDevice[clientInfo.device] = 
      (updatedAnalytics.viewsByDevice[clientInfo.device] || 0) + 1

    // Update document
    await documents.updateOne(
      { 
        _id: document._id,
        'shareLinks.linkId': linkId 
      },
      {
        $set: {
          'shareLinks.$.lastAccessed': new Date(),
          'shareLinks.$.analytics': updatedAnalytics,
        },
        $inc: {
          'shareLinks.$.accessCount': 1,
          'tracking.views': 1,
        }
      }
    )

    // Log detailed access event
    await db.collection('share_link_access_logs').insertOne({
      linkId,
      documentId: document._id,
      visitorId,
      email: null, // Will be set in POST if email is provided
      timestamp: new Date(),
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      country: clientInfo.country,
      device: clientInfo.device,
      referrer: req.headers.get('referer') || null,
      action: 'view',
    })

    // Send notification to owner if enabled
    if (shareLink.notifyOnAccess) {
      await sendAccessNotification(db, document._id, document.userId, {
        email: null,
        country: clientInfo.country,
        device: clientInfo.device,
      })
    }

    // Return document access data
    return NextResponse.json({
      success: true,
      accessGranted: true,
      document: {
        id: document._id.toString(),
        filename: document.originalFilename,
        pdfUrl: document.cloudinaryPdfUrl,
        originalUrl: document.cloudinaryOriginalUrl,
        numPages: document.numPages,
        size: document.size,
      },
      permissions: shareLink.permissions,
      watermarkEnabled: shareLink.watermarkEnabled || false,
      disableForwarding: shareLink.disableForwarding || false,
      customMessage: shareLink.customMessage || null,
      sharedBy: shareLink.createdBy,
      analytics: {
        accessCount: shareLink.accessCount + 1,
        uniqueVisitors: updatedAnalytics.uniqueVisitors.length,
      }
    })

  } catch (error) {
    console.error("Share link access error:", error)
    return NextResponse.json(
      { 
        error: "Failed to access document",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/* 🟢 POST - Verify and access with authentication (email/password/NDA)       */
/* -------------------------------------------------------------------------- */
export async function POST(
  req: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params
    const body: ShareLinkAccess = await req.json()
    const { email, password, acceptTerms, captchaToken } = body

    const db = await dbPromise
    const documents = db.collection<DocumentType>("documents")

    // Find document
    const document = await documents.findOne({
      'shareLinks.linkId': linkId
    })

    if (!document) {
      return NextResponse.json({ 
        error: "Share link not found" 
      }, { status: 404 })
    }

    const shareLink = document.shareLinks.find(link => link.linkId === linkId)
    if (!shareLink) {
      return NextResponse.json({ 
        error: "Share link not found" 
      }, { status: 404 })
    }

    // Validation checks (same as GET)
    if (shareLink.disabled) {
      return NextResponse.json({ 
        error: "This share link has been disabled",
        code: "LINK_DISABLED"
      }, { status: 403 })
    }

    if (isExpired(shareLink.expiresAt)) {
      return NextResponse.json({ 
        error: "This share link has expired",
        code: "LINK_EXPIRED"
      }, { status: 403 })
    }

    if (shareLink.maxAccessCount && shareLink.accessCount >= shareLink.maxAccessCount) {
      return NextResponse.json({ 
        error: "Maximum access limit reached",
        code: "MAX_ACCESS_REACHED"
      }, { status: 403 })
    }

    // 🔐 Advanced authentication checks

    // 1. Email verification
    if (shareLink.requireEmail && email) {
      if (!isEmailAllowed(email, shareLink)) {
        return NextResponse.json({ 
          error: "Your email is not authorized to access this document",
          code: "EMAIL_NOT_ALLOWED"
        }, { status: 403 })
      }

      // Track email access
      await db.collection('share_link_email_verifications').insertOne({
        linkId,
        documentId: document._id,
        email: email.toLowerCase(),
        verified: true,
        timestamp: new Date(),
      })
    } else if (shareLink.requireEmail && !email) {
      return NextResponse.json({ 
        error: "Email is required to access this document",
        code: "EMAIL_REQUIRED"
      }, { status: 400 })
    }

    // 2. Password verification
    if (shareLink.requirePassword) {
      if (!password) {
        return NextResponse.json({ 
          error: "Password is required",
          code: "PASSWORD_REQUIRED"
        }, { status: 400 })
      }

      if (shareLink.password) {
        const isValid = await verifyPassword(password, shareLink.password)
        if (!isValid) {
          // Log failed attempt
          await db.collection('share_link_failed_attempts').insertOne({
            linkId,
            documentId: document._id,
            attemptType: 'password',
            ip: req.headers.get('x-forwarded-for'),
            timestamp: new Date(),
          })

          return NextResponse.json({ 
            error: "Incorrect password",
            code: "INVALID_PASSWORD"
          }, { status: 401 })
        }
      }
    }

    // 3. NDA acceptance
    if (shareLink.requireNDA && !acceptTerms) {
      return NextResponse.json({ 
        error: "You must accept the terms to continue",
        code: "NDA_REQUIRED",
        ndaText: shareLink.ndaText
      }, { status: 400 })
    }

    if (shareLink.requireNDA && acceptTerms) {
      // Log NDA acceptance
      await db.collection('share_link_nda_acceptances').insertOne({
        linkId,
        documentId: document._id,
        email: email || null,
        ndaText: shareLink.ndaText,
        acceptedAt: new Date(),
        ip: req.headers.get('x-forwarded-for'),
      })
    }

    // 4. Captcha verification (if needed)
    if (shareLink.requireCaptcha && !captchaToken) {
      return NextResponse.json({ 
        error: "Captcha verification required",
        code: "CAPTCHA_REQUIRED"
      }, { status: 400 })
    }

    // ✅ All authentication passed

    const clientInfo = getClientInfo(req)
    const visitorId = email ? 
      crypto.createHash('sha256').update(email).digest('hex').substring(0, 16) :
      generateVisitorId(clientInfo.ip, clientInfo.userAgent)

    // Update analytics
    const updatedAnalytics = {
      ...shareLink.analytics,
      uniqueVisitors: shareLink.analytics?.uniqueVisitors || [],
      viewsByCountry: shareLink.analytics?.viewsByCountry || {},
      viewsByDevice: shareLink.analytics?.viewsByDevice || {},
    }

    if (!updatedAnalytics.uniqueVisitors.includes(visitorId)) {
      updatedAnalytics.uniqueVisitors.push(visitorId)
    }

    updatedAnalytics.viewsByCountry[clientInfo.country] = 
      (updatedAnalytics.viewsByCountry[clientInfo.country] || 0) + 1

    updatedAnalytics.viewsByDevice[clientInfo.device] = 
      (updatedAnalytics.viewsByDevice[clientInfo.device] || 0) + 1

    // Update document
    await documents.updateOne(
      { 
        _id: document._id,
        'shareLinks.linkId': linkId 
      },
      {
        $set: {
          'shareLinks.$.lastAccessed': new Date(),
          'shareLinks.$.analytics': updatedAnalytics,
        },
        $inc: {
          'shareLinks.$.accessCount': 1,
          'tracking.views': 1,
        }
      }
    )

    // Log authenticated access
    await db.collection('share_link_access_logs').insertOne({
      linkId,
      documentId: document._id,
      visitorId,
      email: email || null,
      authenticated: true,
      ndaAccepted: acceptTerms || false,
      timestamp: new Date(),
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      country: clientInfo.country,
      device: clientInfo.device,
      action: 'authenticated_view',
    })

    // Send notification
    if (shareLink.notifyOnAccess) {
      await sendAccessNotification(db, document._id, document.userId, {
        email: email || null,
        country: clientInfo.country,
        device: clientInfo.device,
      })
    }

    // Generate access token for frontend
    const accessToken = crypto.randomBytes(32).toString('hex')
    await db.collection('share_link_access_tokens').insertOne({
      token: accessToken,
      linkId,
      documentId: document._id,
      email: email || null,
      permissions: shareLink.permissions,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    })

    return NextResponse.json({
      success: true,
      accessGranted: true,
      accessToken, // Frontend uses this for subsequent requests
      document: {
        id: document._id.toString(),
        filename: document.originalFilename,
        pdfUrl: document.cloudinaryPdfUrl,
        originalUrl: document.cloudinaryOriginalUrl,
        numPages: document.numPages,
        size: document.size,
      },
      permissions: shareLink.permissions,
      watermarkEnabled: shareLink.watermarkEnabled || false,
      disableForwarding: shareLink.disableForwarding || false,
      customMessage: shareLink.customMessage || null,
      redirectUrl: shareLink.redirectUrl || null,
      sharedBy: shareLink.createdBy,
    })

  } catch (error) {
    console.error("Share link authentication error:", error)
    return NextResponse.json(
      { 
        error: "Authentication failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/* 📊 PATCH - Track engagement (page views, time spent, downloads)            */
/* -------------------------------------------------------------------------- */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params
    const body = await req.json()
    const { 
      action, // 'page_view', 'download', 'time_spent', 'completed'
      pageNumber, 
      timeSpent, 
      accessToken,
      metadata 
    } = body

    const db = await dbPromise

    // Verify access token
    const tokenDoc = await db.collection('share_link_access_tokens').findOne({
      token: accessToken,
      linkId,
    })

    if (!tokenDoc || new Date() > new Date(tokenDoc.expiresAt)) {
      return NextResponse.json({ 
        error: "Invalid or expired access token" 
      }, { status: 401 })
    }

    const documents = db.collection<DocumentType>("documents")
    const document = await documents.findOne({
      'shareLinks.linkId': linkId
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Log engagement event
    await db.collection('share_link_engagement_logs').insertOne({
      linkId,
      documentId: document._id,
      email: tokenDoc.email,
      action,
      pageNumber: pageNumber || null,
      timeSpent: timeSpent || 0,
      metadata: metadata || {},
      timestamp: new Date(),
    })

    // Update specific metrics based on action
    if (action === 'download') {
      await documents.updateOne(
        { _id: document._id, 'shareLinks.linkId': linkId },
        { 
          $inc: { 
            'shareLinks.$.analytics.totalDownloads': 1,
            'tracking.downloads': 1 
          }
        }
      )
    }

    if (action === 'time_spent' && timeSpent) {
      const shareLink = document.shareLinks.find(l => l.linkId === linkId)
      const currentAvg = shareLink?.analytics?.averageViewTime || 0
      const totalViews = shareLink?.accessCount || 1
      const newAvg = ((currentAvg * totalViews) + timeSpent) / (totalViews + 1)

      await documents.updateOne(
        { _id: document._id, 'shareLinks.linkId': linkId },
        { $set: { 'shareLinks.$.analytics.averageViewTime': Math.round(newAvg) } }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${action} tracked successfully`
    })

  } catch (error) {
    console.error("Share link engagement tracking error:", error)
    return NextResponse.json(
      { error: "Failed to track engagement" },
      { status: 500 }
    )
  }
}