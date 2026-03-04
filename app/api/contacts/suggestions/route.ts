// app/api/contacts/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';

export interface ContactSuggestion {
  email: string;
  name: string | null;
  source: 'contact' | 'viewer';
  visitCount?: number;
  lastSeen?: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await dbPromise;

    // ── 1. Fetch manually added contacts ──────────────────────────────────
    const contacts = await db
      .collection('contacts')
      .find({ userId: user.id })
      .project({ email: 1, name: 1, _id: 0 })
      .limit(200)
      .toArray();

    // ── 2. Fetch auto-captured viewers from this user's shared documents ──
    // First, get all documentIds owned by this user
    const userDocuments = await db
      .collection('documents')
      .find({ userId: user.id })
      .project({ _id: 1 })
      .toArray();

    const documentIds = userDocuments.map((d) => d._id.toString());

    // Then get viewer identities for those documents (with emails only)
    const viewers = await db
      .collection('viewer_identities')
      .find({
        documentId: { $in: documentIds },
        email: { $exists: true, $ne: null, $ne: '' },
      })
      .project({ email: 1, lastSeen: 1, visitCount: 1, _id: 0 })
      .sort({ lastSeen: -1 })
      .limit(300)
      .toArray();

      // ── 3. Past file request recipients ──────────────────────────────────
const pastFileRequests = await db
  .collection('fileRequests')
  .find({ userId: new ObjectId(user.id) })
  .project({ 'recipients.email': 1, _id: 0 })
  .toArray();

for (const fr of pastFileRequests) {
  for (const r of (fr.recipients || [])) {
    if (!r.email) continue;
    const key = r.email.toLowerCase();
    if (!emailMap.has(key)) {
      emailMap.set(key, {
        email: r.email,
        name: null,
        source: 'viewer',
      });
    }
  }
}

    // ── 3. Merge + deduplicate, contacts take priority ────────────────────
    const emailMap = new Map<string, ContactSuggestion>();

    // Add contacts first (they have names, higher priority)
    for (const c of contacts) {
      if (c.email) {
        emailMap.set(c.email.toLowerCase(), {
          email: c.email,
          name: c.name || null,
          source: 'contact',
        });
      }
    }

    // Add viewers (only if email not already in map from contacts)
    for (const v of viewers) {
      const key = v.email.toLowerCase();
      if (!emailMap.has(key)) {
        emailMap.set(key, {
          email: v.email,
          name: null,
          source: 'viewer',
          visitCount: v.visitCount || 1,
          lastSeen: v.lastSeen?.toISOString?.() || null,
        });
      } else {
        // Contact already exists — enrich with visit data if useful
        const existing = emailMap.get(key)!;
        existing.visitCount = v.visitCount || 1;
        existing.lastSeen = v.lastSeen?.toISOString?.() || null;
      }
    }

    // ── 4. Sort: contacts with names first, then by recency ───────────────
    const suggestions = Array.from(emailMap.values()).sort((a, b) => {
      // Named contacts always first
      if (a.name && !b.name) return -1;
      if (!a.name && b.name) return 1;
      // Then by recency
      if (a.lastSeen && b.lastSeen) {
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }
      return 0;
    });

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error('❌ Suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}