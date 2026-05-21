'use client';

import { useState } from "react";

// ── Questions ─────────────────────────────────────────────────────────────────
const questions = [
  {
    text: "How many pages is your typical sales proposal?",
    options: [
      { label: "Under 5 pages" },
      { label: "5 to 10 pages" },
      { label: "10 to 20 pages" },
      { label: "Over 20 pages" },
    ],
  },
  {
    text: "Where does your pricing appear in the proposal?",
    options: [
      { label: "First two pages" },
      { label: "Middle section — after value is established" },
      { label: "Last two pages" },
      { label: "I do not include pricing in proposals" },
    ],
  },
  {
    text: "How do you follow up after sending a proposal?",
    options: [
      { label: "I wait for the prospect to reply" },
      { label: "I follow up after 3 days with a check-in" },
      { label: "I follow up when I know they have opened or re-read it" },
      { label: "I have no consistent follow-up system" },
    ],
  },
  {
    text: "How do you know if a prospect actually read your proposal?",
    options: [
      { label: "I get a notification when they open it" },
      { label: "I ask them directly if they had a chance to review it" },
      { label: "I have no way of knowing" },
      { label: "I track page-by-page engagement and re-reads" },
    ],
  },
  {
    text: "What happens most often in the 72 hours after you send a proposal?",
    options: [
      { label: "I hear back with feedback or a next step" },
      { label: "I get a reply only after I follow up first" },
      { label: "Silence — I wait and wonder what is happening" },
      { label: "I close the deal within two weeks" },
    ],
  },
];

// ── Score mapping per question per answer ─────────────────────────────────────
const questionScores: number[][] = [
  [20, 20, 10, 0],   // Q1: length
  [12, 20, 12, 0],   // Q2: pricing position
  [0,  10, 20, 0],   // Q3: follow-up method
  [15,  5,  0, 20],  // Q4: visibility
  [20, 10,  0, 20],  // Q5: outcome
];

// ── Insight text — improved with founder wisdom ───────────────────────────────
// Each question has [good insight, bad insight]
// Based on: 20yr veteran, Founder 1 (structure beats improvisation),
// Founder 2 (effort bearing signals > cheap signals), MonetScope founder
const insightText: string[][] = [
  // Q1 — proposal length
  [
    "Short proposals get read fully. A prospect who reads to the end can say yes. One who stops at page four cannot. Your length is working in your favour.",
    "Proposals over 10 pages are rarely read in full. The sections your prospect never reaches cannot close the deal for you. Every page that does not move the decision forward is a page that moves you further from it. Trim ruthlessly.",
  ],
  // Q2 — pricing position
  [
    "Pricing placed after value is established is the right architecture. When a prospect reaches your number having already understood why it exists, the number lands differently. You are doing this correctly.",
    "Leaving pricing out of the proposal creates a gap that stalls decisions. Prospects who cannot react to a number cannot say yes to one. Give them something concrete to evaluate — even a range is better than nothing.",
  ],
  // Q3 — follow-up method
  [
    "Following up based on actual engagement behaviour rather than a calendar is the highest-leverage thing a salesperson can do. You are not interrupting — you are responding to a signal the prospect generated themselves. That is the difference between timely and intrusive.",
    "Most deals do not close because of a bad proposal. They die in the silence after one. A follow-up system is not optional — it is the mechanism that converts interest into a conversation. Without it you are leaving the outcome entirely to chance.",
  ],
  // Q4 — visibility
  [
    "Page-level engagement data is the signal that separates passive browsers from real intent. When you can see that a prospect re-read your pricing section three times across two sessions you know exactly what the follow-up conversation needs to address. Use that data every time.",
    "Not knowing whether a prospect opened your proposal means every follow-up is a guess. You cannot tell the difference between a prospect who read every word and one who never clicked the link. That uncertainty shapes everything from timing to tone — almost always in the wrong direction.",
  ],
  // Q5 — outcome in 72 hours
  [
    "Fast responses after sending signal good proposal-to-prospect fit. When someone replies quickly it usually means your framing matched their current situation. The 72-hour window after sending is the clearest signal of deal temperature you have. If they are engaging in that window, the deal is alive.",
    "Silence in the first 72 hours is the most misread signal in sales. It looks like disengagement but it is often the opposite — internal review, budget conversations, stakeholder alignment. The problem is you cannot tell which kind of silence it is without data. Flying blind during the most critical window costs more deals than any other single factor.",
  ],
];

