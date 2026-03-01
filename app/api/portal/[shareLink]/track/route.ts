// app/api/portal/[shareLink]/track/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendPortalNotification } from '@/lib/emails/portal-notifications';
import { isHubSpotConnected } from '@/lib/integrations/hubspotSync';
import { syncPortalEventToHubSpot } from '@/lib/integrations/hubspotSync';
import { isSlackConnected, notifyPortalEvent } from '@/lib/integrations/slack';

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

    const space = await db.collection('spaces').findOne({
      $or: [
        { publicAccess: { $elemMatch: { shareLink } } },
        { 'publicAccess.shareLink': shareLink },
      ]
    });

    if (!space) {
      return NextResponse.json({ success: true, warning: 'Space not found' });
    }

    // ── HEARTBEAT ─────────────────────────────────────────────────────────
    if (event === 'page_heartbeat') {
      if (!documentId || !sessionId) {
        return NextResponse.json({ success: true, warning: 'Missing heartbeat fields' });
      }
      await db.collection('diligenceLogs').updateOne(
        { spaceId: space._id, sessionId },
        {
          $set: {
            spaceId, shareLink, sessionId,
            documentId:    new ObjectId(documentId),
            documentName:  documentName || null,
            visitorEmail:  email || null,
            lastHeartbeat: new Date(),
            totalSeconds:  totalSeconds || 0,
          },
          $setOnInsert: { startedAt: new Date() }
        },
        { upsert: true }
      );
      return NextResponse.json({ success: true });
    }

    // ── REGULAR EVENT: write to activityLogs ──────────────────────────────
    await db.collection('activityLogs').insertOne({
      spaceId:      space._id,
      shareLink,
      visitorEmail: email || null,
      event,
      documentId:   documentId ? new ObjectId(documentId) : null,
      documentName: documentName || null,
      timestamp:    new Date(),
      ipAddress:    request.headers.get('x-forwarded-for') || 'unknown',
      userAgent:    request.headers.get('user-agent') || 'unknown',
    });

    // Increment view counter
    const viewEvents = ['document_view', 'portal_enter'];
    if (viewEvents.includes(event)) {
      await db.collection('spaces').updateOne(
        { _id: space._id, 'publicAccess.shareLink': shareLink },
        { $inc: { 'publicAccess.$.currentViews': 1 } }
      ).catch(() => {});
    }

    // Seed diligence session on document_view
    if (event === 'document_view' && documentId) {
      const newSessionId = `${email || 'anon'}-${documentId}-${Date.now()}`;
      await db.collection('diligenceLogs').insertOne({
        spaceId: space._id,
        shareLink,
        sessionId:     newSessionId,
        documentId:    new ObjectId(documentId),
        documentName:  documentName || null,
        visitorEmail:  email || null,
        startedAt:     new Date(),
        lastHeartbeat: new Date(),
        totalSeconds:  0,
      });
    }

   // ── EMAIL + HUBSPOT NOTIFICATIONS ────────────────────────────────────
const notifyEvents = ['portal_enter', 'document_view', 'download'];
if (email && notifyEvents.includes(event)) {
  try {
    const owner = await db.collection('users').findOne({
      _id: space.userId ? new ObjectId(space.userId) : space._id
    });

    const ownerEmail = owner?.email || space.ownerEmail;

    // Don't notify if owner is viewing their own space
    if (ownerEmail && ownerEmail !== email) {

      // Check revisit
      const priorVisits = await db.collection('activityLogs').countDocuments({
        spaceId:      space._id,
        visitorEmail: email,
        event:        'portal_enter',
      });
      const isRevisit  = event === 'portal_enter' && priorVisits > 1;
      const finalEvent = isRevisit ? 'revisit' : event as any;

      // Share link label
      const publicAccessList = Array.isArray(space.publicAccess)
        ? space.publicAccess
        : space.publicAccess ? [space.publicAccess] : [];
      const linkObj    = publicAccessList.find((pa: any) => pa.shareLink === shareLink);
      const shareLabel = linkObj?.label || null;

      // ── 1. Email notification (always) ─────────────────────────────
      await sendPortalNotification({
        ownerEmail,
        spaceName:    space.name,
        visitorEmail: email,
        event:        finalEvent,
        documentName: documentName || undefined,
        shareLabel:   shareLabel   || undefined,
        spaceId:      space._id.toString(),
        appUrl:       process.env.NEXT_PUBLIC_APP_URL,
      });

      // ── 2. HubSpot sync (only if owner has HubSpot connected) ──────
const ownerId = owner?._id?.toString() || space.userId;
console.log('🔍 HubSpot check — ownerId:', ownerId, '| visitorEmail:', email, '| event:', finalEvent);

if (!ownerId) {
  console.log('⚠️ HubSpot skipped — could not resolve ownerId from owner or space.userId');
} else {
  const hubspotConnected = await isHubSpotConnected(ownerId);
  console.log('🔌 HubSpot connected for ownerId', ownerId, ':', hubspotConnected);

  if (!hubspotConnected) {
    console.log('⚠️ HubSpot skipped — owner has no active HubSpot integration');
  } else {
    console.log('📤 Sending to HubSpot — contact:', email, '| space:', space.name, '| event:', finalEvent);
    const result = await syncPortalEventToHubSpot({
      userId:       ownerId,
      visitorEmail: email,
      spaceName:    space.name,
      event:        finalEvent,
      documentName: documentName || undefined,
      isRevisit,
      visitCount:   isRevisit ? priorVisits + 1 : 1,
    }).catch(err => {
      console.error('📊 HubSpot sync threw an error:', err);
      return { success: false, error: err };
    });
    console.log('📊 HubSpot sync result:', JSON.stringify(result));
  }
}
    }
  } catch (emailErr) {
    console.error('📧 Notification failed:', emailErr);
  }
}
    return NextResponse.json({ success: true });


    // ── 3. Slack notification (only if owner has Slack connected) ───
const slackConnected = await isSlackConnected(ownerId);
console.log('💬 Slack connected for ownerId', ownerId, ':', slackConnected);

if (slackConnected) {
  console.log('📤 Sending to Slack — visitor:', email, '| event:', finalEvent);
  await notifyPortalEvent({
    userId:       ownerId,
    visitorEmail: email,
    spaceName:    space.name,
    spaceId:      space._id.toString(),
    event:        finalEvent,
    documentName: documentName || undefined,
    isRevisit,
    visitCount:   isRevisit ? priorVisits + 1 : 1,
  }).catch(err => {
    console.error('💬 Slack notification failed silently:', err);
  });
} else {
  console.log('⚠️ Slack skipped — owner has no active Slack integration or no channel set');
}

  } catch (error) {
    console.error('❌ Track error:', error);
    return NextResponse.json({ success: true, warning: 'Track failed silently' });
  }
}