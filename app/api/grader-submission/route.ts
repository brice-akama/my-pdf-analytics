
//api/grader-submission/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { dbPromise } from '@/app/api/lib/mongodb';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'DocMetrics <noreply@docmetrics.io>';
const MY_INBOX = 'hello@docmetrics.io';

const questionLabels = [
  'How many pages is your proposal?',
  'Where does pricing appear?',
  'How do you follow up?',
  'How do you know if they read it?',
  'What happens most after sending?',
];

const optionLabels = [
  ['Under 5 pages', '5 to 10 pages', '10 to 20 pages', 'Over 20 pages'],
  ['First two pages', 'Middle section', 'Last two pages', "Don't include pricing"],
  ['I wait for them', 'Follow up after 3 days', 'Follow up based on opens', 'No follow-up system'],
  ['Notification when opened', 'I ask them directly', 'No way to know', 'Track page-by-page'],
  ['Hear back within a week', 'Reply after following up', 'Go silent wondering', 'Close within two weeks'],
];

const insightText = [
  [
    'Your proposal length is working in your favour. Short proposals get read fully.',
    'Proposals over 10 pages are rarely read in full. Trim ruthlessly.',
  ],
  [
    'Pricing in the middle lands after value is built. Smart positioning.',
    'No pricing in the proposal means prospects cannot say yes. Give them a number.',
  ],
  [
    'Behaviour-triggered follow-up is the gold standard. You are doing it right.',
    'Most deals die in the silence after sending. You need a follow-up system.',
  ],
  [
    'You have document visibility. Use it — page-level data tells you where hesitation lives.',
    'Flying blind is your biggest problem. You need to know if they even opened it.',
  ],
  [
    'Fast closes signal good proposal-prospect fit. Keep doing what you are doing.',
    'Silence after sending means the proposal did not create urgency. This is fixable.',
  ],
];

function getScoreLabel(score: number) {
  if (score >= 80) return 'Strong proposal process';
  if (score >= 55) return 'Room to improve';
  if (score >= 30) return 'Significant gaps present';
  return 'Proposal process needs a rebuild';
}

function getScoreColor(score: number) {
  if (score >= 80) return '#22c55e';
  if (score >= 55) return '#f59e0b';
  if (score >= 30) return '#f97316';
  return '#ef4444';
}

export async function POST(req: Request) {
  try {
    const { email, answers, score } = await req.json();

    if (!email || !answers || score === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // ── 1. Save to MongoDB ───────────────────────────────────────
    const db = await dbPromise;
    await db.collection('grader_submissions').insertOne({
      email,
      answers,
      score,
      createdAt: new Date(),
    });

    // ── Build observation rows for emails ────────────────────────
    const observations = answers.map((a: number, qi: number) => {
      const questionScore = [
        [20, 20, 10, 0],
        [15, 20, 15, 0],
        [0, 10, 20, 0],
        [20, 5, 0, 20],
        [20, 10, 0, 20],
      ][qi][a];
      const good = questionScore >= 15;
      return {
        question: questionLabels[qi],
        answer: optionLabels[qi][a],
        insight: insightText[qi][good ? 0 : 1],
        good,
      };
    });

    const scoreLabel = getScoreLabel(score);
    const scoreColor = getScoreColor(score);

    // ── 2. Email YOU with their full data ────────────────────────
    await resend.emails.send({
      from: FROM,
      to: MY_INBOX,
      subject: `New grader submission — ${score}/100 — ${email}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin-bottom:24px">
            <h2 style="margin:0 0 4px;font-size:18px;color:#111">New Proposal Grader Submission</h2>
            <p style="margin:0;color:#6b7280;font-size:14px">${new Date().toUTCString()}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr>
              <td style="padding:12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px 0 0 8px">
                <p style="margin:0;font-size:12px;color:#6b7280">Email</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:500;color:#111">${email}</p>
              </td>
              <td style="padding:12px;background:#fff;border:1px solid #e5e7eb;border-left:none;border-radius:0 8px 8px 0">
                <p style="margin:0;font-size:12px;color:#6b7280">Score</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:500;color:${scoreColor}">${score}/100 — ${scoreLabel}</p>
              </td>
            </tr>
          </table>

          <h3 style="font-size:14px;color:#6b7280;margin:0 0 12px;text-transform:uppercase;letter-spacing:.04em">Their Answers</h3>
          ${observations.map((o: any, i: number) => `
            <div style="margin-bottom:12px;padding:14px 16px;border-radius:10px;border:1px solid #e5e7eb;background:#fff">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af">Q${i + 1} — ${o.question}</p>
              <p style="margin:0 0 8px;font-size:14px;font-weight:500;color:#111">${o.answer}</p>
              <p style="margin:0;font-size:13px;color:${o.good ? '#16a34a' : '#dc2626'}">${o.insight}</p>
            </div>
          `).join('')}

          <div style="margin-top:24px;padding:16px;background:#EEEDFE;border-radius:10px;text-align:center">
            <p style="margin:0;font-size:13px;color:#534AB7">
              This lead scored <strong>${score}/100</strong>. 
              ${score < 55 ? 'High intent — follow up within 24 hours.' : 'Good process — position DocMetrics as the upgrade.'}
            </p>
          </div>
        </div>
      `,
    });

    // ── 3. Email THEM with their personalised results ────────────
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Your proposal score: ${score}/100 — ${scoreLabel}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="text-align:center;margin-bottom:32px">
            <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;letter-spacing:.04em;text-transform:uppercase">Your Proposal Effectiveness Score</p>
            <div style="display:inline-block;padding:16px 32px;border-radius:16px;background:#f8f9fa;border:1px solid #e5e7eb">
              <span style="font-size:48px;font-weight:600;color:${scoreColor}">${score}</span>
              <span style="font-size:20px;color:#9ca3af">/100</span>
            </div>
            <p style="margin:12px 0 0;font-size:16px;font-weight:500;color:#111">${scoreLabel}</p>
          </div>

          <h3 style="font-size:14px;color:#6b7280;margin:0 0 12px;text-transform:uppercase;letter-spacing:.04em">What your answers reveal</h3>

          ${observations.map((o: any) => `
            <div style="margin-bottom:10px;padding:14px 16px;border-radius:10px;border:1px solid #e5e7eb;background:#fff">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${o.good ? '#22c55e' : '#ef4444'};flex-shrink:0;margin-top:5px;vertical-align:top;margin-right:10px"></span>
              <span style="font-size:13px;color:#4b5563;line-height:1.6">${o.insight}</span>
            </div>
          `).join('')}

          <div style="margin-top:32px;padding:24px;background:#EEEDFE;border-radius:12px;text-align:center">
            <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#3C3489">Stop guessing. Start knowing.</h2>
            <p style="margin:0 0 20px;font-size:14px;color:#534AB7;line-height:1.6">
              DocMetrics tracks every re-read, every hesitation, and tells you what the silence means — so you follow up with context, not hope.
            </p>
            <a href="https://docmetrics.io"
               style="display:inline-block;padding:12px 28px;background:#534AB7;color:#fff;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none">
              Free to start at docmetrics.io →
            </a>
          </div>

          <p style="margin-top:24px;text-align:center;font-size:12px;color:#9ca3af">
            You received this because you used the DocMetrics proposal grader.<br/>
            <a href="https://docmetrics.io" style="color:#9ca3af">docmetrics.io</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Grader submission error:', error);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}