// lib/integrations/hubspotSync.ts
import { getValidHubSpotToken } from './hubspot';
import { dbPromise } from '@/app/api/lib/mongodb';

// ── Helpers ───────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

// ── Find HubSpot contact by email ─────────────────────────────────
async function findHubSpotContact(
  token: string,
  email: string
): Promise<string | null> {
  try {
    const res = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: email,
            }],
          }],
          properties: ['email', 'firstname', 'lastname'],
          limit: 1,
        }),
      }
    );
    const data = await res.json();
    return data.results?.[0]?.id || null;
  } catch {
    return null;
  }
}

// ── Update contact properties ─────────────────────────────────────
async function updateContactProperties(
  token: string,
  contactId: string,
  properties: Record<string, string>
) {
  await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });
}

// ── Create a note on a contact ────────────────────────────────────
async function createContactNote(
  token: string,
  contactId: string,
  noteBody: string,
  timestamp: Date
) {
  try {
    const noteRes = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          hs_note_body: noteBody,
          hs_timestamp: timestamp.getTime().toString(),
        },
      }),
    });

    if (!noteRes.ok) return null;
    const noteData = await noteRes.json();
    const noteId = noteData.id;

    await fetch(
      `https://api.hubapi.com/crm/v3/objects/notes/${noteId}/associations/contacts/${contactId}/note_to_contact`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
    );

    return noteId;
  } catch (err) {
    console.error('HubSpot note error:', err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// SYNC 1 — Document Opened
// ════════════════════════════════════════════════════════════════
export async function syncDocumentOpenedToHubSpot({
  userId,
  viewerEmail,
  documentName,
  documentId,
  device,
  location,
  isRevisit,
  visitCount,
}: {
  userId: string;
  viewerEmail: string;
  documentName: string;
  documentId: string;
  device?: string;
  location?: { country?: string; city?: string };
  isRevisit?: boolean;
  visitCount?: number;
}) {
  if (!viewerEmail) return { success: false, reason: 'no_email' };

  try {
    const token = await getValidHubSpotToken(userId);
    const contactId = await findHubSpotContact(token, viewerEmail);
    if (!contactId) return { success: false, reason: 'contact_not_in_hubspot' };

    const locationStr = [location?.city, location?.country].filter(Boolean).join(', ') || 'Unknown';
    const deviceLabel = device ? device.charAt(0).toUpperCase() + device.slice(1) : 'Desktop';
    const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const noteBody = [
      `DocMetrics — Document ${isRevisit ? 'Revisited' : 'Opened'}`,
      '',
      `Document: ${documentName}`,
      isRevisit ? `Visit number: ${visitCount || '—'}` : null,
      `Opened: ${now}`,
      `Device: ${deviceLabel}`,
      `Location: ${locationStr}`,
      `Analytics: ${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
    ].filter(line => line !== null).join('\n');

    await createContactNote(token, contactId, noteBody, new Date());
    await updateContactProperties(token, contactId, {
      docmetrics_last_document: documentName,
      docmetrics_last_viewed:   new Date().toISOString(),
      docmetrics_view_count:    String(visitCount || 1),
    });

    return { success: true, contactId };
  } catch (err) {
    console.error('HubSpot sync error (opened):', err);
    return { success: false, error: err };
  }
}

// ════════════════════════════════════════════════════════════════
// SYNC 2 — Document Completed
// ════════════════════════════════════════════════════════════════
export async function syncDocumentCompletedToHubSpot({
  userId,
  viewerEmail,
  documentName,
  documentId,
  totalPages,
  totalTimeSeconds,
  topPages,
  intentLevel,
}: {
  userId: string;
  viewerEmail: string;
  documentName: string;
  documentId: string;
  totalPages: number;
  totalTimeSeconds: number;
  topPages?: { page: number; timeSpent: number }[];
  intentLevel?: 'high' | 'medium' | 'low';
}) {
  if (!viewerEmail) return { success: false, reason: 'no_email' };

  try {
    const token = await getValidHubSpotToken(userId);
    const contactId = await findHubSpotContact(token, viewerEmail);
    if (!contactId) return { success: false, reason: 'contact_not_in_hubspot' };

    const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const engagementLabel = intentLevel
      ? intentLevel.charAt(0).toUpperCase() + intentLevel.slice(1)
      : '—';

    const topPagesLines = topPages && topPages.length > 0
      ? topPages.slice(0, 3).map(p => `  Page ${p.page}: ${formatTime(p.timeSpent)}`).join('\n')
      : '  No page data';

    const noteBody = [
      'DocMetrics — Document Completed',
      '',
      `Document: ${documentName}`,
      `Viewer: ${viewerEmail}`,
      `Total time: ${formatTime(totalTimeSeconds)}`,
      `Pages read: ${totalPages}/${totalPages}`,
      `Engagement: ${engagementLabel}`,
      `Completed: ${now}`,
      '',
      'Pages by time spent:',
      topPagesLines,
      '',
      `Analytics: ${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
    ].join('\n');

    await createContactNote(token, contactId, noteBody, new Date());
    await updateContactProperties(token, contactId, {
      docmetrics_last_document:   documentName,
      docmetrics_last_viewed:     new Date().toISOString(),
      docmetrics_total_read_time: formatTime(totalTimeSeconds),
      docmetrics_intent_level:    engagementLabel,
      docmetrics_completed_read:  'true',
    });

    return { success: true, contactId };
  } catch (err) {
    console.error('HubSpot sync error (completed):', err);
    return { success: false, error: err };
  }
}

// ════════════════════════════════════════════════════════════════
// SYNC 3 — Engagement Summary
// ════════════════════════════════════════════════════════════════
export async function syncEngagementSummaryToHubSpot({
  userId,
  viewerEmail,
  documentName,
  documentId,
  sessionDurationSeconds,
  pagesViewed,
  totalPages,
  device,
}: {
  userId: string;
  viewerEmail: string;
  documentName: string;
  documentId: string;
  sessionDurationSeconds: number;
  pagesViewed: number[];
  totalPages: number;
  device?: string;
}) {
  if (!viewerEmail || sessionDurationSeconds < 5) {
    return { success: false, reason: 'too_short_or_no_email' };
  }

  try {
    const token = await getValidHubSpotToken(userId);
    const contactId = await findHubSpotContact(token, viewerEmail);
    if (!contactId) return { success: false, reason: 'contact_not_in_hubspot' };

    const completionPct = totalPages > 0
      ? Math.round((pagesViewed.length / totalPages) * 100)
      : 0;

    const deviceLabel = device ? device.charAt(0).toUpperCase() + device.slice(1) : 'Desktop';

    const noteBody = [
      'DocMetrics — Session Summary',
      '',
      `Document: ${documentName}`,
      `Viewer: ${viewerEmail}`,
      `Session duration: ${formatTime(sessionDurationSeconds)}`,
      `Pages reached: ${pagesViewed.length}/${totalPages} (${completionPct}%)`,
      `Device: ${deviceLabel}`,
      `Analytics: ${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
    ].join('\n');

    if (sessionDurationSeconds >= 30) {
      await createContactNote(token, contactId, noteBody, new Date());
    }

    await updateContactProperties(token, contactId, {
      docmetrics_last_document:     documentName,
      docmetrics_last_session_time: formatTime(sessionDurationSeconds),
      docmetrics_completion_rate:   `${completionPct}%`,
    });

    return { success: true, contactId };
  } catch (err) {
    console.error('HubSpot sync error (session end):', err);
    return { success: false, error: err };
  }
}

// ════════════════════════════════════════════════════════════════
// SYNC 4 — Space / Portal Event
// ════════════════════════════════════════════════════════════════
export async function syncPortalEventToHubSpot({
  userId,
  visitorEmail,
  spaceName,
  event,
  documentName,
  isRevisit,
  visitCount,
}: {
  userId: string;
  visitorEmail: string;
  spaceName: string;
  event: 'document_open' | 'revisit' | 'document_view' | 'download' | 'portal_enter';
  documentName?: string;
  isRevisit?: boolean;
  visitCount?: number;
}) {
  if (!visitorEmail) return { success: false, reason: 'no_email' };

  try {
    const token = await getValidHubSpotToken(userId);
    const contactId = await findHubSpotContact(token, visitorEmail);
    if (!contactId) return { success: false, reason: 'contact_not_in_hubspot' };

    const normalised = event === 'portal_enter' ? 'document_open' : event;
    const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const titleMap: Record<string, string> = {
      document_open: 'Space Opened',
      revisit:       `Space Revisited${visitCount ? ` — Visit ${visitCount}` : ''}`,
      document_view: 'Document Viewed',
      download:      'Document Downloaded',
    };

    const lines = [
      `DocMetrics — ${titleMap[normalised] || 'Space Event'}`,
      '',
      `Visitor: ${visitorEmail}`,
      `Space: ${spaceName}`,
      documentName ? `Document: ${documentName}` : null,
      isRevisit && visitCount ? `Visit number: ${visitCount}` : null,
      `Time: ${now}`,
    ].filter(line => line !== null).join('\n');

    await createContactNote(token, contactId, lines, new Date());
    await updateContactProperties(token, contactId, {
      docmetrics_last_document: documentName || spaceName,
      docmetrics_last_viewed:   new Date().toISOString(),
    });

    return { success: true, contactId };
  } catch (err) {
    console.error('HubSpot sync error (portal event):', err);
    return { success: false, error: err };
  }
}

// ════════════════════════════════════════════════════════════════
// HELPER — Check if HubSpot is connected
// ════════════════════════════════════════════════════════════════
export async function isHubSpotConnected(userId: string): Promise<boolean> {
  try {
    const db = await dbPromise;
    const integration = await db.collection('integrations').findOne({
      userId,
      provider: 'hubspot',
      isActive: true,
    });
    return !!integration;
  } catch {
    return false;
  }
}