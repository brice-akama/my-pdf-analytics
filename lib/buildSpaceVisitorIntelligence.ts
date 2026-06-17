// lib/buildSpaceVisitorIntelligence.ts
// ── Single source of truth for per-visitor space intelligence ─────
// Used by: spaces analytics tab (app/api/spaces/[id]/analytics/route.ts)
// and portal notifications (app/api/portal/[shareLink]/track/route.ts).
// If this changes, the Analytics tab and every notification channel
// change together — no more "I'd have to open another tab to see this."

const FREE_EMAIL_DOMAINS_SPACE = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'me.com', 'aol.com', 'protonmail.com',
  'mail.com', 'live.com', 'msn.com', 'googlemail.com',
]);

export type SpaceVisitorIntelligence = {
  email: string;
  engagementScore: number;
  status: string;
  momentumState: 'accelerating' | 'holding' | 'fading' | 'stalled';
  returnWithQuestion: boolean;
  returnQuestionText: string | null;
  narrative: string;
  progressionPattern: 'progressive' | 'stuck' | 'falling' | 'single';
  docsOpened: number;
  coveragePercent: number;
  reReadDocs: { docId: string; docName: string; sessionCount: number }[];
  hasInternalSharing: boolean;
  hasLinkOnlySharing: boolean;
  secondaryViewers: string[];
  daysSinceLastActivity: number;
  recommendation: string;
};

