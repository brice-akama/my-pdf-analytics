'use client';

import { useState } from 'react';

// ── Questions ──────────────────────────────────────────────────────
const questions = [
  {
    text: 'How long has it been since you heard back after sending the proposal?',
    options: [
      { label: 'Less than 3 days' },
      { label: '3 to 7 days' },
      { label: '7 to 14 days' },
      { label: 'More than 14 days' },
    ],
  },
  {
    text: 'Do you know if the prospect actually opened the proposal?',
    options: [
      { label: 'Yes — they opened it multiple times and returned to it' },
      { label: 'Yes — they opened it once briefly' },
      { label: 'I got one open notification but nothing since' },
      { label: 'I have no idea whether they opened it at all' },
    ],
  },
  {
    text: 'Did anyone else from the same company open or engage with it?',
    options: [
      { label: 'Yes — at least one other person from their company opened it' },
      { label: 'Not that I know of — only the original contact' },
      { label: 'I cannot tell — I have no visibility into forwarding' },
    ],
  },
  {
    text: 'Before they went quiet, what was the last engagement you observed?',
    options: [
      { label: 'They were reading deeply and returning to specific sections' },
      { label: 'They opened it once and never came back' },
      { label: 'They asked a question or replied, then went quiet' },
      { label: 'I do not know what they last looked at' },
    ],
  },
  {
    text: 'What does your gut tell you about this deal right now?',
    options: [
      { label: 'Still alive — they are just slow or busy internally' },
      { label: 'Uncertain — I genuinely cannot read this one' },
      { label: 'Cooling — something changed but I do not know what' },
      { label: 'Probably lost — I just have not accepted it yet' },
    ],
  },
];

// ── Result bucket logic ────────────────────────────────────────────
// Four buckets based on answer combinations:
// paralysed | disengaged | friction | unknown
type Bucket = 'paralysed' | 'disengaged' | 'friction' | 'unknown';

function getBucket(answers: (number | null)[]): Bucket {
  const [silence, opened, secondViewer, lastEngagement, gut] = answers as number[];

  // No visibility at all — cannot interpret what you cannot see
  if (opened === 3 || lastEngagement === 3) return 'unknown';

  // Second viewer appeared — internal friction or active evaluation
  if (secondViewer === 0) return 'friction';

  // Continued document engagement during silence — JOLT paralysis signal
  if (
    (opened === 0 || lastEngagement === 0) &&
    (gut === 0 || gut === 1)
  ) return 'paralysed';

  // One brief open, nothing since, gut says cooling or lost
  if (
    (opened === 1 || opened === 2) &&
    (gut === 2 || gut === 3) &&
    lastEngagement === 1
  ) return 'disengaged';

  // They replied then went quiet — friction or internal stall
  if (lastEngagement === 2) return 'friction';

  // Long silence, light engagement, uncertain gut — lean disengaged
  if (silence >= 2 && gut >= 2) return 'disengaged';

  // Default to paralysed if engagement was real — benefit of the doubt
  if (opened === 0 || lastEngagement === 0) return 'paralysed';

  return 'disengaged';
}

