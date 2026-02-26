// app/api/spaces/[id]/diligence/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { verifyUserFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const spaceId = params.id;

    const user = await verifyUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await dbPromise;

    const space = await db.collection('spaces').findOne({ _id: new ObjectId(spaceId) });
    if (!space) return NextResponse.json({ error: 'Space not found' }, { status: 404 });

    const isOwner = space.userId === user.id;
    const isMember = space.members?.some((m: any) => m.email === user.email || m.userId === user.id);
    if (!isOwner && !isMember) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // ── Fetch all diligence sessions for this space ───────────────────────────
    const sessions = await db.collection('diligenceLogs')
      .find({ spaceId: new ObjectId(spaceId) })
      .sort({ startedAt: -1 })
      .toArray();

    // ── Fetch all documents in space for reference ────────────────────────────
    const documents = await db.collection('documents')
      .find({ spaceId: new ObjectId(spaceId), archived: { $ne: true } })
      .toArray();

    const docMap: Record<string, string> = {};
    documents.forEach((d: any) => {
      docMap[d._id.toString()] = d.name;
    });

    // ── Aggregate: per investor, per document ─────────────────────────────────
    // Structure: { [email]: { [documentId]: { totalSeconds, sessions, lastSeen } } }
    const investorDocMap: Record<string, Record<string, {
      totalSeconds: number
      sessionCount: number
      lastSeen: Date
      documentName: string
    }>> = {};

    for (const session of sessions) {
      const email = session.visitorEmail || 'Anonymous';
      const docId = session.documentId?.toString() || 'unknown';
      const docName = session.documentName || docMap[docId] || 'Unknown Document';
      const seconds = session.totalSeconds || 0;

      if (!investorDocMap[email]) investorDocMap[email] = {};

      if (!investorDocMap[email][docId]) {
        investorDocMap[email][docId] = {
          totalSeconds: 0,
          sessionCount: 0,
          lastSeen: new Date(session.lastHeartbeat || session.startedAt),
          documentName: docName,
        };
      }

      investorDocMap[email][docId].totalSeconds += seconds;
      investorDocMap[email][docId].sessionCount += 1;
      if (new Date(session.lastHeartbeat) > investorDocMap[email][docId].lastSeen) {
        investorDocMap[email][docId].lastSeen = new Date(session.lastHeartbeat);
      }
    }

    // ── Build investor list ───────────────────────────────────────────────────
    const investors = Object.entries(investorDocMap).map(([email, docs]) => {
      const totalSecondsAll = Object.values(docs).reduce((s, d) => s + d.totalSeconds, 0);
      const docsOpened = Object.keys(docs).length;
      const totalDocs = documents.length;

      // Find most recent activity
      const lastSeen = Object.values(docs).reduce((latest, d) => {
        return d.lastSeen > latest ? d.lastSeen : latest;
      }, new Date(0));

      // Engagement score based on time and coverage
      const timeScore = Math.min(40, Math.round(totalSecondsAll / 60 * 4)); // 10 min = 40pts
      const coverageScore = Math.min(40, Math.round((docsOpened / Math.max(totalDocs, 1)) * 40));
      const recencyScore = (() => {
        const hoursAgo = (Date.now() - lastSeen.getTime()) / 3600000;
        return Math.max(0, Math.min(20, Math.round(20 - hoursAgo * 0.5)));
      })();
      const engagementScore = timeScore + coverageScore + recencyScore;

      // Per-document breakdown
      const docBreakdown = Object.entries(docs).map(([docId, data]) => ({
        documentId: docId,
        documentName: data.documentName,
        totalSeconds: data.totalSeconds,
        sessionCount: data.sessionCount,
        lastSeen: data.lastSeen,
        formattedTime: formatSeconds(data.totalSeconds),
        intensity: Math.min(100, Math.round(data.totalSeconds / 300 * 100)), // 5min = 100%
      })).sort((a, b) => b.totalSeconds - a.totalSeconds);

      return {
        email,
        totalSeconds: totalSecondsAll,
        formattedTime: formatSeconds(totalSecondsAll),
        docsOpened,
        totalDocs,
        coveragePct: Math.round((docsOpened / Math.max(totalDocs, 1)) * 100),
        sessionCount: Object.values(docs).reduce((s, d) => s + d.sessionCount, 0),
        lastSeen,
        engagementScore,
        docBreakdown,
      };
    }).sort((a, b) => b.totalSeconds - a.totalSeconds);

    // ── Document heatmap: which docs get most time across all investors ────────
    const docHeatmap: Record<string, { documentId: string; documentName: string; totalSeconds: number; viewerCount: number }> = {};
    for (const investor of investors) {
      for (const doc of investor.docBreakdown) {
        if (!docHeatmap[doc.documentId]) {
          docHeatmap[doc.documentId] = {
            documentId: doc.documentId,
            documentName: doc.documentName,
            totalSeconds: 0,
            viewerCount: 0,
          };
        }
        docHeatmap[doc.documentId].totalSeconds += doc.totalSeconds;
        docHeatmap[doc.documentId].viewerCount += 1;
      }
    }

    // Add documents that were never opened
    for (const doc of documents) {
      const docId = doc._id.toString();
      if (!docHeatmap[docId]) {
        docHeatmap[docId] = {
          documentId: docId,
          documentName: doc.name,
          totalSeconds: 0,
          viewerCount: 0,
        };
      }
    }

    const heatmap = Object.values(docHeatmap).map(d => ({
      ...d,
      formattedTime: formatSeconds(d.totalSeconds),
      avgSecondsPerViewer: d.viewerCount > 0 ? Math.round(d.totalSeconds / d.viewerCount) : 0,
    })).sort((a, b) => b.totalSeconds - a.totalSeconds);

    // ── Summary ───────────────────────────────────────────────────────────────
    const summary = {
      totalInvestors: investors.length,
      totalSessions:  sessions.length,
      totalTimeSeconds: investors.reduce((s, i) => s + i.totalSeconds, 0),
      avgSecondsPerInvestor: investors.length > 0
        ? Math.round(investors.reduce((s, i) => s + i.totalSeconds, 0) / investors.length)
        : 0,
      mostEngagedInvestor: investors[0]?.email || null,
      hotDocs: heatmap.slice(0, 3).map(d => d.documentName),
      coldDocs: heatmap.filter(d => d.totalSeconds === 0).map(d => d.documentName),
    };

    return NextResponse.json({ success: true, investors, heatmap, summary });

  } catch (error) {
    console.error('❌ Diligence error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
}