// ── Score helpers ─────────────────────────────────────────────────────────────
function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong proposal process";
  if (score >= 55) return "Room to improve";
  if (score >= 30) return "Significant gaps present";
  return "Proposal process needs a rebuild";
}

function getScoreDesc(score: number): string {
  if (score >= 80) return "You have most of the fundamentals in place. The gap between good and great is usually visibility — knowing what happens after you send.";
  if (score >= 55) return "You have some good habits but there are gaps that are likely costing you deals you should be closing. The fixes are specific and not difficult.";
  if (score >= 30) return "Your proposal process has structural issues that compound over time. A few targeted changes will have an immediate impact on close rates.";
  return "You are sending proposals into a void with no visibility, no follow-up system, and no feedback loop. Every one of these is fixable.";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 55) return "#f59e0b";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "#f0fdf4";
  if (score >= 55) return "#fffbeb";
  if (score >= 30) return "#fff7ed";
  return "#fef2f2";
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;
  const color = getScoreColor(score);

  return (
    <div style={{ position: "relative", width: 148, height: 148, margin: "0 auto 1.25rem" }}>
      <svg width="148" height="148" viewBox="0 0 148 148" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="74" cy="74" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle
          cx="74" cy="74" r={radius} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 34, fontWeight: 600, color: "#111827", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>out of 100</span>
      </div>
    </div>
  );
}

// ── Quiz Screen ───────────────────────────────────────────────────────────────
interface QuizScreenProps {
  current: number;
  answers: (number | null)[];
  onSelect: (i: number) => void;
  onNext: () => void;
  onBack: () => void;
}

function QuizScreen({ current, answers, onSelect, onNext, onBack }: QuizScreenProps) {
  const letters = ["A", "B", "C", "D"];
  const progressPct = ((current + 1) / 5) * 100;

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Context box — only on Q1 */}
      {current === 0 && (
        <div style={{
          padding: "18px 20px", borderRadius: 14,
          border: "1px solid #ede9fe", background: "#faf9ff",
          marginBottom: "1.75rem",
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#5b21b6", marginBottom: 10, margin: "0 0 10px" }}>
            What this grader measures
          </p>
          {[
            "Proposal structure — whether your format helps or hurts the decision process.",
            "Follow-up behaviour — whether you act on engagement signals or rely on gut feel.",
            "Visibility — whether you know what happens to your proposal after you send it.",
          ].map((point, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginTop: i > 0 ? 8 : 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", marginTop: 6, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{point}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ height: 3, background: "#f1f5f9", borderRadius: 2, marginBottom: "1.75rem", overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "#7c3aed", borderRadius: 2,
          width: `${progressPct}%`, transition: "width 0.4s ease",
        }} />
      </div>

      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>
        Question {current + 1} of 5
      </p>
      <p style={{ fontSize: 17, fontWeight: 500, color: "#111827", marginBottom: "1.5rem", lineHeight: 1.45 }}>
        {questions[current].text}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "2rem" }}>
        {questions[current].options.map((o, i) => {
          const selected = answers[current] === i;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                fontSize: 14, lineHeight: 1.45, transition: "all .15s",
                border: selected ? "1.5px solid #7c3aed" : "1px solid #e5e7eb",
                background: selected ? "#f5f3ff" : "#fff",
                color: selected ? "#4c1d95" : "#374151",
                fontWeight: selected ? 500 : 400,
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600,
                background: selected ? "#7c3aed" : "#f9fafb",
                color: selected ? "#fff" : "#9ca3af",
                border: selected ? "none" : "1px solid #e5e7eb",
                transition: "all .15s",
              }}>
                {letters[i]}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={onBack}
          disabled={current === 0}
          style={{
            padding: "10px 20px", borderRadius: 8, fontSize: 13,
            border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280",
            cursor: current === 0 ? "not-allowed" : "pointer",
            opacity: current === 0 ? 0.4 : 1,
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 12, color: "#d1d5db" }}>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              style={{
                display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                margin: "0 2px",
                background: i === current ? "#7c3aed" : answers[i] !== null ? "#c4b5fd" : "#e5e7eb",
                transition: "background .2s",
              }}
            />
          ))}
        </span>
        <button
          onClick={onNext}
          disabled={answers[current] === null}
          style={{
            padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: answers[current] === null ? "#ddd6fe" : "#7c3aed",
            color: "#fff", border: "none",
            cursor: answers[current] === null ? "not-allowed" : "pointer",
            transition: "background .15s",
          }}
        >
          {current === 4 ? "See my score →" : "Next →"}
        </button>
      </div>
    </div>
  );
}