// ── Result content ─────────────────────────────────────────────────
const results: Record<Bucket, {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
  observed: string;
  typically: string;
  consider: string;
  confidence: string;
}> = {
  paralysed: {
    label: 'Buyer working through a decision',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ede9fe',
    dot: '#7c3aed',
    observed:
      'The pattern here is silence in communication alongside continued or meaningful engagement with the document itself. They opened it more than once, returned to sections, or showed real reading depth before going quiet. Communication stopped — but the evaluation did not.',
    typically:
      'This combination is more consistent with a buyer who is working through a decision internally than one who has moved on. Research into why deals stall after genuine interest points to fear of making the wrong choice as the primary driver — not loss of interest. Buyers in this state often keep returning privately to the parts of the proposal that represent the biggest risk: pricing, terms, implementation scope. The silence is the weight of deciding, not a signal that they have decided against you.',
    consider:
      'A generic check-in will land flat here. What tends to work better is making the decision feel smaller — addressing the specific hesitation directly, offering a lower-commitment entry point, or simply acknowledging that the decision feels significant and removing pressure from the timeline. Your read on which section they kept returning to is your best clue for what the follow-up should address.',
    confidence: 'Medium confidence — based on document engagement pattern only, not the full deal context.',
  },
  disengaged: {
    label: 'Genuine disengagement',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    dot: '#dc2626',
    observed:
      'The pattern here is silence on both sides — no communication and no meaningful return to the document. One brief open, no re-reads, no second viewer, and a gut read that points toward cooling or lost. The document has not been revisited during the quiet period.',
    typically:
      'Silence without any document activity is a different pattern from silence where the buyer is still privately reading. This one is more consistent with genuine disengagement — a competitor won the internal conversation, a priority shifted above this one, or the champion stopped fighting for it. None of these are permanent, but they all point toward something having changed on their side rather than a buyer who is stuck on a decision.',
    consider:
      'The most useful move here is a direct, low-pressure message that gives the prospect permission to say no cleanly. Something like asking directly whether the timing still makes sense for them tends to surface real information faster than a nudge or another value reminder. Clean information — even a no — is more useful than prolonged uncertainty. If there is no response within a few days, parking this deal with a future reminder is a reasonable way to keep the pipeline honest.',
    confidence: 'Medium confidence — document silence alone cannot explain why, only that engagement has stopped.',
  },
  friction: {
    label: 'Internal friction — champion may be stuck',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    dot: '#d97706',
    observed:
      'The pattern here involves either a second person from the same company opening the document, or the original contact going quiet after what appeared to be genuine engagement. The proposal has moved beyond the original contact in some form — whether through a forward you can see or through internal conversations you cannot.',
    typically:
      'When a second stakeholder appears and communication stalls, or when an engaged contact suddenly goes quiet, it usually means the internal process has moved to a stage the champion cannot fully control. They may have hit internal resistance they are not yet ready to surface to you — a competing priority, a budget conversation, a stakeholder with concerns. The document circulating internally is a positive signal. The silence around it is a sign that something is being worked through on their side without you in the room.',
    consider:
      'A direct question works better here than indirect nudging. Asking whether anything has changed on their end about the timeline — framed around being helpful rather than chasing a decision — tends to surface the actual blocker faster than anything else. Most reps avoid that question because they are afraid of the answer. But knowing what the blocker is, even if it is uncomfortable, lets you do something useful. Not knowing keeps you guessing indefinitely.',
    confidence: 'Medium to high confidence — internal circulation is one of the stronger observable signals in this context.',
  },
  unknown: {
    label: 'Insufficient signal — flying blind',
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
    dot: '#6b7280',
    observed:
      'There is not enough observable signal here to interpret the pattern reliably. You do not have visibility into whether the proposal was opened, how it was read, or whether it has been shared internally. The silence is real — but without data on what happened to the document after you sent it, any read on what it means is a guess.',
    typically:
      'Flying blind after sending a proposal is the most common situation in B2B sales — and it is also the most expensive one. The gap between sending and hearing back is where deals are won and lost, and most of what happens in that window is invisible to the rep. Without knowing whether the proposal was read at all, which sections held attention, or whether it was forwarded internally, every follow-up decision is made on instinct rather than evidence. Sometimes instinct is right. But it cannot be consistently right at scale.',
    consider:
      'Before you follow up on this deal, consider what signal you are following up on. If the answer is nothing — no open data, no read data, no forwarding data — then the follow-up is a guess dressed as a decision. On the next proposal you send, getting visibility into what the buyer actually does with it will change what you do in this window entirely. That is the gap this checker was built around.',
    confidence: 'Low confidence — not enough observable data to read this situation reliably.',
  },
};

// ── Score Ring (reused visual style) ──────────────────────────────
function ConfidencePill({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: `${color}18`,
      color,
      border: `1px solid ${color}33`,
      letterSpacing: '.03em',
    }}>
      {text}
    </span>
  );
}

// ── Quiz Screen ────────────────────────────────────────────────────
interface QuizScreenProps {
  current: number;
  answers: (number | null)[];
  onSelect: (i: number) => void;
  onNext: () => void;
  onBack: () => void;
}

