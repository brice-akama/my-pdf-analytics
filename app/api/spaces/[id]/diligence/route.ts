// app/api/spaces/[id]/diligence/route.ts
//
// WHAT CHANGED vs previous version:
//   1. Investors now grouped by (email + shareLink) — "john@vc.com via Sequoia link"
//      and "john@vc.com via Tiger link" appear as two separate rows.
//   2. firstSeen added to each investor.
//   3. Per-doc isFirstOpen / isReturnVisit detection: if this email opened
//      this doc via a different link before, it's flagged as a return visit.
//   4. isReturningInvestor: true if same email appears under multiple links.
//   5. summary.linkSummary: per-link investor count + total time breakdown.
//   6. linkLabel built from space.publicAccess[].label for display in UI.

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r > 0 ? `${m}m ${r}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params  = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;

    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) });
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

    const isOwner  = space.userId === user.id;
    const isMember = space.members?.some((m: any) => m.email === user.email || m.userId === user.id);
    if (!isOwner && !isMember) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // ── Fetch sessions sorted oldest-first so firstSeen is accurate ─────────
    const sessions = await db.collection('diligenceLogs')
      .find({ spaceId: new ObjectId(spaceId) })
      .sort({ startedAt: 1 })
      .toArray();

    // ── All live docs ────────────────────────────────────────────────────────
    const documents = await db.collection('documents')
      .find({ spaceId: new ObjectId(spaceId), archived: { $ne: true } })
      .toArray();

    const docNameMap: Record<string, string> = {};
    documents.forEach((d: any) => { docNameMap[d._id.toString()] = d.name; });

    // ── Link label map from space.publicAccess ────────────────────────────────
    const publicAccessList: any[] = Array.isArray(space.publicAccess)
      ? space.publicAccess
      : space.publicAccess ? [space.publicAccess] : [];

    const linkLabelMap: Record<string, string> = {};
    publicAccessList.forEach((pa: any) => {
      if (pa.shareLink) {
        linkLabelMap[pa.shareLink] = pa.label || `Link …${pa.shareLink.slice(-6)}`;
      }
    });

    // ── Build per-(email+shareLink) investor map ──────────────────────────────
    // Track global first open per email+doc so we can detect return visits
    // across different share links.
    // globalFirstOpen["john@vc.com||docABC"] = earliest Date any link saw it
    const globalFirstOpen: Record<string, Date> = {};

    // First pass: establish global first-open times
    for (const s of sessions) {
      const email  = s.visitorEmail || 'Anonymous';
      const docId  = s.documentId?.toString() || 'unknown';
      const openAt = new Date(s.startedAt || s.lastHeartbeat || Date.now());
      const gKey   = `${email}||${docId}`;
      if (!globalFirstOpen[gKey] || openAt < globalFirstOpen[gKey]) {
        globalFirstOpen[gKey] = openAt;
      }
    }

    type DocStat = {
      totalSeconds:  number
      sessionCount:  number
      openCount:     number
      lastSeen:      Date
      firstOpenedAt: Date
      documentName:  string
    }

    const investorMap: Record<string, {
      email:     string
      shareLink: string
      linkLabel: string
      docs:      Record<string, DocStat>
    }> = {};

    // Second pass: aggregate per investor+link
    for (const s of sessions) {
      const email      = s.visitorEmail || 'Anonymous';
      const shareLink  = s.shareLink    || '__direct__';
      const docId      = s.documentId?.toString() || 'unknown';
      const docName    = s.documentName || docNameMap[docId] || 'Unknown Document';
      const seconds    = s.totalSeconds || 0;
      const openAt     = new Date(s.startedAt || s.lastHeartbeat || Date.now());
      const lastBeat   = new Date(s.lastHeartbeat || openAt);

      const invKey = `${email}||${shareLink}`;

      if (!investorMap[invKey]) {
        investorMap[invKey] = {
          email,
          shareLink: shareLink === '__direct__' ? '' : shareLink,
          linkLabel: linkLabelMap[shareLink] || (shareLink === '__direct__' ? 'Direct' : `Link …${shareLink.slice(-6)}`),
          docs: {},
        };
      }

      const inv = investorMap[invKey];

      if (!inv.docs[docId]) {
        inv.docs[docId] = {
          totalSeconds:  0,
          sessionCount:  0,
          openCount:     0,
          lastSeen:      lastBeat,
          firstOpenedAt: openAt,
          documentName:  docName,
        };
      }

      const stat = inv.docs[docId];
      stat.totalSeconds  += seconds;
      stat.sessionCount  += 1;
      stat.openCount     += 1;
      if (openAt < stat.firstOpenedAt) stat.firstOpenedAt = openAt;
      if (lastBeat > stat.lastSeen)    stat.lastSeen      = lastBeat;
    }

    // ── Build investor list ───────────────────────────────────────────────────
    const investorKeys = Object.keys(investorMap);

    const investors = investorKeys.map(key => {
      const inv = investorMap[key];

      const totalSecondsAll = Object.values(inv.docs).reduce((s, d) => s + d.totalSeconds, 0);
      const docsOpened      = Object.keys(inv.docs).length;
      const totalDocs       = documents.length;

      const allDates = Object.values(inv.docs).flatMap(d => [d.firstOpenedAt, d.lastSeen]);
      const lastSeen  = allDates.reduce((a, b) => (b > a ? b : a), new Date(0));
      const firstSeen = allDates.reduce((a, b) => (b < a ? b : a), lastSeen);

      // Engagement score (same formula as before)
      const timeScore     = Math.min(40, Math.round(totalSecondsAll / 60 * 4));
      const coverageScore = Math.min(40, Math.round((docsOpened / Math.max(totalDocs, 1)) * 40));
      const hoursAgo      = (Date.now() - lastSeen.getTime()) / 3600000;
      const recencyScore  = Math.max(0, Math.min(20, Math.round(20 - hoursAgo * 0.5)));
      const engagementScore = timeScore + coverageScore + recencyScore;

      // isReturningInvestor: same email appeared under a different shareLink
      const isReturningInvestor = investorKeys.some(
        k => k !== key && k.startsWith(`${inv.email}||`)
      );

      // Per-doc breakdown with first/return visit flag
      const docBreakdown = Object.entries(inv.docs).map(([docId, data]) => {
        const gKey          = `${inv.email}||${docId}`;
        const globalFirst   = globalFirstOpen[gKey];
        // It's a return visit if the earliest open via THIS link was AFTER
        // the global earliest open (meaning they saw it via another link first)
        const isReturnVisit = !!(
          globalFirst &&
          data.firstOpenedAt.getTime() > globalFirst.getTime() + 1000 // 1s buffer
        );

        return {
          documentId:    docId,
          documentName:  data.documentName,
          totalSeconds:  data.totalSeconds,
          sessionCount:  data.sessionCount,
          openCount:     data.openCount,
          lastSeen:      data.lastSeen,
          firstOpenedAt: data.firstOpenedAt,
          formattedTime: formatSeconds(data.totalSeconds),
          intensity:     Math.min(100, Math.round(data.totalSeconds / 300 * 100)),
          isFirstOpen:   !isReturnVisit,
          isReturnVisit,
        };
      }).sort((a, b) => b.totalSeconds - a.totalSeconds);

      return {
        email:               inv.email,
        shareLink:           inv.shareLink,
        linkLabel:           inv.linkLabel,
        isReturningInvestor,
        totalSeconds:        totalSecondsAll,
        formattedTime:       formatSeconds(totalSecondsAll),
        docsOpened,
        totalDocs,
        coveragePct:         Math.round((docsOpened / Math.max(totalDocs, 1)) * 100),
        sessionCount:        Object.values(inv.docs).reduce((s, d) => s + d.sessionCount, 0),
        lastSeen,
        firstSeen,
        engagementScore,
        docBreakdown,
      };
    }).sort((a, b) => b.totalSeconds - a.totalSeconds);

    // ── Document heatmap (all investors + links combined) ────────────────────
    type HeatEntry = { documentName: string; totalSeconds: number; viewers: Set<string> };
    const docHeat: Record<string, HeatEntry> = {};

    for (const inv of Object.values(investorMap)) {
      for (const [docId, data] of Object.entries(inv.docs)) {
        if (!docHeat[docId]) {
          docHeat[docId] = { documentName: data.documentName, totalSeconds: 0, viewers: new Set() };
        }
        docHeat[docId].totalSeconds += data.totalSeconds;
        docHeat[docId].viewers.add(inv.email);
      }
    }
    // Add docs never opened
    for (const doc of documents) {
      const id = doc._id.toString();
      if (!docHeat[id]) {
        docHeat[id] = { documentName: doc.name, totalSeconds: 0, viewers: new Set() };
      }
    }

    const heatmap = Object.entries(docHeat).map(([documentId, d]) => ({
      documentId,
      documentName:        d.documentName,
      totalSeconds:        d.totalSeconds,
      formattedTime:       d.totalSeconds > 0 ? formatSeconds(d.totalSeconds) : '—',
      viewerCount:         d.viewers.size,
      avgSecondsPerViewer: d.viewers.size > 0 ? Math.round(d.totalSeconds / d.viewers.size) : 0,
    })).sort((a, b) => b.totalSeconds - a.totalSeconds);

    // ── Summary ───────────────────────────────────────────────────────────────
    const allSeconds = investors.reduce((s, i) => s + i.totalSeconds, 0);

    const linkSummary = publicAccessList.map((pa: any) => {
      const slug        = pa.shareLink || '';
      const linkInvs    = investors.filter(i => i.shareLink === slug);
      const linkSeconds = linkInvs.reduce((s, i) => s + i.totalSeconds, 0);
      return {
        shareLink:     slug,
        label:         pa.label || null,
        investorCount: linkInvs.length,
        totalSeconds:  linkSeconds,
        formattedTime: linkSeconds > 0 ? formatSeconds(linkSeconds) : '—',
      };
    });

    const summary = {
      totalInvestors:        investors.length,
      totalSessions:         sessions.length,
      totalTimeSeconds:      allSeconds,
      avgSecondsPerInvestor: investors.length > 0 ? Math.round(allSeconds / investors.length) : 0,
      mostEngagedInvestor:   investors[0]?.email || null,
      hotDocs:               heatmap.filter(d => d.totalSeconds > 0).slice(0, 3).map(d => d.documentName),
      coldDocs:              heatmap.filter(d => d.totalSeconds === 0).map(d => d.documentName),
      linkSummary,
    };

    return NextResponse.json({ success: true, investors, heatmap, summary });

  } catch (err) {
    console.error('❌ Diligence error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}