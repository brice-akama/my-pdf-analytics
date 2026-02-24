// app/api/spaces/[id]/nda-sign/route.ts
//
// Called by the frontend NDA signing UI when a visitor accepts the NDA.
// Records the signature in the space's ndaSignatures array,
// then notifies the space owner.

import { NextRequest, NextResponse } from 'next/server'
import { verifyUserFromRequest } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { dbPromise } from '../../../lib/mongodb'
import { sendNdaSignedNotification } from '@/lib/emailService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authUser = await verifyUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid space ID' }, { status: 400 })
    }

    const body = await request.json()
    const { signerName, agreedToTerms } = body

    if (!agreedToTerms) {
      return NextResponse.json({ error: 'You must agree to the NDA terms' }, { status: 400 })
    }

    const db = await dbPromise

    const space = await db.collection('spaces').findOne({ _id: new ObjectId(id) })
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    // Check NDA is actually required for this space
    if (!space.ndaSettings?.enabled) {
      return NextResponse.json({ error: 'NDA is not required for this space' }, { status: 400 })
    }

    // Check if already signed
    const alreadySigned = space.ndaSignatures?.some(
      (sig: any) => sig.email?.toLowerCase() === authUser.email?.toLowerCase()
    )
    if (alreadySigned) {
      // Already signed — just let them through
      return NextResponse.json({ success: true, message: 'NDA already signed' })
    }

    const signedAt = new Date()

    // Record the signature
    await db.collection('spaces').updateOne(
      { _id: new ObjectId(id) },
      {
        $push: {
          ndaSignatures: {
            email: authUser.email,
            name: signerName || authUser.email,
            signedAt,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        } as any,
        $set: { updatedAt: new Date() }
      }
    )

    console.log(`✅ NDA signed by ${authUser.email} for space ${id}`)

    // Notify space owner (non-blocking)
    const ownerEmail = space.owner?.email || space.userId
    if (ownerEmail && typeof ownerEmail === 'string' && ownerEmail.includes('@')) {
      sendNdaSignedNotification({
        ownerEmail,
        spaceName: space.name,
        signerEmail: authUser.email,
        signerName: signerName || undefined,
        spaceId: id,
        signedAt
      }).catch(err => console.error('NDA notification email failed:', err))
    }

    return NextResponse.json({
      success: true,
      message: 'NDA signed successfully. You now have access to the data room.',
      signedAt: signedAt.toISOString()
    })

  } catch (error) {
    console.error('NDA sign error:', error)
    return NextResponse.json({ error: 'Failed to record NDA signature' }, { status: 500 })
  }
}

// GET — check if current user has signed the NDA (used by frontend on load)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const authUser = await verifyUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await dbPromise
    const space = await db.collection('spaces').findOne(
      { _id: new ObjectId(id) },
      { projection: { ndaSettings: 1, ndaSignatures: 1, name: 1 } }
    )

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    const hasSigned = space.ndaSignatures?.some(
      (sig: any) => sig.email?.toLowerCase() === authUser.email?.toLowerCase()
    )

    return NextResponse.json({
      success: true,
      ndaRequired: space.ndaSettings?.enabled && space.ndaSettings?.signingRequired,
      hasSigned: !!hasSigned,
      ndaDocumentUrl: space.ndaSettings?.ndaDocumentUrl,
      ndaDocumentName: space.ndaSettings?.ndaDocumentName
    })

  } catch (error) {
    console.error('NDA check error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}