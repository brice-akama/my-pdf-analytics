// app/api/portal/[shareLink]/nda-sign/route.ts
//
// POST { email }
//   → records that this visitor has signed the NDA for this share link
//   → stores signature record in `ndaSignatures` collection
//   → returns { success: true }

import { NextRequest, NextResponse } from 'next/server'
import { dbPromise } from '@/app/api/lib/mongodb'

export async function POST(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params    = context.params instanceof Promise ? await context.params : context.params
    const shareLink = params.shareLink
    const body      = await request.json()
    const { email } = body

    console.log('📝 NDA sign request:', { shareLink, email })

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const db = await dbPromise

    // 1. Find the space and verify the link exists
    const space = await db.collection('spaces').findOne({
      'publicAccess': {
        $elemMatch: { shareLink, enabled: true }
      }
    })

    if (!space) {
      return NextResponse.json({ success: false, error: 'Invalid or expired link' }, { status: 404 })
    }

    const linkConfig = Array.isArray(space.publicAccess)
      ? space.publicAccess.find((l: any) => l.shareLink === shareLink && l.enabled !== false)
      : space.publicAccess

    if (!linkConfig) {
      return NextResponse.json({ success: false, error: 'Link not found' }, { status: 404 })
    }

    if (!linkConfig.requireNDA) {
      // NDA not required for this link — just return success so portal can proceed
      console.log('ℹ️  NDA not required for this link, passing through')
      return NextResponse.json({ success: true, message: 'NDA not required' })
    }

    const now = new Date()
    const ip  = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown'

    // 2. Check if already signed (idempotent)
    const existing = await db.collection('ndaSignatures').findOne({
      shareLink,
      email: email.toLowerCase(),
    })

    if (existing) {
      console.log('✅ NDA already signed by:', email)
      return NextResponse.json({ success: true, message: 'Already signed', alreadySigned: true })
    }

    // 3. Record the signature
    await db.collection('ndaSignatures').insertOne({
      spaceId:         space._id,
      shareLink,
      email:           email.toLowerCase(),
      ndaDocumentUrl:  linkConfig.ndaDocumentUrl || null,
      ndaDocumentName: linkConfig.ndaDocumentName || null,
      signedAt:        now,
      ipAddress:       ip,
      userAgent:       request.headers.get('user-agent') || 'unknown',
    })

    // 4. Also log to activityLogs so it shows in analytics
    await db.collection('activityLogs').insertOne({
      spaceId:         space._id,
      shareLink,
      visitorEmail:    email.toLowerCase(),
      performedBy:     email.toLowerCase(),
      performedByRole: 'visitor',
      event:           'nda_signed',
      documentId:      null,
      documentName:    linkConfig.ndaDocumentName || 'NDA',
      timestamp:       now,
      ipAddress:       ip,
      userAgent:       request.headers.get('user-agent') || 'unknown',
      meta: {
        ndaDocumentUrl:  linkConfig.ndaDocumentUrl || null,
        ndaDocumentName: linkConfig.ndaDocumentName || null,
      }
    })

    console.log('✅ NDA signed by:', email, '| Space:', space.name, '| Link:', shareLink)

    return NextResponse.json({
      success:  true,
      message:  'NDA signed successfully',
      signedAt: now.toISOString(),
    })

  } catch (err) {
    console.error('❌ NDA sign error:', err)
    return NextResponse.json({ success: false, error: 'Failed to record NDA signature' }, { status: 500 })
  }
}

// GET — check if a visitor has already signed the NDA for this link
// Used by portal to skip the NDA step on return visits
export async function GET(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params    = context.params instanceof Promise ? await context.params : context.params
    const shareLink = params.shareLink
    const email     = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ signed: false, error: 'Email required' }, { status: 400 })
    }

    const db = await dbPromise

    const signature = await db.collection('ndaSignatures').findOne({
      shareLink,
      email: email.toLowerCase(),
    })

    return NextResponse.json({
      signed:   !!signature,
      signedAt: signature?.signedAt || null,
    })

  } catch (err) {
    console.error('❌ NDA check error:', err)
    return NextResponse.json({ signed: false, error: 'Server error' }, { status: 500 })
  }
}