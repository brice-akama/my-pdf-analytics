import { Db } from 'mongodb';

// ── Milestone dedup — separate from existing notification helpers ──
// Prevents re-firing the same alert for a condition that hasn't changed.
export async function hasMilestoneFired(
  db: Db,
  type: 'deal_insight' | 'committee_growth',
  documentId: string,
  key: string // e.g. viewerId for deal_insight, or committeeSize as a string for committee_growth
): Promise<boolean> {
  try {
    const existing = await db.collection('notification_milestones').findOne({
      type, documentId, key,
    });
    return !!existing;
  } catch {
    return false; // fail open — never block a real notification due to a dedup-check error
  }
}

export async function markMilestoneFired(
  db: Db,
  type: 'deal_insight' | 'committee_growth',
  documentId: string,
  key: string
): Promise<void> {
  try {
    await db.collection('notification_milestones').updateOne(
      { type, documentId, key },
      { $set: { type, documentId, key, firedAt: new Date() } },
      { upsert: true }
    );
  } catch {
    // Silent — worst case, this milestone fires once more than ideal, never breaks anything
  }
}