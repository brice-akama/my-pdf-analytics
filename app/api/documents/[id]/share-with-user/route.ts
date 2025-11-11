// app/api/documents/[id]/share/route.ts
import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { dbPromise } from "@/app/api/lib/mongodb"
import crypto from "crypto"

/* -------------------------------------------------------------------------- */
/* 🧩 Type Definitions                                                        */
/* -------------------------------------------------------------------------- */

interface SharedPermission {
  canView: boolean
  canDownload: boolean
  canEdit: boolean
  canShare: boolean
  canViewAnalytics: boolean
}

interface SharedWithEntry {
  email: string
  permissions: SharedPermission
  sharedBy: string
  sharedAt: Date
  updatedAt?: Date
  expiresAt: Date | null
  message: string | null
}

interface ShareLink {
  linkId: string
  createdBy: string
  createdAt: Date
  expiresAt: Date | null
  permissions: SharedPermission
  accessCount: number
  lastAccessed: Date | null
  disabled: boolean
}

interface DocumentType {
  _id: ObjectId
  userId: ObjectId
  filename: string
  originalFilename: string
  size: number
  numPages: number
  sharedWith: SharedWithEntry[]
  shareLinks: ShareLink[]
  tracking: {
    views: number
    uniqueVisitors: string[]
    downloads: number
    shares: number
    averageViewTime: number
    lastViewed: Date | null
  }
  createdAt?: Date
  updatedAt?: Date
}

interface ShareRequest {
  emails: string[]
  permissions?: Partial<SharedPermission>
  message?: string
  expiresAt?: string | null
  generateLink?: boolean
}

interface UpdatePermissionsRequest {
  email: string
  permissions: SharedPermission
}

/* -------------------------------------------------------------------------- */
/* 🧩 Helper Functions                                                        */
/* -------------------------------------------------------------------------- */