// ── Email Gate Screen ─────────────────────────────────────────────────────────
interface EmailGateScreenProps {
  score: number;
  onSubmit: (email: string) => void;
  loading: boolean;
}

function EmailGateScreen({ score, onSubmit, loading }: EmailGateScreenProps) {
  const [email, setEmail] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div style={{
      maxWidth: 460, margin: "0 auto", padding: "3rem 1.25rem",
      fontFamily: "system-ui, -apple-system, sans-serif", textAlign: "center",
    }}>
      {/* Score preview */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "10px 20px", borderRadius: 40,
        border: `1px solid ${color}22`, background: `${color}11`,
        marginBottom: "1.5rem",
      }}>
        <span style={{ fontSize: 22, fontWeight: 700, color }}>{score}</span>
        <span style={{ fontSize: 12, color: "#6b7280" }}>/ 100 · {label}</span>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: ".5rem" }}>
        Your full results are ready
      </h2>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "2rem", lineHeight: 1.65 }}>
        Enter your work email and we will send a breakdown of exactly what each answer reveals about your process — and what to fix first.
      </p>

      <input
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === "Enter" && valid && !loading && onSubmit(email)}
        style={{
          width: "100%", padding: "13px 16px", borderRadius: 10, fontSize: 14,
          border: "1px solid #e5e7eb", outline: "none",
          boxSizing: "border-box", marginBottom: 10,
          fontFamily: "inherit",
        }}
      />
      <button
        onClick={() => valid && !loading && onSubmit(email)}
        disabled={!valid || loading}
        style={{
          width: "100%", padding: "13px 20px", borderRadius: 10,
          fontSize: 14, fontWeight: 600,
          background: !valid || loading ? "#ddd6fe" : "#7c3aed",
          color: "#fff", border: "none",
          cursor: !valid || loading ? "not-allowed" : "pointer",
          transition: "background .15s", fontFamily: "inherit",
        }}
      >
        {loading ? "Sending your results..." : "Send my results →"}
      </button>

      <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 12 }}>
        No spam. Your results arrive immediately. One follow-up only if DocMetrics can help.
      </p>
    </div>
  );
}

// ── Results Screen ────────────────────────────────────────────────────────────
interface ResultsScreenProps {
  answers: (number | null)[];
  score: number;
  onRestart: () => void;
}

