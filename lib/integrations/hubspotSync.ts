// lib/integrations/hubspotSync.ts
// lib/integrations/hubspotSync.ts
import { getValidHubSpotToken } from './hubspot';
import { dbPromise } from '@/app/api/lib/mongodb';

// ── Helpers ───────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

// ── Safe fetch wrapper — never throws, never crashes the app ──────
async function safeFetch(
  url: string,
  options: RequestInit
): Promise<{ ok: boolean; data: any; scopeError?: boolean }> {
  try {
    const res = await fetch(url, options);
    let data: any = {};
    try { data = await res.json(); } catch {}

    // Detect scope errors specifically so the app can prompt
    // the user to reconnect rather than failing silently forever
    const scopeError = res.status === 403 && (
      data?.message?.includes('scope') ||
      data?.message?.includes('permission') ||
      data?.category === 'MISSING_SCOPES'
    );

    if (scopeError) {
      console.warn('⚠️ HubSpot scope error — user needs to reconnect:', data?.message);
    }

    return { ok: res.ok, data, scopeError };
  } catch {
    return { ok: false, data: {} };
  }
}

// ── Find HubSpot contact by email ─────────────────────────────────
async function findHubSpotContact(
  token: string,
  email: string
): Promise<string | null> {
  try {
    const { ok, data } = await safeFetch(
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
    if (!ok) return null;
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
  await safeFetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    }
  );
}

// ── Find or create HubSpot deal for a contact ─────────────────────
async function findOrCreateDeal(
  token: string,
  contactId: string,
  dealName: string
): Promise<string | null> {
  try {
    // Search for existing deal associated with this contact
    const { ok, data } = await safeFetch(
      'https://api.hubapi.com/crm/v3/objects/deals/search',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: 'associations.contact',
              operator: 'EQ',
              value: contactId,
            }],
          }],
          properties: ['dealname', 'dealstage', 'docmetrics_momentum_score'],
          sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
          limit: 1,
        }),
      }
    );

    if (ok && data.results?.[0]?.id) {
      return data.results[0].id;
    }

    // No deal found — create one
    const createRes = await safeFetch(
      'https://api.hubapi.com/crm/v3/objects/deals',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            dealname: dealName,
            dealstage: 'appointmentscheduled',
            pipeline: 'default',
          },
          associations: [{
            to: { id: contactId },
            types: [{
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 3, // contact to deal
            }],
          }],
        }),
      }
    );

    if (!createRes.ok) return null;
    return createRes.data?.id || null;

  } catch {
    return null;
  }
}

// ── Update deal properties ────────────────────────────────────────
async function updateDealProperties(
  token: string,
  dealId: string,
  properties: Record<string, string>
) {
  await safeFetch(
    `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    }
  );
}

// ── Create a note on a contact ────────────────────────────────────
async function createContactNote(
  token: string,
  contactId: string,
  noteBody: string,
  timestamp: Date
) {
  try {
    const { ok, data: noteData } = await safeFetch(
      'https://api.hubapi.com/crm/v3/objects/notes',
      {
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
      }
    );

    if (!ok || !noteData?.id) return null;

    await safeFetch(
      `https://api.hubapi.com/crm/v3/objects/notes/${noteData.id}/associations/contacts/${contactId}/note_to_contact`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
    );

    return noteData.id;
  } catch {
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
  } catch {
    return { success: false, error: 'silent_failure' };
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
  } catch {
    return { success: false, error: 'silent_failure' };
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
  } catch {
    return { success: false, error: 'silent_failure' };
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
  } catch {
    return { success: false, error: 'silent_failure' };
  }
}

// ════════════════════════════════════════════════════════════════
// SYNC 5 — Deal Insight
// ════════════════════════════════════════════════════════════════
export async function syncDealInsightToHubSpot({
  userId,
  viewerEmail,
  documentName,
  documentId,
  slowestPage,
  slowestPageTime,
  avgPageTime,
  skippedPages,
  totalPages,
  trigger,
  daysSilent,
  narrative: narrativeOverride,
}: {
  userId: string;
  viewerEmail: string;
  documentName: string;
  documentId: string;
  slowestPage: number;
  slowestPageTime: number;
  avgPageTime: number;
  skippedPages: number[];
  totalPages: number;
  trigger: 'session_end' | 'gone_silent';
  daysSilent?: number;
  narrative?: string;
}) {
  if (!viewerEmail) return { success: false, reason: 'no_email' };

  try {
    const token = await getValidHubSpotToken(userId);
    const contactId = await findHubSpotContact(token, viewerEmail);
    if (!contactId) return { success: false, reason: 'contact_not_in_hubspot' };

    const skippedText = skippedPages.length > 0
      ? `Pages skipped: ${skippedPages.join(', ')}`
      : 'All pages opened';

    const noteBody = [
      `DocMetrics — ${trigger === 'gone_silent' ? 'Deal Going Cold' : 'Deal Insight'}`,
      '',
      `Prospect: ${viewerEmail}`,
      `Document: ${documentName}`,
      narrativeOverride ? `\nInsight: ${narrativeOverride}` : null,
      '',
      `Slowest page: Page ${slowestPage} (${formatTime(slowestPageTime)})`,
      `Avg per page: ${formatTime(avgPageTime)}`,
      skippedText,
      `Total pages: ${totalPages}`,
      trigger === 'gone_silent' ? `Days silent: ${daysSilent}` : null,
      '',
      `Analytics: ${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`,
    ].filter(Boolean).join('\n');

    await createContactNote(token, contactId, noteBody, new Date());
    await updateContactProperties(token, contactId, {
      docmetrics_last_document: documentName,
      docmetrics_deal_status:   trigger === 'gone_silent' ? 'Going Cold' : 'Active',
    });

    return { success: true, contactId };
  } catch {
    return { success: false, error: 'silent_failure' };
  }
}

