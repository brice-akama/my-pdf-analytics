//api/dashboard/priority/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';
import { checkAccess } from '@/lib/checkAccess';

export async function GET(request: NextRequest) {
  try {
    const access = await checkAccess(request);
    if (!access.ok) return access.response;

    const db = await dbPromise;
    const now = Date.now();

    // Get all active shares for this user
    const userDocs = await db.collection('documents')
      .find({ userId: access.userId })
      .toArray();

    const docIds = userDocs.map((d: any) => d._id.toString());

    if (docIds.length === 0) {
      return NextResponse.json({ success: true, priorities: [] });
    }

    // Get recent sessions across all docs
    const recentSessions = await db.collection('analytics_sessions')
      .find({
        documentId: { $in: docIds },
        startedAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) },
      })
      .sort({ startedAt: -1 })
      .toArray();

    // Group sessions by document
    const docSessionMap = new Map<string, any[]>();
    recentSessions.forEach((s: any) => {
      if (!docSessionMap.has(s.documentId)) docSessionMap.set(s.documentId, []);
      docSessionMap.get(s.documentId)!.push(s);
    });

    const priorities: any[] = [];

    for (const doc of userDocs) {
      const docId = doc._id.toString();
      const sessions = docSessionMap.get(docId) || [];

      if (sessions.length === 0) continue;

      // Compute domain viewer map
      const domainViewers = sessions
        .filter((s: any) => s.email)
        .reduce((acc: Record<string, string[]>, s: any) => {
          const domain = s.email?.split('@')[1];
          if (domain) {
            if (!acc[domain]) acc[domain] = [];
            if (!acc[domain].includes(s.email)) acc[domain].push(s.email);
          }
          return acc;
        }, {});

      const committeeSize = Math.max(
        ...Object.values(domainViewers).map((v: any) => v.length), 1
      );
      const committeeGrowing = committeeSize >= 2;

      const lastSession = sessions[0];
      const daysSinceLast = Math.floor(
        (now - new Date(lastSession.startedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check for new viewer in last 48 hours
      const newViewerLast48h = committeeGrowing && sessions.some((s: any) => {
        return s.email &&
          (now - new Date(s.startedAt).getTime()) < 48 * 60 * 60 * 1000;
      });

      // Compute priority score
      let priorityScore = 0;
      let priorityReason = '';
      let priorityAction = '';

      if (newViewerLast48h) {
        priorityScore = 100;
        priorityReason = `New stakeholder from same organisation opened this in the last 48 hours`;
        priorityAction = `Ask your champion who else is now involved before sending any follow up`;
      } else if (committeeGrowing && daysSinceLast <= 3) {
        priorityScore = 85;
        priorityReason = `${committeeSize} people from same organisation have engaged and activity is recent`;
        priorityAction = `Follow up today with a question about who else should be involved`;
      } else if (daysSinceLast === 0) {
        priorityScore = 70;
        priorityReason = `Opened today`;
        priorityAction = `Monitor for the next few hours before deciding to follow up`;
      } else if (daysSinceLast <= 2 && sessions.length >= 3) {
        priorityScore = 65;
        priorityReason = `${sessions.length} sessions in the last ${daysSinceLast} days — active evaluation`;
        priorityAction = `Follow up with something specific rather than a generic check in`;
      } else if (daysSinceLast >= 5 && daysSinceLast <= 10 && sessions.length >= 2) {
        priorityScore = 50;
        priorityReason = `Engagement slowing after good early activity`;
        priorityAction = `Send one direct question about their timeline before this goes cold`;
      } else if (daysSinceLast >= 14) {
        priorityScore = 30;
        priorityReason = `${daysSinceLast} days of silence`;
        priorityAction = `Send a final short message or archive this deal`;
      } else {
        priorityScore = 20;
        priorityReason = `Moderate engagement, no urgent action needed`;
        priorityAction = `Monitor for another day or two`;
      }

      priorities.push({
        documentId: docId,
        documentName: doc.originalFilename || doc.filename || 'Untitled',
        priorityScore,
        priorityReason,
        priorityAction,
        committeeSize,
        committeeGrowing,
        daysSinceLast,
        totalSessions: sessions.length,
        lastActivity: lastSession.startedAt,
      });
    }

    // Sort by priority score descending
    priorities.sort((a, b) => b.priorityScore - a.priorityScore);

    return NextResponse.json({
      success: true,
      priorities: priorities.slice(0, 10),
      generatedAt: new Date(),
    });

  } catch (error) {
    console.error('[Priority] error:', error);
    return NextResponse.json({ success: true, priorities: [] });
  }
}