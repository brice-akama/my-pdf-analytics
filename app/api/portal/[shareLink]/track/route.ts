// app/api/portal/[shareLink]/track/route.ts
 
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';

// ── Normalize whatever the portal sends → canonical event names ──────────────
// Portal sends: 'portal_opened', 'document_viewed', 'download'
// Analytics expects: 'portal_enter', 'document_view', 'download'
function normalizeEvent(event: string): string {
  const map: Record<string, string> = {
    'portal_opened':   'portal_enter',
    'portal_open':     'portal_enter',
    'space_open':      'portal_enter',
    'document_viewed': 'document_view',
    'doc_view':        'document_view',
    'view':            'document_view',
    'file_download':   'download',
    'document_download': 'download',
  };
  return map[event] || event;
}

export async function POST(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise
      ? await context.params
      : context.params;

    const shareLink = params.shareLink;
    const body = await request.json();
    const { email, event: rawEvent, documentId, documentName } = body;

    // Normalize event name so analytics counting works regardless of what portal sends
    const event = normalizeEvent(rawEvent || '');

    console.log('📊 Tracking event:', { shareLink, rawEvent, event: event, email });

    const db = await dbPromise;

    // Find space — supports BOTH old (object) and new (array) publicAccess format
    const space = await db.collection('spaces').findOne({
      $or: [
        { publicAccess: { $elemMatch: { shareLink } } },         // new array format
        { 'publicAccess.shareLink': shareLink },                  // old object format
      ]
    });

    if (!space) {
      console.warn('⚠️ Space not found for shareLink:', shareLink);
      // Return 200 anyway — don't break the portal UX just because tracking fails
      return NextResponse.json({ success: true, warning: 'Space not found' });
    }

    // ── Save the log WITH normalized event AND shareLink ─────────────────────
    await db.collection('activityLogs').insertOne({
      spaceId:       space._id,
      shareLink,                          // critical: powers per-link analytics
      visitorEmail:  email || null,
      event,                              // normalized event name
      documentId:    documentId ? new ObjectId(documentId) : null,
      documentName:  documentName || null,
      timestamp:     new Date(),
      ipAddress:     request.headers.get('x-forwarded-for') || 'unknown',
      userAgent:     request.headers.get('user-agent') || 'unknown',
    });

    // ── Increment view counter on the specific link ──────────────────────────
    const viewEvents = ['document_view', 'portal_enter'];
    if (viewEvents.includes(event)) {
      await db.collection('spaces').updateOne(
        { _id: space._id, 'publicAccess.shareLink': shareLink },
        { $inc: { 'publicAccess.$.currentViews': 1 } }
      ).catch(() => {}); // ignore if old format
    }

    console.log('✅ Event tracked:', event, '— shareLink:', shareLink);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Track error:', error);
    // Return 200 — never let tracking errors break the portal
    return NextResponse.json({ success: true, warning: 'Track failed silently' });
  }
}