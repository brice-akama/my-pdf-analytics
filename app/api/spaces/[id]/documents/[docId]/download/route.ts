// app/api/spaces/[id]/documents/[docId]/download/route.ts
//
// Enforces the allowDownloads setting before serving a file.
// Redirects to the Cloudinary URL if allowed,
// returns 403 if downloads are disabled for this space.

import { NextRequest, NextResponse } from 'next/server'
import { verifyUserFromRequest } from '@/lib/auth'
import { ObjectId } from 'mongodb'
 
import { checkSpaceAccess } from '@/lib/spaceAccessGuard'
import { dbPromise } from '@/app/api/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: spaceId, docId } = await params

    const authUser = await verifyUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ObjectId.isValid(spaceId) || !ObjectId.isValid(docId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const db = await dbPromise

    // Get the space
    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) })
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    // ── Access check ──────────────────────────────────────────────────────────
    const userProfile = await db.collection('profiles').findOne({ user_id: authUser.id })
    const userOrgId = userProfile?.organization_id || authUser.id
    const isSpaceOwner = space.userId === authUser.id
    const isOrgOwner = space.organizationId && space.organizationId === userOrgId
    const member = space.members?.find((m: any) => m.email === authUser.email)
    const isManager = isSpaceOwner || (isOrgOwner && ['owner', 'admin'].includes(userProfile?.role || ''))

    if (!isSpaceOwner && !isOrgOwner && !member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // ── 🔐 ALLOW DOWNLOADS ENFORCEMENT ───────────────────────────────────────
    if (!isManager) {
      // Space-level download restriction
      if (space.settings?.allowDownloads === false) {
        console.log(`⛔ Download blocked for ${authUser.email} — space ${spaceId} has downloads disabled`)
        return NextResponse.json(
          {
            error: 'Downloads are not permitted for this data room.',
            code: 'DOWNLOADS_DISABLED'
          },
          { status: 403 }
        )
      }

      // Member-level download restriction (set per-invite)
      if (member?.canDownload === false) {
        return NextResponse.json(
          {
            error: 'You do not have download permissions for this data room.',
            code: 'DOWNLOADS_DISABLED'
          },
          { status: 403 }
        )
      }
    }

    // ── Run full access guard (expire + NDA checks) ───────────────────────────
    if (!isManager) {
      const guard = await checkSpaceAccess(space, authUser.email, db)
      if (!guard.allowed) {
        return NextResponse.json({ error: guard.reason, code: guard.code }, { status: 403 })
      }
    }

    // ── Get document ──────────────────────────────────────────────────────────
    const doc = await db.collection('documents').findOne({
      _id: new ObjectId(docId),
      spaceId
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const fileUrl = doc.cloudinaryPdfUrl || doc.fileUrl || doc.url
    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL not available' }, { status: 404 })
    }

    // ── Log download activity ─────────────────────────────────────────────────
    await db.collection('spaces').updateOne(
      { _id: new ObjectId(spaceId) },
      {
        $push: {
          activityLog: {
            type: 'document_downloaded',
            email: authUser.email,
            documentId: docId,
            documentName: doc.name || doc.fileName,
            timestamp: new Date()
          }
        } as any,
        $set: { lastActivity: new Date() }
      }
    )

    // ── Redirect to the actual file ───────────────────────────────────────────
    // Using redirect so the browser handles the download natively.
    // Cloudinary URLs are pre-signed — safe to redirect to directly.
    return NextResponse.redirect(fileUrl)

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 })
  }
}