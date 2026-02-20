// lib/integrations/hubspotSync.ts
// Pushes document intelligence into HubSpot so sales teams
// never have to leave their CRM to know what buyers are doing.

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
    console.log('🔍 HubSpot search result:', data.results?.length, 'contacts for:', email);
    return data.results?.[0]?.id || null;
  } catch {
    return null;
  }
}

// ── Create or update a contact property ──────────────────────────
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

// ── Create a HubSpot note on a contact ───────────────────────────
// Notes appear in the contact's activity timeline immediately
async function createContactNote(
  token: string,
  contactId: string,
  noteBody: string,
  timestamp: Date
) {
  try {
    // Create the note
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

    // Associate note with the contact
    await fetch(
      `https://api.hubapi.com/crm/v3/objects/notes/${noteId}/associations/contacts/${contactId}/note_to_contact`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return noteId;
  } catch (err) {
    console.error('HubSpot note error:', err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// SYNC 1 — Document Opened
// Call this from session_start in your track route
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

    if (!contactId) {
      return { success: false, reason: 'contact_not_in_hubspot' };
    }

    const locationStr = location?.city && location?.country
      ? `${location.city}, ${location.country}`
      : location?.country || 'Unknown';

    const visitLabel = isRevisit
      ? `🔄 Revisit #${visitCount || '?'} — High intent signal`
      : '👁 First view';

    const noteBody = `📄 <b>DocMetrics — Document ${isRevisit ? 'Revisited' : 'Opened'}</b>

${visitLabel}

• Document: ${documentName}
• Opened: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
• Device: ${device || 'Desktop'}
• Location: ${locationStr}
• Analytics: ${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}

${isRevisit ? '⚡ This contact has returned to your document multiple times. Follow up now.' : '💡 Reach out while they\'re reading for best response rate.'}`;

    await createContactNote(token, contactId, noteBody, new Date());

    // Update contact's "last document viewed" custom property
    // (you create these once in HubSpot Settings → Properties)
    await updateContactProperties(token, contactId, {
      docmetrics_last_document: documentName,
      docmetrics_last_viewed: new Date().toISOString(),
      docmetrics_view_count: String(visitCount || 1),
    });

    console.log(`✅ HubSpot synced: document opened — contact ${contactId}`);
    return { success: true, contactId };
  } catch (err) {
    console.error('HubSpot sync error (opened):', err);
    return { success: false, error: err };
  }
}

// ════════════════════════════════════════════════════════════════
// SYNC 2 — Document Completed (viewer read all pages)
// Call this from page_view in your track route when last page hit
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

    if (!contactId) {
      return { success: false, reason: 'contact_not_in_hubspot' };
    }

    const intentEmoji = intentLevel === 'high' ? '🔥' : intentLevel === 'medium' ? '👀' : '📖';
    const intentLabel = intentLevel === 'high' ? 'HIGH INTENT' : intentLevel === 'medium' ? 'MEDIUM INTENT' : 'LOW INTENT';

    const topPagesStr = topPages && topPages.length > 0
      ? topPages.slice(0, 3)
          .map(p => `  • Page ${p.page}: ${formatTime(p.timeSpent)}`)
          .join('\n')
      : '  • No page data';

    const noteBody = `✅ <b>DocMetrics — Full Read Completed ${intentEmoji} ${intentLabel}</b>

${viewerEmail} finished reading your entire document.

• Document: ${documentName}
• Total time: ${formatTime(totalTimeSeconds)}
• Pages read: ${totalPages}/${totalPages} (100%)
• Completed: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}

📊 Most time spent on:
${topPagesStr}

• Full analytics: ${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}

${intentLevel === 'high' ? '🎯 HIGH INTENT: This contact spent significant time reading. Follow up immediately.' : intentLevel === 'medium' ? '👀 MEDIUM INTENT: Decent engagement. Worth a follow-up this week.' : '📖 LOW INTENT: They read it quickly. Gauge interest before investing time.'}`;

    await createContactNote(token, contactId, noteBody, new Date());

    // Update HubSpot contact properties
    await updateContactProperties(token, contactId, {
      docmetrics_last_document: documentName,
      docmetrics_last_viewed: new Date().toISOString(),
      docmetrics_total_read_time: formatTime(totalTimeSeconds),
      docmetrics_intent_level: intentLabel,
      docmetrics_completed_read: 'true',
    });

    console.log(`✅ HubSpot synced: document completed — contact ${contactId}`);
    return { success: true, contactId };
  } catch (err) {
    console.error('HubSpot sync error (completed):', err);
    return { success: false, error: err };
  }
}

// ════════════════════════════════════════════════════════════════
// SYNC 3 — Engagement Summary (called from session_end)
// Pushes a summary of what the viewer did in this session
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

    if (!contactId) {
      return { success: false, reason: 'contact_not_in_hubspot' };
    }

    const completionPct = totalPages > 0
      ? Math.round((pagesViewed.length / totalPages) * 100)
      : 0;

    const engagementLevel = sessionDurationSeconds > 300
      ? '🔥 Deep read'
      : sessionDurationSeconds > 60
      ? '👀 Moderate read'
      : '⚡ Quick scan';

    const noteBody = `📊 <b>DocMetrics — Session Summary</b>

${engagementLevel}

• Document: ${documentName}
• Time in session: ${formatTime(sessionDurationSeconds)}
• Pages reached: ${pagesViewed.length}/${totalPages} (${completionPct}%)
• Device: ${device || 'Desktop'}
• Analytics: ${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`;

    // Only create a session note if they spent meaningful time (>30s)
    if (sessionDurationSeconds >= 30) {
      await createContactNote(token, contactId, noteBody, new Date());
    }

    await updateContactProperties(token, contactId, {
      docmetrics_last_document: documentName,
      docmetrics_last_session_time: formatTime(sessionDurationSeconds),
      docmetrics_completion_rate: `${completionPct}%`,
    });

    return { success: true, contactId };
  } catch (err) {
    console.error('HubSpot sync error (session end):', err);
    return { success: false, error: err };
  }
}

// ════════════════════════════════════════════════════════════════
// HELPER — Check if user has HubSpot connected
// Call this before any sync to avoid unnecessary DB lookups
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