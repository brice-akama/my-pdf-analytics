import { dbPromise } from '@/app/api/lib/mongodb';
import { sendEmail } from './email';
import { sendSlackNotification } from './integrations/slack';
import { isSlackConnected } from './integrations/slack';
import { isHubSpotConnected, syncDealInsightToHubSpot } from './integrations/hubspotSync';
import { sendTeamsNotification } from '@/app/api/integrations/teams/notify/route';

// ── Follow up message templates ───────────────────────────────
// Written in plain human language following the 20 year veteran framework
// Day 2 = value add, Day 7 = direct question, Day 10 = final

function getStepMessage(
  step: number,
  viewerEmail: string,
  documentName: string,
  ownerName: string | null
): {
  subject: string;
  body: string;
  slackMessage: string;
} | null {

  const sender = ownerName || 'your contact';

  switch (step) {

    case 1:
      // Day 2 — value add, not a check in
      return {
        subject: `One thing worth flagging about ${documentName}`,
        body: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.7;">
            <p style="margin: 0 0 16px;">Hi,</p>
            <p style="margin: 0 0 16px;">
              I wanted to flag something specific in <strong>${documentName}</strong> 
              that tends to raise questions — rather than just asking if you had a chance to look at it.
            </p>
            <p style="margin: 0 0 16px;">
              There are a few decisions in there worth talking through before you move forward. 
              Happy to walk you through them on a quick call or answer anything in writing if that works better for you.
            </p>
            <p style="margin: 0 0 24px;">
              Just reply here and let me know what works.
            </p>
            <p style="margin: 0; color: #64748b; font-size: 13px;">— ${sender}</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              This follow up was suggested by DocMetrics based on your document engagement data.
            </p>
          </div>
        `,
        slackMessage: `Follow up reminder — ${viewerEmail} received "${documentName}" 2 days ago and has not replied. Suggested action: send a value add today, not a check in. Reference something specific in the document rather than asking if they read it.`,
      };

    case 2:
      // Day 5 — wait signal, do not follow up yet
      return {
        subject: `Timing check on ${documentName}`,
        body: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.7;">
            <p style="margin: 0 0 16px; font-size: 13px; color: #64748b;">
              <strong>DocMetrics follow up timing alert</strong>
            </p>
            <p style="margin: 0 0 16px;">
              It has been 5 days since you shared <strong>${documentName}</strong> with ${viewerEmail}.
            </p>
            <p style="margin: 0 0 16px;">
              Based on typical deal patterns, this is usually not the moment for another follow up yet. 
              If you sent a value add on day 2, give it two more days before reaching out again.
            </p>
            <p style="margin: 0 0 16px;">
              If you have not followed up at all yet, now is the right moment. 
              Keep it short — one line of context, one specific question about their timeline.
            </p>
            <p style="margin: 0; color: #64748b; font-size: 13px;">— DocMetrics</p>
          </div>
        `,
        slackMessage: `Timing check — it has been 5 days since you shared "${documentName}" with ${viewerEmail}. If you sent a value add on day 2, wait two more days. If you have not followed up yet, do it today with one specific question about their timeline.`,
      };

    case 3:
      // Day 7 — direct question time
      return {
        subject: `Quick question about ${documentName}`,
        body: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.7;">
            <p style="margin: 0 0 16px;">Hi,</p>
            <p style="margin: 0 0 16px;">
              Wanted to check in with one direct question — is moving forward on 
              <strong>${documentName}</strong> still a priority for you right now, 
              or would it make more sense to pick this up at a better time?
            </p>
            <p style="margin: 0 0 24px;">
              Either answer works. Just want to make sure I am not following up 
              when timing is off on your end.
            </p>
            <p style="margin: 0; color: #64748b; font-size: 13px;">— ${sender}</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              This follow up was suggested by DocMetrics based on your document engagement data.
            </p>
          </div>
        `,
        slackMessage: `7 day follow up — it has been a week since ${viewerEmail} received "${documentName}". Time to send one direct question about whether this is still a priority. Suggested message: Is moving forward on this still a priority right now or should we revisit this later. Direct questions get responses. Vague check ins get ignored.`,
      };

    case 4:
      // Day 14 — final message or archive
      return {
        subject: `Closing the loop on ${documentName}`,
        body: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.7;">
            <p style="margin: 0 0 16px; font-size: 13px; color: #64748b;">
              <strong>DocMetrics — 14 day silence alert</strong>
            </p>
            <p style="margin: 0 0 16px;">
              It has been two weeks since ${viewerEmail} received <strong>${documentName}</strong> 
              with no reply.
            </p>
            <p style="margin: 0 0 16px;">
              At this point you have two options. Send one final short message that acknowledges 
              the silence without making them feel guilty — something like: 
              <em>I wanted to check in one last time before I close this out on my end. 
              If timing is off or priorities have shifted, completely understandable — 
              just let me know and I will follow up when it makes more sense.</em>
            </p>
            <p style="margin: 0 0 16px;">
              Or archive this deal and set a reminder for six weeks. 
              Some deals go quiet because of internal changes you cannot see from here. 
              They are not always dead.
            </p>
            <p style="margin: 0; color: #64748b; font-size: 13px;">— DocMetrics</p>
          </div>
        `,
        slackMessage: `14 day silence — ${viewerEmail} has not responded to "${documentName}" in two weeks. Either send a final short message acknowledging the silence without guilt, or archive the deal and set a 6 week reminder. Some deals are not dead, just waiting for an external trigger.`,
      };

    default:
      return null;
  }
}