function ResultsScreen({ answers, score, onRestart }: ResultsScreenProps) {
  const [copied, setCopied] = useState(false);

  const observations = answers.map((a, qi) => {
    const s = questionScores[qi][a ?? 0];
    const good = s >= 15;
    return {
      question: questions[qi].text,
      answer: questions[qi].options[a ?? 0]?.label ?? "",
      insight: insightText[qi][good ? 0 : 1],
      good,
    };
  });

  const goodCount = observations.filter(o => o.good).length;
  const color = getScoreColor(score);
  const bg = getScoreBg(score);

  const handleShare = () => {
    const text = `I scored ${score}/100 on the Sales Proposal Grader — ${getScoreLabel(score)}. Test your own proposal process: https://docmetrics.io/tools/proposal-grader`;
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
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "2rem 1rem 3rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Score ring */}
      <ScoreRing score={score} />

      <p style={{ textAlign: "center", fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 6 }}>
        {getScoreLabel(score)}
      </p>
      <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginBottom: "2rem", lineHeight: 1.65, maxWidth: 420, margin: "0 auto 2rem" }}>
        {getScoreDesc(score)}
      </p>

      {/* Quick summary pills */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: "1.75rem", flexWrap: "wrap" }}>
        <span style={{
          padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
          background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0",
        }}>
          {goodCount} of 5 strong
        </span>
        <span style={{
          padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
          background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
        }}>
          {5 - goodCount} areas to fix
        </span>
        <span style={{
          padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
          background: bg, color, border: `1px solid ${color}33`,
        }}>
          Score: {score}/100
        </span>
      </div>

      {/* Observations */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.75rem" }}>
        {observations.map((o, i) => (
          <div key={i} style={{
            padding: "16px 18px", borderRadius: 14,
            border: `1px solid ${o.good ? "#d1fae5" : "#fee2e2"}`,
            background: o.good ? "#f0fdf4" : "#fff7f7",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: o.good ? "#22c55e" : "#ef4444",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 1,
              }}>
                <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                  {o.good
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  }
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: o.good ? "#15803d" : "#dc2626", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>
                  {o.good ? "Working for you" : "Needs attention"}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.65 }}>
                  {o.insight}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Key principle from founders */}
      <div style={{
        padding: "16px 18px", borderRadius: 14,
        border: "1px solid #e0e7ff", background: "#eef2ff",
        marginBottom: "1.5rem",
      }}>
        <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: ".06em" }}>
          The principle behind this grader
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#3730a3", lineHeight: 1.65 }}>
          Cheap signals are noise. Effort-bearing signals are signal. A prospect who re-reads your pricing section is telling you something. A prospect who forwards your proposal internally before saying a word is telling you even more. The goal is to stop mistaking activity for intent.
        </p>
      </div>

      {/* CTA */}
      <div style={{
        padding: "24px 22px", borderRadius: 16,
        background: "linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)",
        textAlign: "center", marginBottom: "1rem",
      }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 6, margin: "0 0 6px" }}>
          Stop guessing. Start knowing.
        </p>
        <p style={{ fontSize: 13, color: "#c4b5fd", marginBottom: 18, lineHeight: 1.65, margin: "0 0 18px" }}>
          DocMetrics tracks every re-read, every hesitation, and every internal share — then tells you in plain English what the silence means and exactly what to do next.
        </p>
        <a
          href="https://docmetrics.io/signup"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block", padding: "11px 26px",
            background: "#fff", color: "#4c1d95",
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            textDecoration: "none", marginBottom: 10,
          }}
        >
          Free to start at docmetrics.io →
        </a>
        <p style={{ margin: 0, fontSize: 11, color: "#a78bfa" }}>
          No credit card required
        </p>
      </div>

      {/* Share + Retake */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button
          onClick={handleShare}
          style={{
            padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: "1px solid #e5e7eb", background: "#fff", color: "#374151",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {copied ? "Copied!" : "Share my score"}
        </button>
        <button
          onClick={onRestart}
          style={{
            padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280",
            cursor: "pointer",
          }}
        >
          ← Retake the quiz
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SalesProposalGrader() {
  const [screen, setScreen] = useState<"quiz" | "email" | "results">("quiz");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(5).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalScore = Math.min(
    100,
    answers.reduce<number>((sum, a, qi) => {
      if (a === null) return sum;
      return sum + questionScores[qi][a];
    }, 0)
  );

  const handleSelect = (i: number) => {
    const next = [...answers];
    next[current] = i;
    setAnswers(next);
  };

  const handleNext = () => {
    if (current === 4) { setScreen("email"); return; }
    setCurrent(c => c + 1);
  };

  const handleBack = () => {
    if (current > 0) setCurrent(c => c - 1);
  };

  const handleEmailSubmit = async (email: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/grader-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answers, score: totalScore }),
      });
      if (!res.ok) throw new Error("failed");
      setScreen("results");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setAnswers(Array(5).fill(null));
    setScreen("quiz");
  };

  if (screen === "email") return (
    <div>
      <EmailGateScreen score={totalScore} onSubmit={handleEmailSubmit} loading={submitting} />
      {error && (
        <p style={{ textAlign: "center", fontSize: 13, color: "#ef4444", marginTop: 8, fontFamily: "system-ui" }}>
          {error}
        </p>
      )}
    </div>
  );

  if (screen === "results") return (
    <ResultsScreen answers={answers} score={totalScore} onRestart={handleRestart} />
  );

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