function QuizScreen({ current, answers, onSelect, onNext, onBack }: QuizScreenProps) {
  const letters = ['A', 'B', 'C', 'D'];
  const progressPct = ((current + 1) / questions.length) * 100;
  const q = questions[current];

  return (
    <div style={{
      maxWidth: 580, margin: '0 auto',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Context box — only on Q1 */}
      {current === 0 && (
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          border: '1px solid #ede9fe', background: '#faf9ff',
          marginBottom: '1.75rem',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6', margin: '0 0 10px' }}>
            What this checker does
          </p>
          {[
            'You describe one specific deal that has gone quiet after a proposal.',
            'Five questions about what you observed — no account details needed.',
            'You get a plain-English read on what the silence pattern typically suggests.',
          ].map((point, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginTop: i > 0 ? 8 : 0 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#7c3aed', marginTop: 6, flexShrink: 0,
              }} />
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                {point}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div style={{
        height: 3, background: '#f1f5f9', borderRadius: 2,
        marginBottom: '1.75rem', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: '#7c3aed', borderRadius: 2,
          width: `${progressPct}%`, transition: 'width 0.4s ease',
        }} />
      </div>

      <p style={{
        fontSize: 11, color: '#9ca3af', marginBottom: 6,
        letterSpacing: '.06em', textTransform: 'uppercase',
      }}>
        Question {current + 1} of {questions.length}
      </p>

      <p style={{
        fontSize: 17, fontWeight: 500, color: '#111827',
        marginBottom: '1.5rem', lineHeight: 1.45,
      }}>
        {q.text}
      </p>

      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 8, marginBottom: '2rem',
      }}>
        {q.options.map((o, i) => {
          const selected = answers[current] === i;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 12,
                cursor: 'pointer', textAlign: 'left',
                fontSize: 14, lineHeight: 1.45,
                transition: 'all .15s',
                border: selected ? '1.5px solid #7c3aed' : '1px solid #e5e7eb',
                background: selected ? '#f5f3ff' : '#fff',
                color: selected ? '#4c1d95' : '#374151',
                fontWeight: selected ? 500 : 400,
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
                background: selected ? '#7c3aed' : '#f9fafb',
                color: selected ? '#fff' : '#9ca3af',
                border: selected ? 'none' : '1px solid #e5e7eb',
                transition: 'all .15s',
              }}>
                {letters[i]}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={onBack}
          disabled={current === 0}
          style={{
            padding: '10px 20px', borderRadius: 8, fontSize: 13,
            border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280',
            cursor: current === 0 ? 'not-allowed' : 'pointer',
            opacity: current === 0 ? 0.4 : 1,
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 12, color: '#d1d5db' }}>
          {Array.from({ length: questions.length }, (_, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block', width: 6, height: 6,
                borderRadius: '50%', margin: '0 2px',
                background: i === current
                  ? '#7c3aed'
                  : answers[i] !== null ? '#c4b5fd' : '#e5e7eb',
                transition: 'background .2s',
              }}
            />
          ))}
        </span>
        <button
          onClick={onNext}
          disabled={answers[current] === null}
          style={{
            padding: '10px 22px', borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            background: answers[current] === null ? '#ddd6fe' : '#7c3aed',
            color: '#fff', border: 'none',
            cursor: answers[current] === null ? 'not-allowed' : 'pointer',
            transition: 'background .15s',
          }}
        >
          {current === questions.length - 1 ? 'See what this means →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

// ── Results Screen ─────────────────────────────────────────────────
interface ResultsScreenProps {
  answers: (number | null)[];
  onRestart: () => void;
}

function ResultsScreen({ answers, onRestart }: ResultsScreenProps) {
  const [copied, setCopied] = useState(false);
  const bucket = getBucket(answers);
  const result = results[bucket];

  const handleShare = () => {
    const text = `Just used the Deal Silence Checker — found out what the silence on my proposal actually means. Try it free: https://docmetrics.io/silence-checker`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div style={{
      maxWidth: 580, margin: '0 auto',
      padding: '2rem 1rem 3rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Result header */}
      <div style={{
        padding: '20px 22px', borderRadius: 16,
        border: `1px solid ${result.border}`,
        background: result.bg, marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: result.dot, flexShrink: 0,
          }} />
          <p style={{
            margin: 0, fontSize: 11, fontWeight: 700,
            color: result.color, textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}>
            Pattern detected
          </p>
        </div>
        <p style={{
          margin: 0, fontSize: 20, fontWeight: 600,
          color: '#111827', lineHeight: 1.3,
        }}>
          {result.label}
        </p>
      </div>

      {/* Three sections */}
      {[
        {
          heading: 'What DocMetrics observed',
          body: result.observed,
        },
        {
          heading: 'What this pattern typically suggests',
          body: result.typically,
        },
        {
          heading: 'What is worth considering',
          body: result.consider,
        },
      ].map((section, i) => (
        <div key={i} style={{ marginBottom: '1.25rem' }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: '#9ca3af',
            textTransform: 'uppercase', letterSpacing: '.06em',
            margin: '0 0 6px',
          }}>
            {section.heading}
          </p>
          <p style={{
            fontSize: 14, color: '#374151',
            lineHeight: 1.7, margin: 0,
          }}>
            {section.body}
          </p>
        </div>
      ))}

      {/* Confidence pill */}
      <div style={{ marginBottom: '1.75rem' }}>
        <ConfidencePill text={result.confidence} color={result.color} />
      </div>

      {/* Honest limitation note */}
      <div style={{
        padding: '14px 16px', borderRadius: 12,
        border: '1px solid #f1f5f9', background: '#f9fafb',
        marginBottom: '1.75rem',
      }}>
        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.65 }}>
          This reading is based on document behavior signals only — not the full deal context.
          What you know about the relationship, the conversations you have had, and the account
          dynamics will always matter more than any pattern this checker can surface.
          Use this as one input, not a verdict.
        </p>
      </div>

      {/* DocMetrics CTA */}
      <div style={{
        padding: '24px 22px', borderRadius: 16,
        background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)',
        textAlign: 'center', marginBottom: '1rem',
      }}>
        <p style={{
          fontSize: 16, fontWeight: 600, color: '#fff',
          margin: '0 0 8px',
        }}>
          See these signals automatically on every deal
        </p>
        <p style={{
          fontSize: 13, color: '#c4b5fd',
          margin: '0 0 18px', lineHeight: 1.65,
        }}>
          DocMetrics tracks re-reads, stakeholder activity, and silence patterns
          on every proposal you send — so you always know what is happening
          after you hit send, without having to guess.
        </p>
        
      <a    href="https://docmetrics.io/signup"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block', padding: '11px 26px',
            background: '#fff', color: '#4c1d95',
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', marginBottom: 10,
          }}
        >
          Free to start at docmetrics.io →
        </a>
        <p style={{ margin: 0, fontSize: 11, color: '#a78bfa' }}>
          No credit card required
        </p>
      </div>

      {/* Share + Retake */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={handleShare}
          style={{
            padding: '9px 18px', borderRadius: 8,
            fontSize: 12, fontWeight: 500,
            border: '1px solid #e5e7eb', background: '#fff',
            color: '#374151', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {copied ? 'Copied!' : 'Share this tool'}
        </button>
        <button
          onClick={onRestart}
          style={{
            padding: '9px 18px', borderRadius: 8,
            fontSize: 12, fontWeight: 500,
            border: '1px solid #e5e7eb', background: '#fff',
            color: '#6b7280', cursor: 'pointer',
          }}
        >
          ← Check another deal
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function SilenceChecker() {
  const [screen, setScreen] = useState<'quiz' | 'results'>('quiz');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );

  const handleSelect = (i: number) => {
    const next = [...answers];
    next[current] = i;
    setAnswers(next);
  };

  const handleNext = () => {
    if (current === questions.length - 1) {
      setScreen('results');
      return;
    }
    setCurrent(c => c + 1);
  };

  const handleBack = () => {
    if (current > 0) setCurrent(c => c - 1);
  };

  const handleRestart = () => {
    setCurrent(0);
    setAnswers(Array(questions.length).fill(null));
    setScreen('quiz');
  };

  if (screen === 'results') {
    return <ResultsScreen answers={answers} onRestart={handleRestart} />;
  }

  return (
    <QuizScreen
      current={current}
      answers={answers}
      onSelect={handleSelect}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}