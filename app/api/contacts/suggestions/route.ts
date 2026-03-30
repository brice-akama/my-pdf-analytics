// app/api/contacts/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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

    // ── 1. Contacts ───────────────────────────────────────────────────────
    const contacts = await db
      .collection('contacts')
      .find({ userId: user.id })
      .project({ email: 1, name: 1, _id: 0 })
      .limit(200)
      .toArray();

    console.log(`📇 [suggestions] Contacts: ${contacts.length}`);
    console.log('📇 [suggestions] Sample contact:', contacts[0]);

    // ── 2. Viewers ────────────────────────────────────────────────────────
    const userDocuments = await db
      .collection('documents')
      .find({ userId: user.id })
      .project({ _id: 1 })
      .toArray();

    const documentIds = userDocuments.map((d) => d._id.toString());

    const viewers = await db
      .collection('viewer_identities')
      .find({
        documentId: { $in: documentIds },
        // ✅ FIX: Also exclude null emails at the DB level, not just empty strings
        email: { $exists: true, $ne: '', $ne: null },
      })
      .project({ email: 1, lastSeen: 1, visitCount: 1, _id: 0 })
      .sort({ lastSeen: -1 })
      .limit(300)
      .toArray();

    console.log(`👁️ [suggestions] Viewers: ${viewers.length}`);
    console.log('👁️ [suggestions] Sample viewer:', viewers[0]);

    // ── 3. Past shares ────────────────────────────────────────────────────
    const pastShares = await db
      .collection('shares')
      .find({ userId: user.id, recipientEmail: { $ne: null } })
      .project({ recipientEmail: 1, recipientName: 1, _id: 0 })
      .limit(500)
      .toArray();

    console.log(`🔗 [suggestions] Past shares: ${pastShares.length}`);
    console.log('🔗 [suggestions] Sample share:', pastShares[0]);
    console.log('🔗 [suggestions] All share names:',
      pastShares.map(s => ({ email: s.recipientEmail, name: s.recipientName }))
    );

    // ── 4. Build emailMap ─────────────────────────────────────────────────
    const emailMap = new Map<string, ContactSuggestion>();

    // Shares first (lowest priority — will be overwritten by contacts)
    for (const s of pastShares) {
      // ✅ FIX: Guard against null/undefined recipientEmail before calling .toLowerCase()
      if (!s.recipientEmail) continue;
      const key = s.recipientEmail.toLowerCase();
      emailMap.set(key, {
        email: s.recipientEmail,
        name: s.recipientName || null,
        source: 'viewer',
      });
    }

    // Viewers
    for (const v of viewers) {
      // ✅ FIX: Guard against null/undefined email before calling .toLowerCase()
      if (!v.email) continue;
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
        const existing = emailMap.get(key)!;
        existing.visitCount = v.visitCount || 1;
        existing.lastSeen = v.lastSeen?.toISOString?.() || null;
      }
    }

    // Contacts last (highest priority — overwrites everything)
    for (const c of contacts) {
      // ✅ FIX: Guard against null/undefined email before calling .toLowerCase()
      if (!c.email) continue;
      emailMap.set(c.email.toLowerCase(), {
        email: c.email,
        name: c.name || null,
        source: 'contact',
      });
    }

    // File requests
    try {
      const pastFileRequests = await db
        .collection('fileRequests')
        .find({ userId: new ObjectId(user.id) })
        .project({ 'recipients.email': 1, 'recipients.name': 1, _id: 0 })
        .toArray();

      for (const fr of pastFileRequests) {
        for (const r of (fr.recipients || [])) {
          // ✅ FIX: Guard against null/undefined email before calling .toLowerCase()
          if (!r.email) continue;
          const key = r.email.toLowerCase();
          if (!emailMap.has(key)) {
            emailMap.set(key, {
              email: r.email,
              name: r.name || null,
              source: 'viewer',
            });
          }
        }
      }
    } catch {
      // collection may not exist
    }

    const suggestions = Array.from(emailMap.values()).sort((a, b) => {
      if (a.name && !b.name) return -1;
      if (!a.name && b.name) return 1;
      if (a.lastSeen && b.lastSeen) {
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }
      return 0;
    });

    console.log(` [suggestions] Total suggestions: ${suggestions.length}`);
    console.log(' [suggestions] Sample final suggestions:', suggestions.slice(0, 3));

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error('❌ [suggestions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}