// ════════════════════════════════════════════════════════════════
// SYNC 6 — Deal Intelligence Write-Back ← NEW
//
// This is the feature no other document tool has built.
// Instead of just sending a notification it writes the full
// DocMetrics intelligence directly onto the HubSpot deal record.
//
// A salesperson opens their HubSpot deal and sees:
//   - Momentum score: 78/100
//   - Engagement state: Accelerating
//   - Last signal: Internal sharing detected
//   - Recommended action: Follow up today, ask who else is involved
//   - Internal sharing: Yes
//
// This works silently. If anything fails the app never knows.
// ════════════════════════════════════════════════════════════════
export async function syncDealIntelligenceToHubSpot({
  userId,
  viewerEmail,
  documentName,
  documentId,
  spaceId,
  momentumScore,
  engagementState,
  lastSignal,
  recommendedAction,
  internalSharing,
  secondaryViewerCount,
  daysSinceLastActivity,
  reReadCount,
  coveragePercent,
  isSpace,
}: {
  userId: string;
  viewerEmail: string;
  documentName: string;
  documentId: string;
  spaceId?: string;
  momentumScore: number;
  engagementState: 'accelerating' | 'holding' | 'fading' | 'stalled';
  lastSignal: string;
  recommendedAction: string;
  internalSharing: boolean;
  secondaryViewerCount?: number;
  daysSinceLastActivity: number;
  reReadCount?: number;
  coveragePercent?: number;
  isSpace?: boolean;
}): Promise<{ success: boolean; dealId?: string; reason?: string }> {

  // Silent failure wrapper — this function must never crash anything
  try {
    if (!viewerEmail) return { success: false, reason: 'no_email' };

    const token = await getValidHubSpotToken(userId).catch(() => null);
    if (!token) return { success: false, reason: 'no_token' };

    const contactId = await findHubSpotContact(token, viewerEmail);
    if (!contactId) return { success: false, reason: 'contact_not_in_hubspot' };

    // Find or create the deal for this contact
    const dealId = await findOrCreateDeal(token, contactId, documentName);
    if (!dealId) return { success: false, reason: 'deal_not_found_or_created' };

    const analyticsUrl = isSpace && spaceId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/spaces/${spaceId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/documents/${documentId}`;

    const stateEmoji = {
      accelerating: '🟢',
      holding:      '🟡',
      fading:       '🟠',
      stalled:      '🔴',
    }[engagementState] || '⚪';

    const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    // ── Write intelligence properties onto the deal record ────────
    // These seven properties appear in the HubSpot deal panel
    // so the salesperson sees DocMetrics intelligence without
    // leaving HubSpot
    await updateDealProperties(token, dealId, {
      docmetrics_momentum_score:    String(momentumScore),
      docmetrics_engagement_state:  engagementState,
      docmetrics_last_signal:       lastSignal,
      docmetrics_recommended_action: recommendedAction,
      docmetrics_internal_sharing:  internalSharing ? 'Yes' : 'No',
      docmetrics_viewer_email:      viewerEmail,
      docmetrics_last_activity:     new Date().toISOString(),
    });

    // ── Also write a note so the activity timeline shows context ──
    const noteLines = [
      `DocMetrics — Deal Intelligence Update`,
      '',
      `${stateEmoji} Engagement state: ${engagementState.charAt(0).toUpperCase() + engagementState.slice(1)}`,
      `Momentum score: ${momentumScore}/100`,
      `Last signal: ${lastSignal}`,
      '',
      `Recommended action: ${recommendedAction}`,
      '',
      internalSharing
        ? `⚠️ Internal sharing detected — ${secondaryViewerCount || 1} additional viewer${(secondaryViewerCount || 1) > 1 ? 's' : ''} from same company`
        : null,
      reReadCount && reReadCount >= 2
        ? `Document re-read ${reReadCount} times across sessions`
        : null,
      coveragePercent !== undefined
        ? `Document coverage: ${coveragePercent}% of pages reviewed`
        : null,
      `Days since last activity: ${daysSinceLastActivity}`,
      '',
      `Updated: ${now}`,
      `View full analytics: ${analyticsUrl}`,
    ].filter(Boolean).join('\n');

    await createContactNote(token, contactId, noteLines, new Date());

    // ── Also update the contact with summary properties ───────────
    await updateContactProperties(token, contactId, {
      docmetrics_last_document: documentName,
      docmetrics_last_viewed:   new Date().toISOString(),
      docmetrics_deal_status:   engagementState === 'stalled' ? 'Going Cold' : 'Active',
      docmetrics_intent_level:  momentumScore >= 65 ? 'High' : momentumScore >= 35 ? 'Medium' : 'Low',
    });

    console.log(`✅ HubSpot deal intelligence synced — deal ${dealId} | ${viewerEmail} | ${engagementState} | score ${momentumScore}`);
    return { success: true, dealId };

  } catch (err) {
    // Silent failure — log but never throw
    console.error('HubSpot deal intelligence sync failed silently:', err);
    return { success: false, reason: 'silent_failure' };
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