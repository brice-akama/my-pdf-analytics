//app/lib/followupCadence.ts

import { dbPromise } from '@/app/api/lib/mongodb';
import { sendEmail } from './email';
import { sendSlackNotification } from './integrations/slack';
import { isSlackConnected } from './integrations/slack';
import { isHubSpotConnected, syncDealInsightToHubSpot } from './integrations/hubspotSync';
import { sendTeamsNotification } from '@/app/api/integrations/teams/notify/route';

// ── Follow up message templates ───────────────────────────────
// DocMetrics philosophy: every message here is DocMetrics reporting
// TO the rep — never a script the rep sends to the buyer, never a
// verdict on what the rep should do. Each message states what was
// observed, what that pattern typically suggests, what is worth
// considering, and an honest confidence level. The rep always decides.

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

  switch (step) {

    case 1:
      // Day 2 — early silence signal
      return {
        subject: `Engagement signal on "${documentName}" — 48 hours with no reply detected`,
        body: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.7;">

            <!-- Alert banner -->
            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; font-weight: 700; color: #c2410c;">Signal detected (medium confidence): No reply after 48 hours</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #9a3412;">
                <strong>${viewerEmail}</strong> received <strong>${documentName}</strong> 2 days ago. No reply, re-read, or internal forward has been recorded since.
              </p>
            </div>

            <!-- What was observed -->
            <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">What was observed</p>
            <p style="margin: 0 0 16px; font-size: 13px; color: #475569;">
              ${viewerEmail} received ${documentName} 2 days ago. No reply, re-read, or internal forward has been recorded since.
            </p>

            <!-- What this typically suggests -->
            <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">What this typically suggests</p>
            <p style="margin: 0 0 16px; font-size: 13px; color: #475569;">
              At 48 hours, silence usually means one of two things: they opened it and got pulled away,
              or they are reviewing it internally before responding. Document data alone cannot tell you which.
            </p>

            <!-- What is worth considering -->
            <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">What is worth considering</p>
            <p style="margin: 0 0 16px; font-size: 13px; color: #475569;">
              A follow-up that references something specific in the document tends to prompt a reply more
              reliably than a general check-in. Whether and how you frame that is your call based on the relationship.
            </p>

            <!-- Confidence -->
            <p style="margin: 0 0 24px; font-size: 12px; color: #94a3b8;">
              Confidence: medium. Single signal (time since send), with no corroborating activity yet.
            </p>

            <!-- CTA -->
            <a href="https://docmetrics.io/dashboard"
               style="display: inline-block; background: #0f172a; color: #fff; padding: 11px 24px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
              View document analytics →
            </a>

            <hr style="margin: 28px 0; border: none; border-top: 1px solid #f1f5f9;" />
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              DocMetrics detected this because ${viewerEmail} has not opened
              ${documentName} in 48 hours.
              <a href="https://docmetrics.io/dashboard" style="color: #94a3b8;">Manage alerts</a>
            </p>
          </div>
        `,
        slackMessage: `Signal detected (medium confidence): No reply on "${documentName}" from ${viewerEmail} after 48 hours. No re-reads or internal forwards detected in this window. Single signal — document data cannot confirm reason for silence.`,
      };

    case 2:
      // Day 5 — continued silence signal
      return {
        subject: `Engagement update on ${documentName}`,
        body: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.7;">
            <p style="margin: 0 0 16px; font-size: 13px; color: #64748b;">
              <strong>DocMetrics follow up timing alert</strong>
            </p>
            <p style="margin: 0 0 16px;">
              It has been 5 days since <strong>${documentName}</strong> was shared with ${viewerEmail}.
            </p>

            <p style="margin: 0 0 16px;">
              What was observed: no reply, re-read, or internal forward recorded in this window.
            </p>
            <p style="margin: 0 0 16px;">
              What this typically suggests: at this stage, silence alone does not distinguish between a buyer
              still deciding internally and one who has moved on — both look identical from document data.
            </p>
            <p style="margin: 0 0 16px; font-size: 12px; color: #94a3b8;">
              Confidence: medium. Timing and frequency of any prior follow-up are best judged on your side.
            </p>

            <p style="margin: 0; color: #64748b; font-size: 13px;">— DocMetrics</p>
          </div>
        `,
        slackMessage: `Signal check (medium confidence): 5 days since "${documentName}" was shared with ${viewerEmail}, with no reply, re-read, or forward detected. Cannot distinguish internal deliberation from disengagement from document data alone.`,
      };

    case 3:
      // Day 7 — extended silence signal
      return {
        subject: `Engagement update on ${documentName}`,
        body: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.7;">
            <p style="margin: 0 0 16px;">
              What was observed: it has been 7 days since <strong>${documentName}</strong> was shared with
              ${viewerEmail}, with no reply, re-read, or internal forward recorded.
            </p>
            <p style="margin: 0 0 16px;">
              What this typically suggests: a full week of silence with zero document activity leans more
              toward disengagement than active internal deliberation — though external factors (budget cycles,
              competing priorities) that DocMetrics cannot see often explain this too.
            </p>
            <p style="margin: 0 0 16px;">
              What is worth considering: a direct question about whether timing still works tends to surface
              real information faster than another value-add message at this stage.
            </p>
            <p style="margin: 0 0 24px; font-size: 12px; color: #94a3b8;">
              Confidence: medium. Based on document engagement only — not full deal context.
            </p>
            <p style="margin: 0; color: #64748b; font-size: 13px;">— DocMetrics</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              This follow up was suggested by DocMetrics based on your document engagement data.
            </p>
          </div>
        `,
        slackMessage: `Signal detected (medium confidence): 7 days since "${documentName}" was shared with ${viewerEmail}, with no reply, re-read, or forward recorded. Leans toward disengagement but external factors DocMetrics cannot see may explain this.`,
      };

    case 4:
      // Day 14 — prolonged silence signal
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
              What was observed: no re-reads or internal forwards have been detected across the full 14-day window.
            </p>
            <p style="margin: 0 0 16px;">
              What this typically suggests: two weeks of zero document activity is more consistent with a paused
              or ended evaluation than active deliberation — though internal changes on their side (budget cycles,
              reorgs, shifted priorities) regularly produce silence that looks like disengagement from document data alone.
            </p>
            <p style="margin: 0 0 16px;">
              What is worth considering: a short final message, or archiving with a future reminder, are both
              reasonable next steps — which one fits depends on your read of the relationship.
            </p>
            <p style="margin: 0 0 24px; font-size: 12px; color: #94a3b8;">
              Confidence: low. Document silence alone cannot explain why engagement stopped — only that it has.
            </p>

            <p style="margin: 0; color: #64748b; font-size: 13px;">— DocMetrics</p>
          </div>
        `,
        slackMessage: `Signal detected (low confidence): 14 days of silence on "${documentName}" from ${viewerEmail}, no re-reads or forwards detected across the window. Cannot confirm whether the deal is paused, ended, or affected by factors outside document activity.`,
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

        // Get owner profile for email (needed by committee check and main send)
        const ownerProfile = await db.collection('profiles').findOne({
          user_id: cadence.userId,
        });

        // ── Buying committee check — only on step 1 ───────────
        if (step === 1) {
          const committeeSessions = await db.collection('analytics_sessions').find({
            documentId: cadence.documentId,
          }).sort({ startedAt: -1 }).limit(20).toArray();

          const committeeEmails = [...new Set(
            committeeSessions
              .filter((s: any) => s.email)
              .map((s: any) => s.email as string)
          )];

          const prospectDomain = cadence.viewerEmail?.split('@')[1];
          const FREE_EMAIL_DOMAINS_CADENCE = new Set([
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'icloud.com', 'me.com', 'aol.com', 'protonmail.com',
            'mail.com', 'live.com', 'msn.com', 'googlemail.com',
          ]);

          const isProspectDomainFree = prospectDomain
            ? FREE_EMAIL_DOMAINS_CADENCE.has(prospectDomain.toLowerCase())
            : true;

          const committeeViewers = !isProspectDomainFree
            ? committeeEmails.filter((e: string) =>
                e.split('@')[1] === prospectDomain && e !== cadence.viewerEmail
              )
            : [];
          const committeeGrowing = committeeViewers.length > 0;

          if (committeeGrowing && ownerProfile?.email) {
            const committeeSubject = `New viewer detected on "${cadence.documentName}"`;
            const committeeSlack = `Signal detected (high confidence): A new viewer from ${prospectDomain} opened "${cadence.documentName}". This may indicate internal sharing is underway. Whether to act on this and how depends on your relationship context and read of the account.`;

            sendEmail({
              to: ownerProfile.email,
              subject: committeeSubject,
              html: `
                <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.7;">
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #15803d;">Signal detected (high confidence): New viewer from same organisation</p>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #166534;">
                      Someone new from <strong>${prospectDomain}</strong> has opened <strong>${cadence.documentName}</strong>.
                      This may indicate internal sharing is underway. Your deal context will determine the best next step.
                    </p>
                  </div>

                  <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">What this typically suggests</p>
                  <p style="margin: 0 0 8px; font-size: 13px; color: #475569;">
                    A new viewer from the same domain often means the document is being shared internally for review —
                    though it can also mean a colleague was simply cc'd in passing.
                  </p>
                  <p style="margin: 0 0 20px; font-size: 13px; color: #475569;">
                    <strong>What is worth considering:</strong> checking in on whether other stakeholders should be
                    looped into the conversation directly is a reasonable next step, but timing and framing are best
                    judged by your read of the account.
                  </p>

                  <a href="https://docmetrics.io/dashboard"
                     style="display: inline-block; background: #0f172a; color: #fff; padding: 11px 24px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
                    View document analytics →
                  </a>
                </div>
              `,
              from: 'DocMetrics <noreply@docmetrics.io>',
            }).catch(err => console.error('[FollowUpCadence] Committee email fail:', err));

            sendSlackNotification({
              userId: cadence.userId,
              message: committeeSlack,
            }).catch(() => {});

            // Mark step fired and advance — skip the normal ghosting message
            await db.collection('follow_up_cadences').updateOne(
              { _id: cadence._id },
              {
                $set: {
                  currentStep: step + 1,
                  nextFireAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
                  lastFiredAt: now,
                },
                $push: {
                  stepsFired: { step, firedAt: now, viewerEmail: cadence.viewerEmail },
                } as any,
              }
            );
            continue;
          }
        }

        // ── Unexpected signal detection ───────────────────────────
        // An unexpected signal is a viewer who appeared with NO prior
        // sessions on this document — not just a new stakeholder from
        // the same domain but a completely unknown email opening it.
        // This fires for experienced reps who would otherwise ignore
        // standard signals but find genuinely new information valuable.
        if (step === 1) {
          const allPriorEmails = await db.collection('analytics_sessions')
            .distinct('email', { documentId: cadence.documentId });

          const prospectDomain2 = cadence.viewerEmail?.split('@')[1];
          const trulyNewViewers = allPriorEmails.filter((e: string) =>
            e && e !== cadence.viewerEmail && e.split('@')[1] !== prospectDomain2
          );

          // Check if any new viewer opened in last 12 hours
          const recentUnexpected = await db.collection('analytics_sessions').findOne({
            documentId: cadence.documentId,
            email: { $in: trulyNewViewers },
            startedAt: { $gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
          });

          if (recentUnexpected && ownerProfile?.email) {
            sendEmail({
              to: ownerProfile.email,
              subject: `Unexpected viewer on "${cadence.documentName}"`,
              html: `
                <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.7;">
                  <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #7e22ce;">Unexpected signal detected</p>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #6b21a8;">
                      <strong>${recentUnexpected.email}</strong> just opened <strong>${cadence.documentName}</strong>.
                      This is someone you have not interacted with on this document before.
                    </p>
                  </div>
                  <p style="font-size: 13px; color: #475569;">
                    This may mean your proposal reached someone outside your expected buying circle.
                    Worth noting before your next interaction with this account.
                  </p>
                  <a href="https://docmetrics.io/documents/${cadence.documentId}"
                     style="display: inline-block; background: #0f172a; color: #fff; padding: 11px 24px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 8px;">
                    View document analytics →
                  </a>
                </div>
              `,
              from: 'DocMetrics <noreply@docmetrics.io>',
            }).catch(() => {});
          }
        }

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