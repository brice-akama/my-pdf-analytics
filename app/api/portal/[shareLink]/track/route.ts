// app/api/portal/[shareLink]/track/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';

function normalizeEvent(event: string): string {
  const map: Record<string, string> = {
    'portal_opened':     'portal_enter',
    'portal_open':       'portal_enter',
    'space_open':        'portal_enter',
    'document_viewed':   'document_view',
    'doc_view':          'document_view',
    'view':              'document_view',
    'file_download':     'download',
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

    // shareLink comes from the URL — this is the ground truth
    const shareLink = params.shareLink;

    const body = await request.json();
    const {
      email,
      event: rawEvent,
      documentId,
      documentName,
      sessionId,
      secondsOnPage,
      totalSeconds,
    } = body;

    const event = normalizeEvent(rawEvent || '');

    const db = await dbPromise;

    // Find space — supports both old (object) and new (array) publicAccess format
    const space = await db.collection('spaces').findOne({
      $or: [
        { publicAccess: { $elemMatch: { shareLink } } },
        { 'publicAccess.shareLink': shareLink },
      ]
    });

    if (!space) {
      // Return 200 — never break the portal UX over a tracking failure
      return NextResponse.json({ success: true, warning: 'Space not found' });
    }

    // ── HEARTBEAT: upsert into diligenceLogs ─────────────────────────────────
    // Key: sessionId is unique per (email + documentId + open-timestamp)
    // We upsert so rapid heartbeats just update totalSeconds in place
    if (event === 'page_heartbeat') {
      if (!documentId || !sessionId) {
        return NextResponse.json({ success: true, warning: 'Missing heartbeat fields' });
      }

      await db.collection('diligenceLogs').updateOne(
        {
          spaceId:    space._id,
          sessionId,                        // unique key per session
        },
        {
          $set: {
            spaceId:       space._id,
            shareLink,                      // ← ALWAYS saved from URL param
            sessionId,
            documentId:    new ObjectId(documentId),
            documentName:  documentName || null,
            visitorEmail:  email || null,
            lastHeartbeat: new Date(),
            totalSeconds:  totalSeconds || 0,
          },
          $setOnInsert: {
            startedAt: new Date(),
          }
        },
        { upsert: true }
      );

      return NextResponse.json({ success: true });
    }

    // ── REGULAR EVENT: write to activityLogs ──────────────────────────────────
    await db.collection('activityLogs').insertOne({
      spaceId:      space._id,
      shareLink,                            // ← always from URL param
      visitorEmail: email || null,
      event,
      documentId:   documentId ? new ObjectId(documentId) : null,
      documentName: documentName || null,
      timestamp:    new Date(),
      ipAddress:    request.headers.get('x-forwarded-for') || 'unknown',
      userAgent:    request.headers.get('user-agent') || 'unknown',
    });

    // Increment view counter on the link object
    const viewEvents = ['document_view', 'portal_enter'];
    if (viewEvents.includes(event)) {
      await db.collection('spaces').updateOne(
        { _id: space._id, 'publicAccess.shareLink': shareLink },
        { $inc: { 'publicAccess.$.currentViews': 1 } }
      ).catch(() => {}); // silent — old format spaces won't match
    }

    // ── On document_view: also create initial diligence session ───────────────
    // This seeds the session BEFORE the first heartbeat arrives (10s delay).
    // Critical: we save shareLink here so the diligence aggregation can group
    // "john@vc.com via Sequoia link" separately from "john@vc.com via Tiger link".
    if (event === 'document_view' && documentId) {
      const newSessionId = `${email || 'anon'}-${documentId}-${Date.now()}`;

      await db.collection('diligenceLogs').insertOne({
        spaceId:       space._id,
        shareLink,                          // ← THE FIX: was missing before
        sessionId:     newSessionId,
        documentId:    new ObjectId(documentId),
        documentName:  documentName || null,
        visitorEmail:  email || null,
        startedAt:     new Date(),
        lastHeartbeat: new Date(),
        totalSeconds:  0,                   // will be updated by heartbeats
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Track error:', error);
    // Always return 200 — tracking must never break portal UX
    return NextResponse.json({ success: true, warning: 'Track failed silently' });
  }
}