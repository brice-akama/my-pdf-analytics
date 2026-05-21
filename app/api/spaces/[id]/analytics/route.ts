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
      const sameCompanyViewers = visitorDomain
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
        deadDealVerdict = `${v.email} opened this space ${Math.round(daysSinceLastSeen)} days ago and has not returned. Send one final message acknowledging the silence without guilt. If there is no reply within three days close this deal and set a six week reminder.`;
      } else if (isDisengaging) {
        deadDealVerdict = `${v.email} visited briefly and has not returned in ${Math.round(daysSinceLastSeen)} days. Send one direct question about whether this is still a priority before this goes completely cold.`;
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
    }).sort((a, b) => b.engagementScore - a.engagementScore);

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

    const spaceVisitorIntelligence = await Promise.all(
      visitors.slice(0, 20).map(async (visitor) => {

        // Get all activity logs for this visitor in this space
        const visitorLogs = logs.filter(l =>
          l.visitorEmail === visitor.email
        );

        // Sessions grouped by document
        const docSessionMap = new Map<string, Set<string>>();
        visitorLogs.forEach((log: any) => {
          if (!log.documentId) return;
          const docId = log.documentId.toString();
          if (!docSessionMap.has(docId)) docSessionMap.set(docId, new Set());
          if (log.sessionId) docSessionMap.get(docId)!.add(log.sessionId);
        });

        // Re-read detection — documents opened in 2+ distinct sessions
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

        // Days since last activity
        const daysSinceLastActivity = visitor.lastSeen
          ? Math.floor((Date.now() - new Date(visitor.lastSeen).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Secondary viewer detection — another person from same company domain
        const visitorDomain = visitor.email.includes('@')
          ? visitor.email.split('@')[1].toLowerCase()
          : null;
        const secondaryViewers = visitorDomain
          ? visitors.filter(v =>
              v.email !== visitor.email &&
              v.email.includes('@') &&
              v.email.split('@')[1].toLowerCase() === visitorDomain
            )
          : [];
        const hasInternalSharing = secondaryViewers.length > 0;

        // Document coverage — what percentage of space docs did they open
        const docsOpened = new Set(
          visitorLogs.filter((l: any) => l.documentId).map((l: any) => l.documentId.toString())
        ).size;
        const coveragePercent = documents.length > 0
          ? Math.round((docsOpened / documents.length) * 100)
          : 0;

        // Progressive return pattern — are they going deeper each visit
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

        // Momentum state
        let momentumState: 'accelerating' | 'holding' | 'fading' | 'stalled';
        if (visitor.engagementScore >= 70 && daysSinceLastActivity <= 3) momentumState = 'accelerating';
        else if (visitor.engagementScore >= 40 && daysSinceLastActivity <= 7) momentumState = 'holding';
        else if (daysSinceLastActivity <= 14) momentumState = 'fading';
        else momentumState = 'stalled';

        // Plain English narrative
        let narrative = '';
        if (momentumState === 'accelerating') {
          if (hasInternalSharing) {
            narrative = `${visitor.email} has opened this space and a second person from ${visitorDomain} has also accessed it. Your proposal has moved beyond your original contact and is being reviewed internally. Reach out today and ask directly who else is involved in the decision.`;
          } else if (reReadDocs.length > 0) {
            narrative = `${visitor.email} has returned to this space ${reReadDocs[0].sessionCount} times and keeps coming back to ${reReadDocs[0].docName}. Something in that document is making them think carefully. Follow up today and offer to walk them through it directly.`;
          } else {
            narrative = `${visitor.email} is actively engaging with this space and has opened ${docsOpened} of ${documents.length} documents. Engagement is strong. Follow up now while their attention is high.`;
          }
        } else if (momentumState === 'holding') {
          narrative = `${visitor.email} opened ${docsOpened} document${docsOpened !== 1 ? 's' : ''} in this space ${daysSinceLastActivity} day${daysSinceLastActivity !== 1 ? 's' : ''} ago. Engagement is steady but not accelerating. Send a short value add today rather than a generic check in.`;
        } else if (momentumState === 'fading') {
          narrative = `${visitor.email} last visited this space ${daysSinceLastActivity} days ago and engagement is dropping. Send one direct question about their timeline before this goes completely cold.`;
        } else {
          narrative = `${visitor.email} has not visited this space in ${daysSinceLastActivity} days. Send a final short message acknowledging the silence without guilt, or archive this deal and set a reminder for six weeks.`;
        }

        // Recommended action
        let recommendation = '';
        if (momentumState === 'accelerating' && hasInternalSharing) {
          recommendation = `Contact ${visitor.email} today. Ask directly who else on their side should be part of the conversation. Do not mention that you can see the space has been shared internally — just ask naturally.`;
        } else if (momentumState === 'accelerating') {
          recommendation = `Follow up today. Lead with something specific about what they have been reviewing rather than asking if they had a chance to look at it. They clearly did.`;
        } else if (momentumState === 'holding') {
          recommendation = `Send a value add today. A relevant case study or a one line answer to a likely question. Then ask one direct question about their timeline. Do not ask if they read it.`;
        } else if (momentumState === 'fading') {
          recommendation = `Send one direct question today — is moving forward still a priority right now or should we revisit this at a better time. Direct questions get responses even when engagement is dropping.`;
        } else {
          recommendation = `Send one final short message. If there is no reply within three days close this deal and set a six week reminder. Some deals are not dead, they are just waiting for an external trigger.`;
        }

        // ── Return after silence plus question detection ───────────────────
        // If a visitor went silent for 3+ days then came back AND asked
        // a question within 24 hours of returning — that combination is
        // one of the strongest buying signals in the dataset
        const visitorComments = await db.collection('portal_comments').find({
          spaceId: new ObjectId(spaceId),
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

        // Boost momentum score when return plus question detected
        if (returnWithQuestion) {
          if (momentumState === 'fading') momentumState = 'holding';
          if (momentumState === 'holding') momentumState = 'accelerating';
        }

        // Update narrative if return plus question detected
        let finalNarrative = narrative;
        if (returnWithQuestion && returnQuestionText) {
          finalNarrative = `${visitor.email} went quiet then came back and asked a specific question — "${returnQuestionText.slice(0, 80)}${returnQuestionText.length > 80 ? '...' : ''}". This combination is one of the strongest buying signals in your pipeline. They were not gone. They were thinking. Follow up today and answer their question directly.`;
        }


        return {
          email: visitor.email,
          engagementScore: visitor.engagementScore,
          status: visitor.status,
          momentumState,
          returnWithQuestion,
          returnQuestionText,
          narrative: finalNarrative,
          progressionPattern,
          docsOpened,
          coveragePercent,
          reReadDocs,
          hasInternalSharing,
          secondaryViewers: secondaryViewers.map(v => v.email),
          daysSinceLastActivity,
         
          recommendation,
        };
      })
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
        visitorIntelligence: spaceVisitorIntelligence,
      }
    });

  } catch (error) {
    console.error('❌ Analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}