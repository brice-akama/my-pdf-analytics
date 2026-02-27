import { NextRequest, NextResponse } from 'next/server'
import { verifyUserFromRequest } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { dbPromise } from '@/app/api/lib/mongodb'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params
    const user = await verifyUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name } = await request.json()

    const db = await dbPromise

    // Fetch original space
    const originalSpace = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    })

    if (!originalSpace) return NextResponse.json({ error: 'Space not found' }, { status: 404 })

    const isOwnerOrAdmin =
      originalSpace.userId === user.id ||
      originalSpace.members?.some((m: any) => m.email === user.email && ['owner', 'admin'].includes(m.role))

    if (!isOwnerOrAdmin) return NextResponse.json({ error: 'Permission denied' }, { status: 403 })

    const profile = await db.collection('profiles').findOne({ user_id: user.id })
    const userOrgId = profile?.organization_id || null

    // Build new space — same structure as POST /api/spaces
    const newSpace = {
      userId: user.id,
      createdBy: user.id,
      organizationId: userOrgId,
      name: name?.trim() || `${originalSpace.name} (Copy)`,
      description: originalSpace.description || '',
      type: originalSpace.type || 'custom',
      template: originalSpace.template || null,
      color: originalSpace.color || '#8B5CF6',
      active: true,
      status: 'active',
      ndaSettings: {
        enabled: false,
        ndaDocumentId: null,
        ndaDocumentName: null,
        ndaDocumentUrl: null,
        signingRequired: true,
        uploadedAt: null,
        uploadedBy: null
      },
      ndaSignatures: [],
      members: [{ email: user.email, role: 'owner', addedAt: new Date() }],
      settings: {
        ...originalSpace.settings,
        privacy: originalSpace.settings?.privacy || 'private',
      },
      publicAccess: {
        enabled: false,
        shareLink: null,
        requireEmail: true,
        requirePassword: false,
        password: null,
        expiresAt: null,
        viewLimit: null,
        currentViews: 0
      },
      branding: originalSpace.branding || {
        logoUrl: null,
        primaryColor: originalSpace.color || '#8B5CF6',
        companyName: profile?.company_name || null,
        welcomeMessage: 'Welcome to our secure data room',
        coverImageUrl: null
      },
      documentsCount: 0,
      viewsCount: 0,
      teamMembers: 1,
      visitors: [],
      activityLog: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
      duplicatedFrom: spaceId  // track origin
    }

    const newSpaceResult = await db.collection('spaces').insertOne(newSpace)
    const newSpaceId = newSpaceResult.insertedId.toString()

    // Duplicate folders
    const originalFolders = await db.collection('space_folders')
      .find({ spaceId: spaceId })
      .toArray()

    const folderIdMap = new Map<string, string>() // old → new

    if (originalFolders.length > 0) {
      const newFolders = originalFolders.map(f => ({
        spaceId: newSpaceId,
        name: f.name,
        description: f.description || '',
        parentFolderId: f.parentFolderId || null,
        order: f.order || 0,
        createdBy: user.id,
        createdByEmail: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      const folderResult = await db.collection('space_folders').insertMany(newFolders)

      // Map old folder IDs to new ones
      originalFolders.forEach((f, i) => {
        folderIdMap.set(
          f._id.toString(),
          folderResult.insertedIds[i].toString()
        )
      })
    }

    // Duplicate documents (same Cloudinary URLs — no re-upload needed)
    const originalDocs = await db.collection('documents')
      .find({
        spaceId: spaceId,
        archived: { $ne: true }
      })
      .toArray()

    let docsCopied = 0

    if (originalDocs.length > 0) {
      const newDocs = originalDocs.map(doc => {
        const oldFolderId = doc.folder || null
        const newFolderId = oldFolderId ? (folderIdMap.get(oldFolderId) || null) : null

        return {
          userId: user.id,
          organizationId: userOrgId,
          spaceId: newSpaceId,
          folder: newFolderId,
          folderId: newFolderId,
          originalFilename: doc.originalFilename || doc.name,
          name: doc.originalFilename || doc.name,
          originalFormat: doc.originalFormat,
          mimeType: doc.mimeType,
          size: doc.size,
          pdfSize: doc.pdfSize,
          cloudinaryOriginalUrl: doc.cloudinaryOriginalUrl,
          cloudinaryPdfUrl: doc.cloudinaryPdfUrl,
          numPages: doc.numPages,
          wordCount: doc.wordCount,
          charCount: doc.charCount,
          summary: doc.summary,
          extractedText: doc.extractedText,
          analytics: doc.analytics,
          // Reset tracking for new space
          tracking: {
            views: 0,
            uniqueVisitors: [],
            downloads: 0,
            shares: 0,
            averageViewTime: 0,
            viewsByPage: Array(doc.numPages || 1).fill(0),
            lastViewed: null
          },
          views: 0,
          downloads: 0,
          isPublic: false,
          sharedWith: [],
          shareLinks: [],
          tags: doc.tags || [],
          starred: false,
          archived: false,
          version: 1,
          expiresAt: null, // reset expiry on duplicate
          plan: user.plan,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAnalyzedAt: new Date(),
          duplicatedFrom: doc._id.toString()
        }
      })

      await db.collection('documents').insertMany(newDocs)
      docsCopied = newDocs.length

      // Update doc count on new space
      await db.collection('spaces').updateOne(
        { _id: newSpaceResult.insertedId },
        { $set: { documentsCount: docsCopied } }
      )
    }

    console.log(`✅ Space duplicated: "${originalSpace.name}" → "${newSpace.name}"`)
    console.log(`   Folders: ${originalFolders.length}, Docs: ${docsCopied}`)

    return NextResponse.json({
      success: true,
      message: `Space duplicated with ${originalFolders.length} folders and ${docsCopied} documents`,
      newSpaceId,
      summary: {
        folders: originalFolders.length,
        documents: docsCopied
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Duplicate space error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}