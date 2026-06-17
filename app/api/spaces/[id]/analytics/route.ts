// app/api/spaces/[id]/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { checkAccess } from '@/lib/checkAccess';
import { getAnalyticsLevel } from '@/lib/planLimits';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise
      ? await context.params
      : context.params;

    const spaceId = params.id;

    const access = await checkAccess(request)
    if (!access.ok) return access.response

    const { user, plan } = access
    const analyticsLevel = getAnalyticsLevel(plan)

    const db = await dbPromise;

    // ── Free email providers excluded from committee detection ────
    const FREE_EMAIL_DOMAINS_SPACE = new Set([
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'icloud.com', 'me.com', 'aol.com', 'protonmail.com',
      'mail.com', 'live.com', 'msn.com', 'googlemail.com',
    ]);

    const space = await db.collection('spaces').findOne({
      _id: new ObjectId(spaceId)
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const isOwner = space.userId === user._id.toString();
    const isMember = space.members?.some((m: any) =>
      m.email === user.email || m.userId === user._id.toString()
    );

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Free plan gets basic analytics only — return summary counts, no per-visitor data
    if (analyticsLevel === 'basic') {
      // Still fetch logs to compute the overview numbers
      const logsBasic = await db.collection('activityLogs')
        .find({ spaceId: new ObjectId(spaceId) })
        .sort({ timestamp: -1 })
        .toArray()

      const basicViews     = logsBasic.filter(l => l.event === 'document_view' || l.event === 'view').length
      const basicDownloads = logsBasic.filter(l => l.event === 'download').length
      const basicVisitors  = new Set(logsBasic.map(l => l.visitorEmail).filter(Boolean)).size
      const basicLast24h   = logsBasic.filter(l => new Date(l.timestamp) >= new Date(Date.now() - 86400000))
      const basicLast7d    = logsBasic.filter(l => new Date(l.timestamp) >= new Date(Date.now() - 7 * 86400000))
      const basicHeat      = Math.round(
        Math.min(40, basicLast24h.length * 8) +
        Math.min(30, basicLast7d.length * 3) +
        Math.min(20, basicVisitors * 5) +
        Math.min(10, basicDownloads * 5)
      )

      // ── Buying committee detection for basic plan ─────────────
     

      const basicDomainViewers = logsBasic
        .filter((l: any) => l.visitorEmail)
        .reduce((acc: Record<string, string[]>, l: any) => {
          const domain = l.visitorEmail?.split('@')[1]?.toLowerCase();
          if (!domain || FREE_EMAIL_DOMAINS_SPACE.has(domain)) return acc;
          if (!acc[domain]) acc[domain] = [];
          if (!acc[domain].includes(l.visitorEmail)) acc[domain].push(l.visitorEmail);
          return acc;
        }, {});

      const basicDomainCommitteeSize = Math.max(
        ...Object.values(basicDomainViewers).map((v: any) => v.length),
        1
      );
      const basicDomainCommitteeGrowing = basicDomainCommitteeSize >= 2;
      const spaceProspectDomain = Object.keys(basicDomainViewers)[0] || 'the prospect company';

      const basicIdentifiedEmails = new Set(
        logsBasic.filter((l: any) => l.visitorEmail).map((l: any) => l.visitorEmail)
      );
      const basicSharedMultiViewer = basicIdentifiedEmails.size >= 2 && !basicDomainCommitteeGrowing;

      const spaceCommitteeSize = Math.max(basicDomainCommitteeSize, basicIdentifiedEmails.size);
      const spaceCommitteeGrowing = basicDomainCommitteeGrowing || basicSharedMultiViewer;
      const basicCommitteeConfidence: 'domain_confirmed' | 'link_only' | 'none' =
        basicDomainCommitteeGrowing ? 'domain_confirmed'
        : basicSharedMultiViewer ? 'link_only'
        : 'none';

      const spaceRecommendedAction = basicCommitteeConfidence === 'domain_confirmed'
        ? `Signal detected (high confidence): ${spaceCommitteeSize} people from ${spaceProspectDomain} have accessed this space. This may indicate internal circulation. Consider asking your champion who else is now involved before sending any follow up.`
        : basicCommitteeConfidence === 'link_only'
        ? `Signal detected (medium confidence): ${spaceCommitteeSize} different people have accessed this space. Their email addresses don't share a company domain. More than one person is looking at this regardless.`
        : `Signal detected (low confidence): Single viewer engagement only. Monitor before acting.`;

      return NextResponse.json({
        success: true,
        analyticsLevel: 'basic',
        analytics: {
          overview: {
            totalViews:      basicViews,
            totalDownloads:  basicDownloads,
            uniqueVisitors:  basicVisitors,
            totalEvents:     logsBasic.length,
            lastActivity:    logsBasic[0]?.timestamp || null,
            dealHeatScore:   basicHeat,
            totalShareLinks: Array.isArray(space.publicAccess) ? space.publicAccess.length : (space.publicAccess ? 1 : 0),
          },
           committeeGrowing: spaceCommitteeGrowing,
          committeeSize: spaceCommitteeSize,
          committeeConfidence: basicCommitteeConfidence,
          prospectDomain: spaceProspectDomain,
          recommendedAction: spaceRecommendedAction,
          shareLinks:  [],
          visitors:    [],
          documents:   [],
          timeline:    [],
          dailyVisits: [],
        }
      })
    }

    // ─── Fetch all activity logs for this space ───────────────────────────
    const logs = await db.collection('activityLogs')
      .find({ spaceId: new ObjectId(spaceId) })
      .sort({ timestamp: -1 })
      .toArray();

    const now = Date.now();

    // ─── 1. TOP STATS ─────────────────────────────────────────────────────
    const totalEvents    = logs.length;
    const totalViews     = logs.filter(l => l.event === 'document_view' || l.event === 'view').length;
    const totalDownloads = logs.filter(l => l.event === 'download').length;

    const uniqueVisitors = new Set(
      logs.map(l => l.visitorEmail).filter(Boolean)
    ).size;

    // ── Buying committee growth detection ─────────────────────────
  // ── Buying committee growth detection ─────────────────────────
   const spaceDomainViewers = logs
      .filter((l: any) => l.visitorEmail)
      .reduce((acc: Record<string, string[]>, l: any) => {
        const domain = l.visitorEmail?.split('@')[1]?.toLowerCase();
        if (!domain || FREE_EMAIL_DOMAINS_SPACE.has(domain)) return acc;
        if (!acc[domain]) acc[domain] = [];
        if (!acc[domain].includes(l.visitorEmail)) acc[domain].push(l.visitorEmail);
        return acc;
      }, {});

   const domainCommitteeSize = Math.max(
      ...Object.values(spaceDomainViewers).map((v: any) => v.length),
      1
    );
    const domainCommitteeGrowing = domainCommitteeSize >= 2;
    const spaceProspectDomain = Object.keys(spaceDomainViewers)[0] || 'the prospect company';

    // ── Fallback — same space link, different/free email providers ──
    // Mirrors the document-level fix. Domain matching misses cases
    // where someone shares the space link to a personal Gmail/Outlook
    // address. If 2+ distinct identified emails accessed this SAME
    // space, that's still sharing — just not confirmed as same company.
    const identifiedEmailsInSpace = new Set(
      logs.filter((l: any) => l.visitorEmail).map((l: any) => l.visitorEmail)
    );
    const maxSharedSpaceViewers = identifiedEmailsInSpace.size;
    const sharedSpaceMultiViewer = maxSharedSpaceViewers >= 2 && !domainCommitteeGrowing;

    const fullCommitteeSize = Math.max(domainCommitteeSize, maxSharedSpaceViewers);
    const fullCommitteeGrowing = domainCommitteeGrowing || sharedSpaceMultiViewer;
    const spaceCommitteeConfidence: 'domain_confirmed' | 'link_only' | 'none' =
      domainCommitteeGrowing ? 'domain_confirmed'
      : sharedSpaceMultiViewer ? 'link_only'
      : 'none';

    // ── Secondary viewer engagement quality for spaces ────────────
    // Score each secondary visitor by number of documents opened
    // and total events to distinguish passive opens from active evaluation
    const primarySpaceVisitor = logs
      .filter((l: any) => l.visitorEmail)
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0]?.visitorEmail || null;

    const spaceSecondaryEngagement = fullCommitteeGrowing
      ? (spaceDomainViewers[spaceProspectDomain] || [])
          .filter((email: string) => email !== primarySpaceVisitor)
          .map((email: string) => {
            const visitorEvents = logs.filter((l: any) => l.visitorEmail === email);
            const docsOpened = new Set(
              visitorEvents.filter((l: any) => l.documentId).map((l: any) => l.documentId.toString())
            ).size;
            const totalEvents = visitorEvents.length;

            const engagementQuality = docsOpened >= 3 || totalEvents >= 5
              ? 'high'
              : docsOpened >= 2 || totalEvents >= 2
              ? 'medium'
              : 'low';

            return { email, docsOpened, totalEvents, engagementQuality };
          })
      : [];

    const spaceHasHighQualitySecondary = spaceSecondaryEngagement.some(
      (v: any) => v.engagementQuality === 'high'
    );

   const spaceGroupLabel = spaceCommitteeConfidence === 'link_only'
      ? `${fullCommitteeSize} different people`
      : `${fullCommitteeSize} people from ${spaceProspectDomain}`;

    const fullRecommendedAction = spaceCommitteeConfidence === 'domain_confirmed'
      ? spaceHasHighQualitySecondary
        ? `Signal detected (high confidence): ${spaceGroupLabel} have accessed this space and at least one secondary visitor opened multiple documents actively. This indicates genuine internal evaluation beyond a passive forward. Ask your champion who else is now involved and what each person cares about most before sending any follow up.`
        : `Signal detected (high confidence): ${spaceGroupLabel} have accessed this space. Secondary visitor engagement is present but moderate. Monitor whether secondary viewers return before deciding to act.`
      : spaceCommitteeConfidence === 'link_only'
      ? `Signal detected (medium confidence): ${spaceGroupLabel} have accessed this space. Their email addresses don't share a company domain, so this may be personal email used for business, or the space link forwarded outside the original company. More than one person is now looking at this regardless. Asking your contact who else has seen it may clarify the picture.`
      : `Signal detected (low confidence): Engagement is from a single viewer. No internal sharing pattern detected yet. A context-based follow up may be appropriate depending on your relationship and sales stage.`;

    const lastActivity = logs.length > 0 ? logs[0].timestamp : null;

    // ─── 2. VISITOR ENGAGEMENT TABLE ─────────────────────────────────────
    const visitorMap: Record<string, {
      email: string
      totalEvents: number
      docsViewed: Set<string>
      downloads: number
      firstSeen: Date
      lastSeen: Date
      shareLinks: Set<string>
    }> = {};

    for (const log of logs) {
      const email = log.visitorEmail;
      if (!email) continue;

      if (!visitorMap[email]) {
        visitorMap[email] = {
          email,
          totalEvents: 0,
          docsViewed: new Set(),
          downloads: 0,
          firstSeen: log.timestamp,
          lastSeen: log.timestamp,
          shareLinks: new Set()
        };
      }

      const v = visitorMap[email];
      v.totalEvents++;
      if (log.documentId) v.docsViewed.add(log.documentId.toString());
      if (log.event === 'download') v.downloads++;
      if (log.shareLink) v.shareLinks.add(log.shareLink);
      if (new Date(log.timestamp) > new Date(v.lastSeen)) v.lastSeen = log.timestamp;
      if (new Date(log.timestamp) < new Date(v.firstSeen)) v.firstSeen = log.timestamp;
    }

   // ─── 3. DOCUMENT PERFORMANCE ──────────────────────────────────────────
    const docMap: Record<string, {
      documentId: string
      documentName: string
      views: number
      downloads: number
      uniqueViewers: Set<string>
      lastViewed: Date | null
    }> = {};

    for (const log of logs) {
      if (!log.documentId) continue;
      const docId   = log.documentId.toString();
      const docName = log.documentName || 'Unknown Document';

      if (!docMap[docId]) {
        docMap[docId] = {
          documentId: docId,
          documentName: docName,
          views: 0,
          downloads: 0,
          uniqueViewers: new Set(),
          lastViewed: null
        };
      }

      const d = docMap[docId];
      if (log.event === 'document_view' || log.event === 'view') {
        d.views++;
        if (!d.lastViewed || new Date(log.timestamp) > new Date(d.lastViewed)) {
          d.lastViewed = log.timestamp;
        }
      }
      if (log.event === 'download') d.downloads++;
      if (log.visitorEmail) d.uniqueViewers.add(log.visitorEmail);
    }

    const documents = Object.values(docMap).map(d => ({
      documentId: d.documentId,
      documentName: d.documentName,
      views: d.views,
      downloads: d.downloads,
      uniqueViewers: d.uniqueViewers.size,
      lastViewed: d.lastViewed
    })).sort((a, b) => b.views - a.views);

    // ─── 2. VISITOR ENGAGEMENT TABLE ─────────────────────────────────────
    const visitors = Object.values(visitorMap).map(v => {
      const hoursSinceLastSeen = (now - new Date(v.lastSeen).getTime()) / (1000 * 60 * 60);
      const daysSinceLastSeen = hoursSinceLastSeen / 24;

      // Signal 1: Recency
      const recencyScore = hoursSinceLastSeen <= 24  ? 30 :
                           hoursSinceLastSeen <= 72  ? 22 :
                           hoursSinceLastSeen <= 168 ? 12 :
                           hoursSinceLastSeen <= 336 ? 5  : 0;

      // Signal 2: Multiple sessions
      const sessionScore = v.totalEvents >= 5 ? 20 :
                           v.totalEvents >= 3 ? 14 :
                           v.totalEvents >= 2 ? 8  :
                           v.totalEvents === 1 ? 3 : 0;

      // Signal 3: Document depth
      const totalSpaceDocs = documents.length || 1;
      const coveragePct = (v.docsViewed.size / totalSpaceDocs) * 100;
      const depthScore = coveragePct >= 80 ? 20 :
                         coveragePct >= 50 ? 14 :
                         coveragePct >= 25 ? 8  :
                         coveragePct > 0   ? 4  : 0;

      // Signal 4: Downloads
      const downloadScore = v.downloads >= 3 ? 15 :
                            v.downloads >= 1 ? 10 : 0;

      // Signal 5: Internal sharing
      const visitorDomain = v.email.includes('@')
        ? v.email.split('@')[1].toLowerCase()
        : null;
      const isFreeDomain = visitorDomain
        ? FREE_EMAIL_DOMAINS_SPACE.has(visitorDomain)
        : true;
      const sameCompanyViewers = visitorDomain && !isFreeDomain
        ? Object.values(visitorMap).filter(other =>
            other.email !== v.email &&
            other.email.includes('@') &&
            other.email.split('@')[1].toLowerCase() === visitorDomain
          ).length
        : 0;
      const internalSharingScore = sameCompanyViewers >= 2 ? 25 :
                                   sameCompanyViewers >= 1 ? 18 : 0;

      // Dead deal penalty
      const silencePenalty = daysSinceLastSeen > 21 ? -25 :
                             daysSinceLastSeen > 14 ? -15 :
                             daysSinceLastSeen > 10 ? -8  : 0;

      const engagementScore = Math.min(100, Math.max(0,
        recencyScore + sessionScore + depthScore + downloadScore + internalSharingScore + silencePenalty
      ));

      const isLikelyDead = daysSinceLastSeen > 21 && v.totalEvents <= 1;
      const isDisengaging = daysSinceLastSeen > 7 && v.totalEvents <= 2 && v.docsViewed.size <= 1;

      let status: 'hot' | 'warm' | 'cold' | 'new';
      if (isLikelyDead)               status = 'cold';
      else if (engagementScore >= 65) status = 'hot';
      else if (engagementScore >= 35) status = 'warm';
      else if (hoursSinceLastSeen < 48) status = 'new';
      else status = 'cold';

      let deadDealVerdict: string | null = null;
    if (isLikelyDead) {
        deadDealVerdict = `${v.email} opened this space ${Math.round(daysSinceLastSeen)} days ago and has not returned. Prolonged silence after a single visit is one of the more common patterns in deals that go cold — though external factors you cannot see may also explain it.`;
      } else if (isDisengaging) {
        deadDealVerdict = `${v.email} visited briefly and has not returned in ${Math.round(daysSinceLastSeen)} days. Light engagement followed by silence may indicate poor timing or competing priorities rather than lost interest.`;
      }

      return {
        email: v.email,
        totalEvents: v.totalEvents,
        docsViewed: v.docsViewed.size,
        downloads: v.downloads,
        firstSeen: v.firstSeen,
        lastSeen: v.lastSeen,
        engagementScore,
        status,
        internalSharing: sameCompanyViewers > 0,
        sameCompanyViewerCount: sameCompanyViewers,
        coveragePct: Math.round(coveragePct),
        daysSinceLastSeen: Math.round(daysSinceLastSeen),
        isLikelyDead,
        deadDealVerdict,
        signals: {
          recency: recencyScore,
          sessions: sessionScore,
          depth: depthScore,
          downloads: downloadScore,
          internalSharing: internalSharingScore,
        }
      };
   })
    .filter(v =>
      // Approach 1 — remove visitors with zero engagement after 30 days
      !(v.engagementScore === 0 && v.daysSinceLastSeen > 30) &&
      // Approach 3 — remove visitors who bounced and never returned after 21 days
      !(v.isLikelyDead && v.daysSinceLastSeen > 21 && v.totalEvents <= 1)
    )
    .sort((a, b) => b.engagementScore - a.engagementScore);

    // ─── 4. ACTIVITY TIMELINE ────────────────────────────────────────────

    
    // ─── 4. ACTIVITY TIMELINE ────────────────────────────────────────────
    const timeline = logs.slice(0, 50).map(log => ({
      id: log._id.toString(),
      email: log.visitorEmail || 'Anonymous',
      event: log.event,
      documentName: log.documentName || null,
      documentId: log.documentId?.toString() || null,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress || null,
      shareLink: log.shareLink || null
    }));

    // ─── 5. DAILY VISITS (last 30 days) ──────────────────────────────────
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const recentLogs    = logs.filter(l => new Date(l.timestamp) >= thirtyDaysAgo);

    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d   = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    for (const log of recentLogs) {
      const key = new Date(log.timestamp).toISOString().split('T')[0];
      if (dailyMap[key] !== undefined) dailyMap[key]++;
    }

    const dailyVisits = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ─── 6. DEAL HEAT SCORE ───────────────────────────────────────────────
    const last7DaysLogs = logs.filter(l => new Date(l.timestamp) >= new Date(now - 7 * 24 * 60 * 60 * 1000));
    const last24hLogs   = logs.filter(l => new Date(l.timestamp) >= new Date(now - 24 * 60 * 60 * 1000));

    const dealHeatScore = Math.round(
      Math.min(40, last24hLogs.length * 8) +
      Math.min(30, last7DaysLogs.length * 3) +
      Math.min(20, uniqueVisitors * 5) +
      Math.min(10, totalDownloads * 5)
    );

   // ─────────────────────────────────────────────────────────────────────────────
// REPLACE ONLY SECTION 7 in your analytics-route-v2.ts
// Find: "// ─── 7. PER SHARE LINK BREAKDOWN"  and replace through "shareLinks.sort..."
// ─────────────────────────────────────────────────────────────────────────────

    // ─── 7. PER SHARE LINK BREAKDOWN (DocSend-style) ─────────────────────
    // publicAccess is now an ARRAY — handle both old (object) and new (array) format
    const publicAccessList: any[] = Array.isArray(space.publicAccess)
      ? space.publicAccess
      : space.publicAccess
        ? [space.publicAccess]   // backwards compat: old single-object format
        : [];

    const totalDocsInSpace = await db.collection('documents').countDocuments({
      spaceId: new ObjectId(spaceId),
      archived: { $ne: true }
    });

    const viewEvents     = ['view', 'document_view', 'docment_enter', 'space_open', 'page_view'];
    const downloadEvents = ['download', 'file_download', 'document_download'];

    const shareLinks = publicAccessList.map((pa: any) => {
      const linkSlug = pa.shareLink || '';

      // All logs that came through this specific share link
      const linkLogs = logs.filter((l: any) => l.shareLink === linkSlug);

      const visits         = linkLogs.filter((l: any) => viewEvents.includes(l.event)).length;
      const allEvents      = linkLogs.length
      const linkVisitors   = new Set(linkLogs.map((l: any) => l.visitorEmail).filter(Boolean)).size;
      const downloads      = linkLogs.filter((l: any) => downloadEvents.includes(l.event)).length;
      const docsVisited    = new Set(
        linkLogs.filter((l: any) => l.documentId).map((l: any) => l.documentId.toString())
      ).size;

      // Last activity from this link
      const sortedLinkLogs = [...linkLogs].sort(
        (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const linkLastActivity = sortedLinkLogs.length > 0 ? sortedLinkLogs[0].timestamp : null;

      // Heat score for this specific link
      const linkLast24h = linkLogs.filter(
        (l: any) => new Date(l.timestamp) >= new Date(now - 24 * 60 * 60 * 1000)
      );
      const linkLast7d  = linkLogs.filter(
        (l: any) => new Date(l.timestamp) >= new Date(now - 7 * 24 * 60 * 60 * 1000)
      );
      const linkHeat = Math.min(100, Math.round(
        Math.min(40, linkLast24h.length * 10) +
        Math.min(40, linkLast7d.length  * 4)  +
        Math.min(20, linkVisitors        * 10)
      ));

      let linkStatus: 'hot' | 'warm' | 'cold' | 'never';
      if (allEvents === 0)    linkStatus = 'never';
      else if (linkHeat >= 60) linkStatus = 'hot';
      else if (linkHeat >= 25) linkStatus = 'warm';
      else                     linkStatus = 'cold';

      return {
        shareLink:     linkSlug,
        label:         pa.label || null,
        securityLevel: pa.securityLevel || 'open',
        createdAt:     pa.createdAt     || null,
        expiresAt:     pa.expiresAt     || null,
        isExpired:     pa.expiresAt ? new Date(pa.expiresAt) < new Date() : false,
        enabled:       pa.enabled !== false,
        visits,
        allEvents,
        visitors:      linkVisitors,
        downloads,
        docsVisited,
        totalDocs:     totalDocsInSpace,
        lastActivity:  linkLastActivity,
        heatScore:     linkHeat,
        status:        linkStatus,
        publicUrl:     pa.publicUrl || `${process.env.NEXT_PUBLIC_APP_URL}/portal/${linkSlug}`
      };
    }).sort((a: any, b: any) => {
      // Sort: links with activity first, then by heat score
      if (b.allEvents !== a.allEvents) return b.allEvents - a.allEvents;
      return b.heatScore - a.heatScore;
    });


    // ── Deal Intelligence per visitor ─────────────────────────────────────
    // Same interpretation logic as single document analytics
    // but applied across all documents in the space per visitor

   const { buildSpaceVisitorIntelligence } = await import('@/lib/buildSpaceVisitorIntelligence');

    const spaceVisitorIntelligence = await Promise.all(
      visitors.slice(0, 20).map((visitor) =>
        buildSpaceVisitorIntelligence({
          db,
          spaceId,
          visitor,
          logs,
          visitors,
          documents,
        })
      )
    );

   // ── Fire deal intelligence to HubSpot for top visitors ───────────────
    // Runs silently — never blocks or crashes the response
    if (spaceVisitorIntelligence.length > 0 && space.userId) {
      import('@/lib/integrations/hubspotSync').then(
        ({ syncDealIntelligenceToHubSpot, isHubSpotConnected }) => {
          isHubSpotConnected(space.userId).then(connected => {
            if (!connected) return;

            // Fire for top 3 visitors only to avoid rate limits
            spaceVisitorIntelligence.slice(0, 3).forEach(intel => {
              if (!intel.email || intel.email === 'Anonymous') return;

              syncDealIntelligenceToHubSpot({
                userId:               space.userId,
                viewerEmail:          intel.email,
                documentName:         space.name || 'Space',
                documentId:           spaceId,
                spaceId:              spaceId,
                momentumScore:        intel.engagementScore,
                engagementState:      intel.momentumState,
                lastSignal:           intel.reReadDocs?.length > 0
                  ? `Returned to "${intel.reReadDocs[0].docName}" ${intel.reReadDocs[0].sessionCount} times`
                  : intel.hasInternalSharing
                  ? `Internal sharing detected from ${intel.secondaryViewers?.[0] || 'same company'}`
                  : intel.returnWithQuestion
                  ? `Returned after silence and asked: "${intel.returnQuestionText?.slice(0, 60)}"`
                  : `${intel.docsOpened} of ${documents.length} documents reviewed`,
                recommendedAction:    intel.recommendation,
                internalSharing:      intel.hasInternalSharing,
                secondaryViewerCount: intel.secondaryViewers?.length,
                daysSinceLastActivity: intel.daysSinceLastActivity,
                isSpace:              true,
              }).catch(() => {});
            });
          }).catch(() => {});
        }
      ).catch(() => {});
    }

    // ─── RESPONSE ─────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalViews,
          totalDownloads,
          uniqueVisitors,
          totalEvents,
          lastActivity,
          dealHeatScore,
          totalShareLinks: shareLinks.length
        },
        shareLinks,   // ← NEW
        visitors,
        documents,
        timeline,
        dailyVisits,
        committeeGrowing: fullCommitteeGrowing,
        committeeSize: fullCommitteeSize,
        committeeConfidence: spaceCommitteeConfidence,
        prospectDomain: spaceProspectDomain,
        recommendedAction: fullRecommendedAction,
        secondaryViewerEngagement: spaceSecondaryEngagement,
        hasHighQualitySecondaryViewer: spaceHasHighQualitySecondary,
        visitorIntelligence: spaceVisitorIntelligence,
      }
    });

  } catch (error) {
    console.error('❌ Analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}