// db, spaceId, logs, visitors, documents are all already computed
// upstream by the caller — this function just does the per-visitor
// interpretation step so both callers compute it identically.
export async function buildSpaceVisitorIntelligence({
  db,
  spaceId,
  visitor,
  logs,
  visitors,
  documents,
}: {
  db: any;
  spaceId: string;
  visitor: { email: string; engagementScore: number; status: string; lastSeen: Date };
  logs: any[];
  visitors: { email: string }[];
  documents: { documentId: string; documentName: string }[];
}): Promise<SpaceVisitorIntelligence> {

  const visitorLogs = logs.filter(l => l.visitorEmail === visitor.email);

  // Sessions grouped by document
  const docSessionMap = new Map<string, Set<string>>();
  visitorLogs.forEach((log: any) => {
    if (!log.documentId) return;
    const docId = log.documentId.toString();
    if (!docSessionMap.has(docId)) docSessionMap.set(docId, new Set());
    if (log.sessionId) docSessionMap.get(docId)!.add(log.sessionId);
  });

  const reReadDocs: { docId: string; docName: string; sessionCount: number }[] = [];
  docSessionMap.forEach((sessions, docId) => {
    if (sessions.size >= 2) {
      reReadDocs.push({
        docId,
        docName: documents.find((d: any) => d.documentId === docId)?.documentName || 'Document',
        sessionCount: sessions.size,
      });
    }
  });
  reReadDocs.sort((a, b) => b.sessionCount - a.sessionCount);

  const daysSinceLastActivity = visitor.lastSeen
    ? Math.floor((Date.now() - new Date(visitor.lastSeen).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const visitorDomain = visitor.email.includes('@')
    ? visitor.email.split('@')[1].toLowerCase()
    : null;
  const visitorIsFreeDomain = visitorDomain
    ? FREE_EMAIL_DOMAINS_SPACE.has(visitorDomain)
    : true;

  const secondaryViewers = (visitorDomain && !visitorIsFreeDomain)
    ? visitors.filter(v =>
        v.email !== visitor.email &&
        v.email.includes('@') &&
        v.email.split('@')[1].toLowerCase() === visitorDomain
      )
    : [];
  const hasInternalSharing = secondaryViewers.length > 0;

  const sameSpaceFreeViewers = visitorIsFreeDomain
    ? visitors.filter(v =>
        v.email !== visitor.email &&
        v.email.includes('@') &&
        FREE_EMAIL_DOMAINS_SPACE.has(v.email.split('@')[1]?.toLowerCase() || '')
      )
    : [];
  const hasLinkOnlySharing = sameSpaceFreeViewers.length > 0;

  const docsOpened = new Set(
    visitorLogs.filter((l: any) => l.documentId).map((l: any) => l.documentId.toString())
  ).size;
  const coveragePercent = documents.length > 0
    ? Math.round((docsOpened / documents.length) * 100)
    : 0;

  const visitorSessions = visitorLogs
    .filter((l: any) => l.event === 'document_view' || l.event === 'portal_enter')
    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const sessionDocCounts: number[] = [];
  const sessionDateMap = new Map<string, Set<string>>();
  visitorSessions.forEach((log: any) => {
    const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
    if (!sessionDateMap.has(dateKey)) sessionDateMap.set(dateKey, new Set());
    if (log.documentId) sessionDateMap.get(dateKey)!.add(log.documentId.toString());
  });
  sessionDateMap.forEach(docs => sessionDocCounts.push(docs.size));

  let progressionPattern: 'progressive' | 'stuck' | 'falling' | 'single' = 'single';
  if (sessionDocCounts.length >= 2) {
    const first = sessionDocCounts[0];
    const last = sessionDocCounts[sessionDocCounts.length - 1];
    if (last > first) progressionPattern = 'progressive';
    else if (last < first) progressionPattern = 'falling';
    else progressionPattern = 'stuck';
  }

  let momentumState: 'accelerating' | 'holding' | 'fading' | 'stalled';
  if (visitor.engagementScore >= 70 && daysSinceLastActivity <= 3) momentumState = 'accelerating';
  else if (visitor.engagementScore >= 40 && daysSinceLastActivity <= 7) momentumState = 'holding';
  else if (daysSinceLastActivity <= 14) momentumState = 'fading';
  else momentumState = 'stalled';

  let narrative = '';
  if (momentumState === 'accelerating') {
    if (hasInternalSharing) {
      narrative = `${visitor.email} has opened this space and a second person from ${visitorDomain} has also accessed it. The space may have been shared internally — though the data alone cannot confirm that. Your read on the relationship will matter more than this signal.`;
    } else if (hasLinkOnlySharing) {
      narrative = `${visitor.email} has opened this space and ${sameSpaceFreeViewers.length} other ${sameSpaceFreeViewers.length === 1 ? 'person' : 'people'} using personal email${sameSpaceFreeViewers.length === 1 ? '' : 'es'} have also accessed it. Their addresses don't share a company domain, so this may be personal email used for business, or the link forwarded outside the original company. More than one person is looking at this regardless.`;
    } else if (reReadDocs.length > 0) {
      narrative = `${visitor.email} has returned to this space ${reReadDocs[0].sessionCount} times and keeps coming back to ${reReadDocs[0].docName}. This pattern of returning to specific content often indicates an unresolved question or active evaluation.`;
    } else {
      narrative = `${visitor.email} is actively engaging with this space and has opened ${docsOpened} of ${documents.length} documents. Engagement is strong and recent.`;
    }
  } else if (momentumState === 'holding') {
    narrative = `${visitor.email} opened ${docsOpened} document${docsOpened !== 1 ? 's' : ''} in this space ${daysSinceLastActivity} day${daysSinceLastActivity !== 1 ? 's' : ''} ago. Engagement is steady but not accelerating. The data does not indicate urgency but a value-add message tends to perform better than a generic check in at this stage.`;
  } else if (momentumState === 'fading') {
    narrative = `${visitor.email} last visited this space ${daysSinceLastActivity} days ago and engagement appears to be dropping. This pattern sometimes reflects competing priorities rather than loss of interest — though the data cannot distinguish between the two.`;
  } else {
    narrative = `${visitor.email} has not visited this space in ${daysSinceLastActivity} days. The data suggests the deal has stalled but cannot explain why. External factors you cannot see may account for the silence.`;
  }

  let recommendation = '';
  if (momentumState === 'accelerating' && hasInternalSharing) {
    recommendation = `High confidence signal. A second person from the same domain has accessed this space. Whether to act on this and how depends on your relationship with your original contact and your read on their internal process.`;
  } else if (momentumState === 'accelerating') {
    recommendation = `Medium confidence signal. Engagement is strong and recent. A follow up referencing something specific in what they have been reviewing tends to land better than a generic check in — though timing is your judgment.`;
  } else if (momentumState === 'holding') {
    recommendation = `Medium confidence signal. Engagement is steady. A short message adding value — a relevant insight or a direct question about their timeline — tends to maintain momentum better than waiting. Your knowledge of the deal should guide the approach.`;
  } else if (momentumState === 'fading') {
    recommendation = `Low confidence signal. Engagement is dropping. A direct question about whether this is still a priority tends to surface useful information even when engagement is declining — but only you know whether the timing and relationship make that the right move.`;
  } else {
    recommendation = `Low confidence signal. The data suggests the deal has stalled. A short message that acknowledges the gap without pressure is generally the lowest risk approach at this stage. Whether to send it or park the deal is your judgment based on the broader context.`;
  }

  const visitorComments = await db.collection('portal_comments').find({
    spaceId: new (require('mongodb').ObjectId)(spaceId),
    email: visitor.email,
  }).sort({ createdAt: -1 }).limit(5).toArray();

  let returnWithQuestion = false;
  let returnQuestionText: string | null = null;

  if (visitorComments.length > 0 && visitorLogs.length >= 2) {
    const sortedLogs = [...visitorLogs].sort(
      (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 1; i < sortedLogs.length; i++) {
      const prevLog = sortedLogs[i - 1];
      const currentLog = sortedLogs[i];
      const gapDays = (new Date(currentLog.timestamp).getTime() - new Date(prevLog.timestamp).getTime()) / (1000 * 60 * 60 * 24);

      if (gapDays >= 3) {
        const returnTime = new Date(currentLog.timestamp).getTime();
        const questionAfterReturn = visitorComments.find((c: any) => {
          const commentTime = new Date(c.createdAt).getTime();
          return commentTime >= returnTime && commentTime <= returnTime + (24 * 60 * 60 * 1000);
        });

        if (questionAfterReturn) {
          returnWithQuestion = true;
          returnQuestionText = questionAfterReturn.message;
          break;
        }
      }
    }
  }

  let finalMomentumState = momentumState;
  if (returnWithQuestion) {
    if (finalMomentumState === 'fading') finalMomentumState = 'holding';
    if (finalMomentumState === 'holding') finalMomentumState = 'accelerating';
  }

  let finalNarrative = narrative;
  if (returnWithQuestion && returnQuestionText) {
    finalNarrative = `${visitor.email} went quiet then came back and asked a specific question — "${returnQuestionText.slice(0, 80)}${returnQuestionText.length > 80 ? '...' : ''}". This combination — silence followed by a return with a specific question — is one of the stronger engagement patterns in the data. Answering their question directly tends to be more effective than a broader follow up at this point.`;
  }

  return {
    email: visitor.email,
    engagementScore: visitor.engagementScore,
    status: visitor.status,
    momentumState: finalMomentumState,
    returnWithQuestion,
    returnQuestionText,
    narrative: finalNarrative,
    progressionPattern,
    docsOpened,
    coveragePercent,
    reReadDocs,
    hasInternalSharing,
    hasLinkOnlySharing,
    secondaryViewers: secondaryViewers.map(v => v.email),
    daysSinceLastActivity,
    recommendation,
  };
}