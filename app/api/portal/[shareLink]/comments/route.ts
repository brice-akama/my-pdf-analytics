// app/api/portal/[shareLink]/comments/route.ts
 
import { NextRequest, NextResponse } from 'next/server';
import { dbPromise } from '@/app/api/lib/mongodb';

// ── Helper: find space supporting BOTH old (object) and new (array) publicAccess ──
async function getSpace(db: any, shareLink: string) {
  return db.collection('spaces').findOne({
    $or: [
      { publicAccess: { $elemMatch: { shareLink, enabled: true } } },  // new array
      { publicAccess: { $elemMatch: { shareLink } } },                  // new array, no enabled check
      { 'publicAccess.shareLink': shareLink },                          // old object
    ]
  });
}

// ── GET: fetch comments for a document ───────────────────────────────────────
export async function GET(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { shareLink } = params;

    const db = await dbPromise;
    const space = await getSpace(db, shareLink);
    if (!space) {
      return NextResponse.json({ success: false, error: 'Invalid link' }, { status: 404 });
    }

    const spaceId = space._id.toString();
    const { searchParams } = new URL(request.url);
    const documentId   = searchParams.get('documentId');
    const visitorEmail = searchParams.get('email');

    const query: any = { spaceId };

    // Privacy: if email provided, only return that visitor's comments
    // If no email (anonymous), return all comments for this link
    if (visitorEmail && visitorEmail.trim()) {
      query.email = visitorEmail.trim().toLowerCase();
    } else {
      // Scope to this link so anonymous users don't see all links' comments
      query.shareLink = shareLink;
    }

    if (documentId) query.documentId = documentId;

    const comments = await db.collection('portal_comments')
      .find(query)
      .sort({ createdAt: 1 })
      .toArray();

    const transformed = comments.map((c: any) => ({
      id:           c._id.toString(),
      documentId:   c.documentId,
      documentName: c.documentName,
      author:       c.email,
      message:      c.message,
      reply:        c.reply || null,
      repliedAt:    c.repliedAt || null,
      createdAt:    c.createdAt,
    }));

    return NextResponse.json({ success: true, comments: transformed });

  } catch (error) {
    console.error('❌ GET comments error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// ── POST: visitor submits a comment ──────────────────────────────────────────
export async function POST(
  request: NextRequest,
  context: { params: { shareLink: string } | Promise<{ shareLink: string }> }
) {
  try {
    const params = context.params instanceof Promise ? await context.params : context.params;
    const { shareLink } = params;

    const db = await dbPromise;
    const space = await getSpace(db, shareLink);
    if (!space) {
      return NextResponse.json({ success: false, error: 'Invalid link' }, { status: 404 });
    }

    const body = await request.json();
    const { documentId, documentName, message, email } = body;

    // ── Only require message — email can be empty for anonymous portals ──────
    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const spaceId = space._id.toString();

    // ── Find the label for this link (e.g. "Sequoia – Series A") ────────────
    const publicAccessList = Array.isArray(space.publicAccess)
      ? space.publicAccess
      : space.publicAccess ? [space.publicAccess] : [];

    const thisLink = publicAccessList.find((pa: any) => pa.shareLink === shareLink);
    const linkLabel = thisLink?.label || null;

    const normalizedEmail = email?.trim().toLowerCase() || 'anonymous';

    const newComment = {
      spaceId,
      spaceOwnerId: space.userId || space.ownerId || null,
      shareLink,
      linkLabel,
      documentId:   documentId || 'general',
      documentName: documentName || 'General Question',
      email:        normalizedEmail,
      message:      message.trim(),
      reply:        null,
      repliedAt:    null,
      createdAt:    new Date(),
      updatedAt:    new Date(),
    };

   const result = await db.collection('portal_comments').insertOne(newComment);

    console.log(`💬 Comment from ${normalizedEmail} via "${linkLabel || shareLink}"`);

    // ── Notify rep and all space members when a buyer asks a question ──
    // A buyer asking a question while actively reviewing a space is one
    // of the strongest buying signals in the data. Speed of reply matters
    // — notify immediately so the rep can respond while the buyer is
    // still present. Silent failure — never blocks the comment save.
    // DocMetrics advantage over Seismic: the rep receives not just the
    // question but the engagement context around it, so they can reply
    // with full knowledge of where the buyer is in their evaluation
    // rather than having to open the dashboard first.
    (async () => {
      try {
        const ownerId = space.userId || space.createdBy || space.ownerId;
        const spaceName = space.name || 'Your space';
        const buyerEmail = normalizedEmail;
        const commentText = message.trim();

        // ── Get buyer engagement context ──────────────────────────
        // How many sessions, how long they have been looking at
        // this space, how many questions they have asked before —
        // all of this goes into the notification so the rep has
        // full context before they reply.
        const visitorLogs = await db.collection('activityLogs')
          .find({
            spaceId: space._id,
            visitorEmail: buyerEmail,
          })
          .sort({ timestamp: -1 })
          .limit(50)
          .toArray();

        const sessionCount = new Set(
          visitorLogs
            .filter((l: any) => l.sessionId)
            .map((l: any) => l.sessionId)
        ).size;

        const firstSeen = visitorLogs.length > 0
          ? visitorLogs[visitorLogs.length - 1].timestamp
          : new Date();

        const daysSinceFirst = Math.floor(
          (Date.now() - new Date(firstSeen).getTime()) / (1000 * 60 * 60 * 24)
        );

        const previousQuestions = await db.collection('portal_comments')
          .countDocuments({
            spaceId,
            email: buyerEmail,
          });

        // ── Build context-aware notification narrative ─────────────
        const contextNote = previousQuestions === 0
          ? `This is their first question after ${sessionCount} session${sessionCount !== 1 ? 's' : ''} over ${daysSinceFirst} day${daysSinceFirst !== 1 ? 's' : ''} in this space.`
          : `They have asked ${previousQuestions + 1} question${previousQuestions + 1 !== 1 ? 's' : ''} total in this space.`;

        const documentNote = documentName
          ? ` They were reviewing "${documentName}" when they asked.`
          : '';

        const linkNote = linkLabel
          ? ` (via link "${linkLabel}")`
          : '';

        const notificationNarrative =
          `${buyerEmail} asked a question in "${spaceName}"${linkNote}: "${commentText.slice(0, 120)}${commentText.length > 120 ? '...' : ''}"${documentNote} ${contextNote} Replying quickly while they are still in the space tends to move the conversation forward significantly.`;

        // ── Get owner profile for email ───────────────────────────
        const ownerProfile = await db.collection('profiles').findOne({
          user_id: ownerId,
        });

        // ── Email ─────────────────────────────────────────────────
        if (ownerProfile?.email) {
          const { sendDealInsightEmail } =
            await import('@/lib/documentNotifications');
          sendDealInsightEmail({
            ownerEmail: ownerProfile.email,
            ownerName:
              ownerProfile.full_name || ownerProfile.first_name || null,
            viewerEmail: buyerEmail,
            documentName: spaceName,
            documentId: spaceId,
            slowestPage: 1,
            slowestPageTime: 0,
            avgPageTime: 0,
            skippedPages: [],
            totalPages: 1,
            trigger: 'session_end',
            narrative: notificationNarrative,
          }).catch(err =>
            console.error('[SpaceComment] Email silent fail:', err)
          );
        }

        // ── Slack ─────────────────────────────────────────────────
        const { isSlackConnected, notifyDealInsight } =
          await import('@/lib/integrations/slack');
        isSlackConnected(ownerId)
          .then(connected => {
            if (!connected) return;
            return notifyDealInsight({
              userId: ownerId,
              documentName: spaceName,
              documentId: spaceId,
              viewerEmail: buyerEmail,
              slowestPage: 1,
              slowestPageTime: 0,
              avgPageTime: 0,
              skippedPages: [],
              totalPages: 1,
              trigger: 'session_end',
              narrative: notificationNarrative,
            });
          })
          .catch(err =>
            console.error('[SpaceComment] Slack silent fail:', err)
          );

        // ── Teams ─────────────────────────────────────────────────
       
        // ── HubSpot ───────────────────────────────────────────────
        const { syncDealInsightToHubSpot, isHubSpotConnected } =
          await import('@/lib/integrations/hubspotSync');
        isHubSpotConnected(ownerId)
          .then(connected => {
            if (!connected) return;
            return syncDealInsightToHubSpot({
              userId: ownerId,
              viewerEmail: buyerEmail,
              documentName: spaceName,
              documentId: spaceId,
              slowestPage: 1,
              slowestPageTime: 0,
              avgPageTime: 0,
              skippedPages: [],
              totalPages: 1,
              trigger: 'session_end',
              narrative: notificationNarrative,
            });
          })
          .catch(err =>
            console.error('[SpaceComment] HubSpot silent fail:', err)
          );

        // ── Space members (not just owner) ────────────────────────
        // Everyone invited to this space gets notified so the right
        // person can reply quickly — SE, AE, whoever is relevant.
        if (space.members && space.members.length > 0) {
          const memberUserIds = space.members
            .map((m: any) => m.userId || m)
            .filter((id: string) => id !== ownerId);

          if (memberUserIds.length > 0) {
            const members = await db.collection('profiles')
              .find({ user_id: { $in: memberUserIds } })
              .toArray();

            for (const member of members) {
              if (!member.email) continue;
              const { sendDealInsightEmail } =
                await import('@/lib/documentNotifications');
              sendDealInsightEmail({
                ownerEmail: member.email,
                ownerName:
                  member.full_name || member.first_name || null,
                viewerEmail: buyerEmail,
                documentName: spaceName,
                documentId: spaceId,
                slowestPage: 1,
                slowestPageTime: 0,
                avgPageTime: 0,
                skippedPages: [],
                totalPages: 1,
                trigger: 'session_end',
                narrative: notificationNarrative,
              }).catch(err =>
                console.error('[SpaceComment] Member email silent fail:', err)
              );
            }
          }
        }

      } catch (err) {
        console.error('[SpaceComment] outer silent fail:', err);
      }
    })();

    return NextResponse.json({
      success: true,
      comment: {
        id:           result.insertedId.toString(),
        documentId:   newComment.documentId,
        documentName: newComment.documentName,
        author:       normalizedEmail,
        message:      newComment.message,
        reply:        null,
        repliedAt:    null,
        createdAt:    newComment.createdAt,
      }
    });

  } catch (error) {
    console.error('❌ POST comment error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}