// ── Main job — runs daily ─────────────────────────────────────
export async function runFollowUpCadenceJob() {
  try {
    const db = await dbPromise;
    const now = new Date();

    // Find all cadences due to fire
    const dueCadences = await db.collection('follow_up_cadences').find({
      completed: { $ne: true },
      nextFireAt: { $lte: now },
      currentStep: { $lte: 4 },
    }).limit(50).toArray();

    for (const cadence of dueCadences) {
      try {
        const step = cadence.currentStep;
        const message = getStepMessage(
          step,
          cadence.viewerEmail,
          cadence.documentName,
          null
        );

        if (!message) {
          // Mark complete if no more steps
          await db.collection('follow_up_cadences').updateOne(
            { _id: cadence._id },
            { $set: { completed: true, completedAt: now } }
          );
          continue;
        }

        // Get owner profile for email
        const ownerProfile = await db.collection('profiles').findOne({
          user_id: cadence.userId,
        });

        // Check engagement to personalise the message
        const recentSessions = await db.collection('analytics_sessions').find({
          documentId: cadence.documentId,
          email: cadence.viewerEmail,
        }).sort({ startedAt: -1 }).limit(5).toArray();

        const hasEngaged = recentSessions.length > 0;
        const sessionCount = recentSessions.length;

        // Add engagement context to step 2 and 3 messages
        let enrichedSlackMessage = message.slackMessage;
        if (hasEngaged) {
          enrichedSlackMessage += ` Note: ${cadence.viewerEmail} has opened the document ${sessionCount} time${sessionCount > 1 ? 's' : ''}.`;
        } else if (step >= 2) {
          enrichedSlackMessage += ` Note: ${cadence.viewerEmail} has not opened the document yet.`;
        }

        // ── Fire email — silent fail ──────────────────────────
        if (ownerProfile?.email) {
          sendEmail({
            to: ownerProfile.email,
            subject: message.subject,
            html: message.body,
            from: 'DocMetrics <noreply@docmetrics.io>',
          }).catch(err =>
            console.error('[FollowUpCadence] Email silent fail:', err)
          );
        }

        // ── Fire Slack — silent fail ──────────────────────────
        isSlackConnected(cadence.userId)
          .then(connected => {
            if (!connected) return;
            return sendSlackNotification({
              userId: cadence.userId,
              message: enrichedSlackMessage,
            });
          })
          .catch(err =>
            console.error('[FollowUpCadence] Slack silent fail:', err)
          );

        // ── Fire HubSpot — silent fail ────────────────────────
        isHubSpotConnected(cadence.userId)
          .then(connected => {
            if (!connected) return;
            return syncDealInsightToHubSpot({
              userId: cadence.userId,
              viewerEmail: cadence.viewerEmail,
              documentName: cadence.documentName,
              documentId: cadence.documentId,
              slowestPage: 1,
              slowestPageTime: 0,
              avgPageTime: 0,
              skippedPages: [],
              totalPages: 1,
              trigger: 'gone_silent',
              narrative: enrichedSlackMessage,
            });
          })
          .catch(err =>
            console.error('[FollowUpCadence] HubSpot silent fail:', err)
          );

        // ── Fire Teams — silent fail ──────────────────────────
        sendTeamsNotification({
          userId: cadence.userId,
          event: 'deal_insight',
          documentName: cadence.documentName,
          documentId: cadence.documentId,
          viewerEmail: cadence.viewerEmail,
          extraInfo: enrichedSlackMessage,
        }).catch(err =>
          console.error('[FollowUpCadence] Teams silent fail:', err)
        );

        // ── Calculate next fire date ──────────────────────────
        const nextStepDelays: Record<number, number> = {
          1: 3, // step 1 fired on day 2, next on day 5
          2: 2, // step 2 fired on day 5, next on day 7
          3: 7, // step 3 fired on day 7, next on day 14
          4: 0, // step 4 is final
        };

        const daysToNext = nextStepDelays[step] || 0;
        const nextFireAt = daysToNext > 0
          ? new Date(now.getTime() + daysToNext * 24 * 60 * 60 * 1000)
          : null;

        await db.collection('follow_up_cadences').updateOne(
          { _id: cadence._id },
          {
            $set: {
              currentStep: step + 1,
              nextFireAt: nextFireAt || now,
              completed: step >= 4,
              completedAt: step >= 4 ? now : undefined,
              lastFiredAt: now,
            },
            $push: {
              stepsFired: {
                step,
                firedAt: now,
                viewerEmail: cadence.viewerEmail,
              },
            } as any,
          }
        );

      } catch (innerErr) {
        console.error('[FollowUpCadence] inner error:', innerErr);
        continue;
      }
    }
  } catch (err) {
    console.error('[FollowUpCadence] outer error:', err);
  }
}