// lib/spaceAccessGuard.ts
//
// Central enforcement layer for space access rules.
// Call checkSpaceAccess() at the TOP of any route that serves space content.
//
// Enforces:
//   1. Auto-expire  — revokes access if expiryDate has passed
//   2. NDA gate     — blocks access if requireNDA=true and visitor hasn't signed
//   3. View notify  — fires email to owner when a new visitor enters
//
// Usage:
//   const guard = await checkSpaceAccess(space, visitorEmail, db)
//   if (!guard.allowed) return NextResponse.json({ error: guard.reason, code: guard.code }, { status: 403 })

import { Db } from 'mongodb'
import { sendSpaceViewNotification } from './emailService'

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: string; code: 'EXPIRED' | 'NDA_REQUIRED' | 'NO_ACCESS' }

export async function checkSpaceAccess(
  space: any,
  visitorEmail: string,
  db: Db
): Promise<AccessResult> {

  // ─── 1. AUTO-EXPIRE CHECK ──────────────────────────────────────────────────
  if (space.settings?.autoExpiry && space.settings?.expiryDate) {
    const expiry = new Date(space.settings.expiryDate)
    if (new Date() > expiry) {
      console.log(`⏰ Space ${space._id} expired on ${expiry.toISOString()}`)

      // Auto-archive the space so it stops being accessible
      await db.collection('spaces').updateOne(
        { _id: space._id },
        { $set: { status: 'archived', archivedReason: 'auto_expired', updatedAt: new Date() } }
      )

      return {
        allowed: false,
        reason: 'This data room has expired and is no longer accessible.',
        code: 'EXPIRED'
      }
    }
  }

  // ─── 2. NDA GATE ──────────────────────────────────────────────────────────
  if (space.ndaSettings?.enabled && space.ndaSettings?.signingRequired) {
    const hasSigned = space.ndaSignatures?.some(
      (sig: any) => sig.email?.toLowerCase() === visitorEmail?.toLowerCase()
    )

    if (!hasSigned) {
      console.log(`📝 NDA required for space ${space._id}, visitor ${visitorEmail} has not signed`)
      return {
        allowed: false,
        reason: 'You must sign the NDA before accessing this data room.',
        code: 'NDA_REQUIRED'
      }
    }
  }

  // ─── 3. VIEW NOTIFICATION ─────────────────────────────────────────────────
  // Only fire if this is a NEW visitor (not seen in last 24h to avoid spam)
  if (space.settings?.notifyOnView) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentVisit = space.visitors?.find(
        (v: any) =>
          v.email?.toLowerCase() === visitorEmail?.toLowerCase() &&
          new Date(v.lastVisit) > oneDayAgo
      )

      if (!recentVisit) {
        // Update visitor log first (fire-and-forget the email)
        await db.collection('spaces').updateOne(
          { _id: space._id },
          {
            $push: {
              visitors: {
                email: visitorEmail,
                firstVisit: new Date(),
                lastVisit: new Date(),
                visitCount: 1
              }
            } as any,
            $set: { lastActivity: new Date() }
          }
        )

        // Send notification email (non-blocking)
        sendSpaceViewNotification({
          ownerEmail: space.owner?.email || space.userId,
          spaceName: space.name,
          visitorEmail,
          spaceId: space._id.toString()
        }).catch((err: any) => console.error('View notification email failed:', err))

      } else {
        // Just update lastVisit + increment count
        await db.collection('spaces').updateOne(
          { _id: space._id, 'visitors.email': visitorEmail },
          {
            $set: {
              'visitors.$.lastVisit': new Date(),
              lastActivity: new Date()
            },
            $inc: { 'visitors.$.visitCount': 1 }
          }
        )
      }
    } catch (err) {
      // Never block access because of notification failure
      console.error('View tracking error:', err)
    }
  }

  return { allowed: true }
}