// lib/integrations/hubspotSync.ts
import { getValidHubSpotToken } from './hubspot';
import { dbPromise } from '@/app/api/lib/mongodb';

// ── Helpers ───────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

// ── Find HubSpot contact ID by email ─────────────────────────────
async function findHubSpotContact(
  token: string,
  email: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/search`,
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
    const token     = await getValidHubSpotToken(userId);
    const contactId = await findHubSpotContact(token, viewerEmail);
    if (!contactId) return { success: false, reason: 'contact_not_in_hubspot' };

    const locationStr = location?.city && location?.country
      ? `${location.city}, ${location.country}`
      : location?.country || 'Unknown';

    const visitLabel = isRevisit
      ? `Revisit #${visitCount || '?'} — High intent signal`
      : 'First view';

    const noteBody = `<b>DocMetrics — Document ${isRevisit ? 'Revisited' : 'Opened'}</b>

${visitLabel}

Document: ${documentName}
Opened: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
Device: ${device || 'Desktop'}
Location: ${locationStr}
Analytics: ${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}

${isRevisit
  ? 'This contact has returned to your document multiple times. Follow up now.'
  : 'Reach out while they are reading for the best response rate.'}`;

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
    const token     = await getValidHubSpotToken(userId);
    const contactId = await findHubSpotContact(token, viewerEmail);
    if (!contactId) return { success: false, reason: 'contact_not_in_hubspot' };

    const intentLabel = intentLevel === 'high'
      ? 'HIGH INTENT'
      : intentLevel === 'medium'
      ? 'MEDIUM INTENT'
      : 'LOW INTENT';

    const topPagesStr = topPages && topPages.length > 0
      ? topPages.slice(0, 3).map(p => `  Page ${p.page}: ${formatTime(p.timeSpent)}`).join('\n')
      : '  No page data';

    const followUpLine = intentLevel === 'high'
      ? 'HIGH INTENT: This contact spent significant time reading. Follow up immediately.'
      : intentLevel === 'medium'
      ? 'MEDIUM INTENT: Decent engagement. Worth a follow-up this week.'
      : 'LOW INTENT: They read it quickly. Gauge interest before investing time.';

    const noteBody = `<b>DocMetrics — Full Read Completed — ${intentLabel}</b>

${viewerEmail} finished reading your entire document.

Document: ${documentName}
Total time: ${formatTime(totalTimeSeconds)}
Pages read: ${totalPages}/${totalPages} (100%)
Completed: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}

Most time spent on:
${topPagesStr}

Analytics: ${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}

${followUpLine}`;

    await createContactNote(token, contactId, noteBody, new Date());
    await updateContactProperties(token, contactId, {
      docmetrics_last_document:  documentName,
      docmetrics_last_viewed:    new Date().toISOString(),
      docmetrics_total_read_time: formatTime(totalTimeSeconds),
      docmetrics_intent_level:   intentLabel,
      docmetrics_completed_read: 'true',
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
    const token     = await getValidHubSpotToken(userId);
    const contactId = await findHubSpotContact(token, viewerEmail);
    if (!contactId) return { success: false, reason: 'contact_not_in_hubspot' };

    const completionPct = totalPages > 0
      ? Math.round((pagesViewed.length / totalPages) * 100)
      : 0;

    const engagementLevel = sessionDurationSeconds > 300
      ? 'Deep read'
      : sessionDurationSeconds > 60
      ? 'Moderate read'
      : 'Quick scan';

    const noteBody = `<b>DocMetrics — Session Summary</b>

${engagementLevel}

Document: ${documentName}
Time in session: ${formatTime(sessionDurationSeconds)}
Pages reached: ${pagesViewed.length}/${totalPages} (${completionPct}%)
Device: ${device || 'Desktop'}
Analytics: ${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`;

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
// HELPER — Check if user has HubSpot connected
// ════════════════════════════════════════════════════════════════
export async function isHubSpotConnected(userId: string): Promise<boolean> {
  try {
    const db          = await dbPromise;
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

// ════════════════════════════════════════════════════════════════
// SYNC 4 — Space/Portal Event
// Handles: document_open, revisit, document_view, download
// Also accepts legacy 'portal_enter' for backwards compat
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
    const token     = await getValidHubSpotToken(userId);
    const contactId = await findHubSpotContact(token, visitorEmail);

    if (!contactId) {
      console.log(`HubSpot: no contact found for ${visitorEmail} — skipping`);
      return { success: false, reason: 'contact_not_in_hubspot' };
    }

    // Normalise legacy event name
    const normalised = event === 'portal_enter' ? 'document_open' : event;

    const eventConfig: Record<string, { title: string; body: string }> = {
      document_open: {
        title: 'Document Opened',
        body: `${visitorEmail} opened your space for the first time.\n\nSpace: ${spaceName}\nTime: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}\n\nReach out while they are browsing for the best response rate.`,
      },
      revisit: {
        title: `Space Revisited${visitCount ? ` — Visit #${visitCount}` : ''}`,
        body: `${visitorEmail} returned to your space${visitCount ? ` (visit #${visitCount})` : ''}.\n\nSpace: ${spaceName}\nTime: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}\n\nReturning visitor — high intent signal. Follow up now.`,
      },
      document_view: {
        title: 'Document Viewed',
        body: `${visitorEmail} viewed a document in your space.\n\nSpace: ${spaceName}\nDocument: ${documentName || 'Unknown'}\nTime: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
      },
      download: {
        title: 'Document Downloaded',
        body: `${visitorEmail} downloaded a document from your space.\n\nSpace: ${spaceName}\nDocument: ${documentName || 'Unknown'}\nTime: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}\n\nDownloads signal serious interest. Follow up today.`,
      },
    };

    const config   = eventConfig[normalised] || eventConfig['document_open'];
    const noteBody = `<b>DocMetrics — ${config.title}</b>\n\n${config.body}`;

    await createContactNote(token, contactId, noteBody, new Date());
    await updateContactProperties(token, contactId, {
      docmetrics_last_document: documentName || spaceName,
      docmetrics_last_viewed:   new Date().toISOString(),
    });

    console.log(`✅ HubSpot synced: ${normalised} — contact ${contactId}`);
    return { success: true, contactId };
  } catch (err) {
    console.error('HubSpot sync error (portal event):', err);
    return { success: false, error: err };
  }
}