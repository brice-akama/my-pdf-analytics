// lib/dailyDigest.ts
//
// Sends each rep a daily summary of activity across their documents.
// NO CRON — this is called fire-and-forget from two existing traffic
// points (a buyer opening a shared doc, and the rep loading their own
// dashboard), the same "piggyback on real traffic" pattern already
// used by checkSilentDeals in checkSilentDeals.ts.
//
// Every layer of this is wrapped so a failure here can NEVER surface
// to the user or break the request that triggered it — same contract
// as checkSilentDeals: log and move on, never throw upward.

import { sendDailyDigestEmail } from './documentNotifications'

const DIGEST_INTERVAL_MS = 24 * 60 * 60 * 1000
const BATCH_SIZE = 5 // keep each sweep cheap regardless of which route triggered it

export async function checkAndSendDailyDigests(db: any) {
  try {
    const cutoff = new Date(Date.now() - DIGEST_INTERVAL_MS)

    // Due = never sent one, or last one was 24h+ ago. digestEnabled is
    // opt-out — missing the field (pre-existing users) counts as enabled.
    const dueUsers = await db.collection('users').find({
      digestEnabled: { $ne: false },
      $or: [
        { lastDigestSentAt: null },
        { lastDigestSentAt: { $exists: false } },
        { lastDigestSentAt: { $lte: cutoff } },
      ],
    }).limit(BATCH_SIZE).toArray()

    for (const user of dueUsers) {
      try {
        await sendDigestForUser(db, user)
      } catch (innerErr) {
        // One user's digest failing never blocks the rest of the batch
        console.error('[DailyDigest] user error:', innerErr)
        continue
      }
    }
  } catch (err) {
    // Entire sweep fails silently — this must never affect whatever
    // route (track/session_start or auth/me) called it
    console.error('[DailyDigest] outer error:', err)
  }
}

async function sendDigestForUser(db: any, user: any) {
  const userId = user._id?.toString() || user.id
  if (!userId) return

  const since = user.lastDigestSentAt
    ? new Date(user.lastDigestSentAt)
    : new Date(Date.now() - DIGEST_INTERVAL_MS)

  // Stamp immediately, before doing any work. If the send fails below,
  // this user simply skips today's digest rather than retrying on every
  // subsequent page load/view — quiet degradation over noisy retries.
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { lastDigestSentAt: new Date() } }
  )

  const docs = await db.collection('documents').find({
    userId,
    archived: { $ne: true },
  }).project({ originalFilename: 1, filename: 1 }).toArray()

  if (docs.length === 0) return

  const docIds = docs.map((d: any) => d._id.toString())

  // Single aggregation across all of this rep's documents — cheap
  // regardless of how many docs they have, one query not N queries.
  const activity = await db.collection('analytics_logs').aggregate([
    {
      $match: {
        documentId: { $in: docIds },
        timestamp: { $gte: since },
        action: { $in: ['document_viewed', 'page_view'] },
      },
    },
    {
      $group: {
        _id: '$documentId',
        views: { $sum: { $cond: [{ $eq: ['$action', 'document_viewed'] }, 1, 0] } },
        totalViewTime: { $sum: { $ifNull: ['$viewTime', 0] } },
        viewTimeSamples: { $sum: { $cond: [{ $eq: ['$action', 'page_view'] }, 1, 0] } },
        viewers: { $addToSet: '$email' },
      },
    },
  ]).toArray().catch(() => [])

  if (!activity || activity.length === 0) return // nothing happened — send nothing, per digest rule #1

  const activityByDoc = new Map(activity.map((a: any) => [a._id, a]))
  const allViewers = new Set<string>()
  let totalViewsToday = 0

  const documentsForEmail = docs
    .map((d: any) => {
      const a: any = activityByDoc.get(d._id.toString())
      if (!a || a.views === 0) return null
      ;(a.viewers || []).forEach((v: string) => { if (v) allViewers.add(v) })
      totalViewsToday += a.views
      return {
        name: d.originalFilename || d.filename || 'Untitled',
        id: d._id.toString(),
        viewsToday: a.views,
        topViewer: (a.viewers || []).find((v: string) => !!v) || undefined,
        avgTimeSeconds: a.viewTimeSamples > 0
          ? Math.round(a.totalViewTime / a.viewTimeSamples)
          : 0,
      }
    })
    .filter(Boolean)
    .sort((x: any, y: any) => y.viewsToday - x.viewsToday)

  if (documentsForEmail.length === 0 || totalViewsToday === 0) return

  const profile = await db.collection('profiles').findOne({ user_id: userId }).catch(() => null)
  const ownerEmail = user.email || profile?.email
  if (!ownerEmail) return

  await sendDailyDigestEmail({
    ownerEmail,
    ownerName: profile?.full_name || profile?.first_name || undefined,
    documents: documentsForEmail as any,
    totalViewsToday,
    totalUniqueViewersToday: allViewers.size,
  }).catch((err: unknown) => console.error('[DailyDigest] send failed:', err))
}