async function getVerifiedUser(req: NextRequest) {
  // verifyUserFromRequest expects the NextRequest so it can read cookies (token)
  return await verifyUserFromRequest(req)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function generateShareLinkId(): string {
  return crypto.randomBytes(16).toString('hex')
}

function getDefaultPermissions(partial?: Partial<SharedPermission>): SharedPermission {
  return {
    canView: partial?.canView ?? true,
    canDownload: partial?.canDownload ?? false,
    canEdit: partial?.canEdit ?? false,
    canShare: partial?.canShare ?? false,
    canViewAnalytics: partial?.canViewAnalytics ?? false,
  }
}

function getUserPermissions(document: DocumentType, userId: string, userEmail: string) {
  const isOwner = document.userId.toString() === userId
  
  if (isOwner) {
    return {
      isOwner: true,
      canShare: true,
      canDelete: true,
      canViewAnalytics: true,
      canEdit: true,
    }
  }

  const share = document.sharedWith?.find(s => s.email === userEmail)
  return {
    isOwner: false,
    canShare: share?.permissions?.canShare || false,
    canDelete: false,
    canViewAnalytics: share?.permissions?.canViewAnalytics || false,
    canEdit: share?.permissions?.canEdit || false,
  }
}

async function logActivity(
  db: any,
  documentId: ObjectId,
  userId: ObjectId,
  action: string,
  details: any,
  req: NextRequest
) {
  await db.collection('activity_logs').insertOne({
    documentId,
    userId,
    action,
    details,
    timestamp: new Date(),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    userAgent: req.headers.get('user-agent'),
  })
}

async function createNotifications(
  db: any,
  shares: SharedWithEntry[],
  document: DocumentType,
  sharedByEmail: string
) {
  const notifications = shares.map(share => ({
    userId: null,
    email: share.email,
    type: 'document_shared',
    title: 'New Document Shared With You',
    message: share.message || `${sharedByEmail} shared "${document.originalFilename}" with you`,
    metadata: {
      documentId: document._id.toString(),
      documentName: document.originalFilename,
      sharedBy: sharedByEmail,
      permissions: share.permissions,
      expiresAt: share.expiresAt,
      pageCount: document.numPages,
      fileSize: document.size,
    },
    read: false,
    actionUrl: `/documents/${document._id}`,
    createdAt: new Date(),
  }))

  if (notifications.length > 0) {
    await db.collection('notifications').insertMany(notifications)
  }
}

/* -------------------------------------------------------------------------- */
/* 🟢 POST - Share a document with specific users                             */
/* -------------------------------------------------------------------------- */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: ShareRequest = await req.json()
    const { emails, permissions, message, expiresAt, generateLink } = body

    if (!emails?.length && !generateLink) {
      return NextResponse.json(
        { error: "At least one email is required or enable link generation" },
        { status: 400 }
      )
    }

    // Validate email formats
    if (emails?.length) {
      const invalidEmails = emails.filter(email => !isValidEmail(email))
      if (invalidEmails.length) {
        return NextResponse.json({
          error: 'Invalid email addresses',
          invalidEmails
        }, { status: 400 })
      }
    }

    const db = await dbPromise
    const documents = db.collection<DocumentType>("documents")
    const documentId = new ObjectId(params.id)

    const document = await documents.findOne({ _id: documentId })
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check permissions
    const userPerms = getUserPermissions(document, user.id, user.email)
    if (!userPerms.canShare) {
      return NextResponse.json(
        { error: "You don't have permission to share this document" },
        { status: 403 }
      )
    }

    // Check plan-based limits
    const shareLimit = user.plan === 'premium' ? 50 : 5
    const currentShareCount = document.sharedWith?.length || 0

    if (emails?.length && currentShareCount + emails.length > shareLimit) {
      return NextResponse.json({
        error: `Share limit exceeded. ${user.plan} plan allows ${shareLimit} shared users per document`,
        currentCount: currentShareCount,
        limit: shareLimit,
        upgrade: user.plan === 'free' ? 'Upgrade to premium for up to 50 shares' : null
      }, { status: 403 })
    }

    const validatedPermissions = getDefaultPermissions(permissions)
    let shareLink: ShareLink | null = null
    let newShares: SharedWithEntry[] = []

    // Generate share link if requested
    if (generateLink) {
      shareLink = {
        linkId: generateShareLinkId(),
        createdBy: user.email,
        createdAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        permissions: validatedPermissions,
        accessCount: 0,
        lastAccessed: null,
        disabled: false,
      }
    }

    // Prepare email-based shares
    if (emails?.length) {
      const sharedEntries = emails.map((email) => ({
        email: email.toLowerCase().trim(),
        permissions: validatedPermissions,
        sharedBy: user.email,
        sharedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        message: message || null,
      }))

      const existingEmails = document.sharedWith?.map((s) => s.email) || []
      newShares = sharedEntries.filter(
        (share) => !existingEmails.includes(share.email)
      )

      if (!newShares.length && !generateLink) {
        return NextResponse.json(
          { error: "All users already have access to this document" },
          { status: 400 }
        )
      }
    }

    // Update document with shares and link
    const updateOperation: any = {
      $set: { updatedAt: new Date() },
      $inc: { 'tracking.shares': newShares.length }
    }

    if (newShares.length > 0) {
      updateOperation.$push = { sharedWith: { $each: newShares } }
    }

    if (shareLink) {
      updateOperation.$push = updateOperation.$push || {}
      updateOperation.$push.shareLinks = shareLink
    }

    await documents.updateOne({ _id: documentId }, updateOperation)

    // Create notifications
    if (newShares.length > 0) {
      await createNotifications(db, newShares, document, user.email)
    }

    // Log analytics events
    if (newShares.length > 0) {
      await db.collection('analytics_logs').insertMany(
        newShares.map(share => ({
          documentId: documentId.toString(),
          action: 'share',
          sharedWith: share.email,
          sharedBy: user.email,
          permissions: share.permissions,
          timestamp: new Date(),
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        }))
      )
    }

    // Log activity
    await logActivity(
      db,
      documentId,
      new ObjectId(user.id),
      'document_shared',
      {
        sharedWith: newShares.map(s => s.email),
        shareLink: shareLink?.linkId || null,
        permissions: validatedPermissions,
        message,
        expiresAt,
      },
      req
    )

    // Return detailed response
    return NextResponse.json({
      success: true,
      message: newShares.length 
        ? `Document shared with ${newShares.length} user(s)` 
        : 'Share link generated',
      data: {
        documentId: documentId.toString(),
        documentName: document.originalFilename,
        sharedWith: newShares.map(s => ({
          email: s.email,
          permissions: s.permissions,
          expiresAt: s.expiresAt,
          sharedAt: s.sharedAt,
        })),
        shareUrl: shareLink 
          ? `${process.env.NEXT_PUBLIC_APP_URL}/shared/${shareLink.linkId}` 
          : null,
        totalShares: currentShareCount + newShares.length,
      },
      analytics: {
        totalShares: (document.tracking?.shares || 0) + newShares.length,
        uniqueSharedUsers: new Set([
          ...(document.sharedWith || []).map(s => s.email),
          ...newShares.map(s => s.email)
        ]).size,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("POST share document error:", error)
    return NextResponse.json(
      { 
        error: "Failed to share document",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/* 🟢 GET - Fetch users the document is shared with                           */
/* -------------------------------------------------------------------------- */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await dbPromise
    const documents = db.collection<DocumentType>("documents")
    const documentId = new ObjectId(params.id)

    const document = await documents.findOne({ _id: documentId })
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const userPerms = getUserPermissions(document, user.id, user.email)
    
    if (!userPerms.isOwner && !document.sharedWith?.some(s => s.email === user.email)) {
      return NextResponse.json(
        { error: "You don't have access to this document" },
        { status: 403 }
      )
    }

    // Filter expired shares
    const now = new Date()
    const activeShares = (document.sharedWith || []).map(share => ({
      ...share,
      expired: share.expiresAt ? new Date(share.expiresAt) < now : false
    }))

    const activeLinks = (document.shareLinks || []).map(link => ({
      ...link,
      expired: link.expiresAt ? new Date(link.expiresAt) < now : false,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/shared/${link.linkId}`
    }))

    return NextResponse.json({
      success: true,
      data: {
        documentId: documentId.toString(),
        documentName: document.originalFilename,
        isOwner: userPerms.isOwner,
        sharedWith: activeShares,
        shareLinks: userPerms.isOwner || userPerms.canViewAnalytics ? activeLinks : [],
        totalActiveShares: activeShares.filter(s => !s.expired).length,
        totalActiveLinks: activeLinks.filter(l => !l.expired && !l.disabled).length,
      },
      permissions: userPerms,
    })

  } catch (error) {
    console.error("GET shared users error:", error)
    return NextResponse.json(
      { error: "Failed to fetch shared users" },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/* 🟡 PATCH - Update user permissions                                         */
/* -------------------------------------------------------------------------- */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: UpdatePermissionsRequest = await req.json()
    const { email, permissions } = body

    if (!email || !permissions) {
      return NextResponse.json(
        { error: "Email and permissions are required" },
        { status: 400 }
      )
    }

    const db = await dbPromise
    const documents = db.collection<DocumentType>("documents")
    const documentId = new ObjectId(params.id)

    const document = await documents.findOne({ _id: documentId })
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Only owner can update permissions
    if (document.userId.toString() !== user.id) {
      return NextResponse.json(
        { error: "Only the document owner can update permissions" },
        { status: 403 }
      )
    }

    const result = await documents.updateOne(
      { _id: documentId, 'sharedWith.email': email.toLowerCase() },
      { 
        $set: { 
          'sharedWith.$.permissions': permissions,
          'sharedWith.$.updatedAt': new Date(),
          updatedAt: new Date() 
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found in shared list" },
        { status: 404 }
      )
    }

    // Log activity
    await logActivity(
      db,
      documentId,
      new ObjectId(user.id),
      'permissions_updated',
      { email, permissions },
      req
    )

    return NextResponse.json({
      success: true,
      message: `Permissions updated for ${email}`,
      data: { email, permissions }
    })

  } catch (error) {
    console.error("PATCH permissions error:", error)
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    )
  }
}

/* -------------------------------------------------------------------------- */
/* 🔴 DELETE - Remove a user's access from shared document                    */
/* -------------------------------------------------------------------------- */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const emailToRemove = searchParams.get("email")
    const linkId = searchParams.get("linkId")

    if (!emailToRemove && !linkId) {
      return NextResponse.json(
        { error: "Email or linkId parameter is required" },
        { status: 400 }
      )
    }

    const db = await dbPromise
    const documents = db.collection<DocumentType>("documents")
    const documentId = new ObjectId(params.id)

    const document = await documents.findOne({ _id: documentId })
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Only the owner can remove shares
    if (document.userId.toString() !== user.id) {
      return NextResponse.json(
        { error: "Only the document owner can remove share access" },
        { status: 403 }
      )
    }

    let updateOperation: any = {
      $set: { updatedAt: new Date() },
      $inc: { 'tracking.shares': -1 }
    }

    if (emailToRemove) {
      updateOperation.$pull = { sharedWith: { email: emailToRemove.toLowerCase() } }
    } else if (linkId) {
      // Disable link instead of removing (for analytics history)
      await documents.updateOne(
        { _id: documentId, 'shareLinks.linkId': linkId },
        { 
          $set: { 
            'shareLinks.$.disabled': true,
            updatedAt: new Date() 
          }
        }
      )

      // Log activity
      await logActivity(
        db,
        documentId,
        new ObjectId(user.id),
        'share_link_disabled',
        { linkId },
        req
      )

      return NextResponse.json({
        success: true,
        message: `Share link disabled`,
      })
    }

    await documents.updateOne({ _id: documentId }, updateOperation)

    // Log activity
    await logActivity(
      db,
      documentId,
      new ObjectId(user.id),
      'share_removed',
      { email: emailToRemove },
      req
    )

    return NextResponse.json({
      success: true,
      message: `Access removed for ${emailToRemove}`,
    })

  } catch (error) {
    console.error("DELETE share error:", error)
    return NextResponse.json(
      { error: "Failed to remove share access" },
      { status: 500 }
    )
  }
}