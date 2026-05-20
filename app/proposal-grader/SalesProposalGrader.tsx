'use client';

import { useState } from "react";

const questions = [
  {
    text: "How many pages is your typical sales proposal?",
    options: [
      { label: "Under 5 pages", score: 20 },
      { label: "5 to 10 pages", score: 20 },
      { label: "10 to 20 pages", score: 10 },
      { label: "Over 20 pages", score: 0 },
    ],
  },
  {
    text: "Where does your pricing appear in the proposal?",
    options: [
      { label: "First two pages", score: 15 },
      { label: "Middle section", score: 20 },
      { label: "Last two pages", score: 15 },
      { label: "I don't include pricing", score: 0 },
    ],
  },
  {
    text: "How do you follow up after sending a proposal?",
    options: [
      { label: "I wait for them to reply", score: 0 },
      { label: "I follow up after 3 days with a check-in", score: 10 },
      { label: "I follow up based on whether they opened it", score: 20 },
      { label: "I have no follow-up system", score: 0 },
    ],
  },
  {
    text: "How do you know if a prospect read your proposal?",
    options: [
      { label: "I get a notification when they open it", score: 20 },
      { label: "I ask them directly", score: 5 },
      { label: "I have no way to know", score: 0 },
      { label: "I track page-by-page engagement", score: 20 },
    ],
  },
  {
    text: "What happens most often after you send a proposal?",
    options: [
      { label: "I hear back within a week", score: 20 },
      { label: "I get a reply after following up", score: 10 },
      { label: "I go silent and wonder what happened", score: 0 },
      { label: "I close it within two weeks", score: 20 },
    ],
  },
];

const insightText: string[][] = [
  [
    "Your proposal length is working in your favour. Short proposals get read fully.",
    "Proposals over 10 pages are rarely read in full. Trim ruthlessly — every section must move the decision forward.",
  ],
  [
    "Pricing in the middle lands after value is built. Smart positioning.",
    "No pricing in the proposal means prospects cannot say yes. Give them a number to react to — even a range.",
  ],
  [
    "Behaviour-triggered follow-up is the gold standard. Following up when you know they just opened the document is the difference between interrupting and being timely.",
    "Most deals die in the silence after sending. You need a follow-up system — waiting costs you revenue.",
  ],
  [
    "You have document visibility. Use it — page-level engagement data tells you exactly where hesitation lives.",
    "Flying blind is your biggest problem. When you don't know if the proposal was even opened, every follow-up is a guess.",
  ],
  [
    "Fast closes signal good proposal-prospect fit. When prospects reply quickly it means your proposal spoke directly to their situation.",
    "Silence after sending means the proposal didn't create urgency, or you're not reaching the real decision-maker.",
  ],
];

const questionScores: number[][] = [
  [20, 20, 10, 0],
  [15, 20, 15, 0],
  [0, 10, 20, 0],
  [20, 5, 0, 20],
  [20, 10, 0, 20],
];

function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong proposal process";
  if (score >= 55) return "Room to improve";
  if (score >= 30) return "Significant gaps present";
  return "Proposal process needs a rebuild";
}

function getScoreDesc(score: number): string {
  if (score >= 80) return "You have most of the fundamentals in place. The gap between good and great is usually visibility.";
  if (score >= 55) return "You have some good habits but key gaps are likely costing you deals you should be closing.";
  if (score >= 30) return "Your proposal process is leaving a lot on the table. A few targeted changes will have an immediate impact.";
  return "You're sending proposals into a void with no visibility, no system, and no feedback loop. This is fixable.";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 55) return "#f59e0b";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;
  const color = getScoreColor(score);

  return (
    <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 1.5rem" }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#EEEDFE" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 32, fontWeight: 500, color: "#1e1b4b" }}>{score}</span>
        <span style={{ fontSize: 11, color: "#6b7280" }}>out of 100</span>
      </div>
    </div>
  );
}

// ── SCREEN 1: Quiz ────────────────────────────────────────────────────────────
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
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>
        {/* Show context only on first question */}
    {current === 0 && (
      <div style={{
        padding: 18,
        borderRadius: 12,
        border: "0.5px solid #e5e7eb",
        background: "#ffffff",
        marginBottom: "1.5rem",
      }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: "#111827", marginBottom: ".8rem" }}>
          What this grader measures
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7F77DD", marginTop: 6, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
              Proposal length affects completion rates. Long proposals usually lose attention before pricing or next steps are reached.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7F77DD", marginTop: 6, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
              Follow-up timing changes outcomes. Most proposals fail because the sender follows up too late or without context.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7F77DD", marginTop: 6, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
              Engagement tracking helps you understand when buyers revisit pricing, hesitate on certain pages, or quietly lose interest.
            </p>
          </div>
        </div>
      </div>
    )}
      <div style={{ height: 3, background: "#e5e7eb", borderRadius: 2, marginBottom: "2rem", overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "#7F77DD", borderRadius: 2,
          width: `${progressPct}%`, transition: "width 0.4s ease",
        }} />
      </div>

      <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: ".5rem", letterSpacing: ".04em" }}>
        Question {current + 1} of 5
      </p>
      <p style={{ fontSize: 18, fontWeight: 500, color: "#111827", marginBottom: "1.5rem", lineHeight: 1.4 }}>
        {questions[current].text}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "2rem" }}>
        {questions[current].options.map((o, i: number) => (
          <button key={i} onClick={() => onSelect(i)} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
            fontSize: 14, transition: "all .15s",
            border: answers[current] === i ? "1.5px solid #7F77DD" : "0.5px solid #e5e7eb",
            background: answers[current] === i ? "#EEEDFE" : "#fff",
            color: answers[current] === i ? "#3C3489" : "#374151",
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 500,
              background: answers[current] === i ? "#7F77DD" : "#f3f4f6",
              color: answers[current] === i ? "#fff" : "#6b7280",
              border: answers[current] === i ? "none" : "0.5px solid #e5e7eb",
            }}>
              {letters[i]}
            </span>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} disabled={current === 0} style={{
          padding: "10px 20px", borderRadius: 8, fontSize: 14,
          border: "0.5px solid #e5e7eb", background: "#fff", color: "#374151",
          cursor: current === 0 ? "not-allowed" : "pointer", opacity: current === 0 ? 0.35 : 1,
        }}>
          Back
        </button>
        <span style={{ fontSize: 13, color: "#9ca3af" }}>{current + 1} / 5</span>
        <button onClick={onNext} disabled={answers[current] === null} style={{
          padding: "10px 20px", borderRadius: 8, fontSize: 14,
          background: answers[current] === null ? "#c4b5fd" : "#7F77DD",
          color: "#fff", border: "none",
          cursor: answers[current] === null ? "not-allowed" : "pointer",
        }}>
          {current === 4 ? "See my score →" : "Next →"}
        </button>
      </div>
    </div>
  );
}

// ── SCREEN 2: Email gate ──────────────────────────────────────────────────────
interface EmailGateScreenProps {
  onSubmit: (email: string) => void;
  loading: boolean;
}

function EmailGateScreen({ onSubmit, loading }: EmailGateScreenProps) {
  const [email, setEmail] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "3rem 1rem", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "#EEEDFE", margin: "0 auto 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="24" height="24" fill="none" stroke="#7F77DD" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 500, color: "#111827", marginBottom: ".5rem" }}>
        Your score is ready
      </h2>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "2rem", lineHeight: 1.6 }}>
        Enter your email and we will send your full results — including what each answer reveals about your process.
      </p>

      <div style={{ marginBottom: 12 }}>
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && valid && !loading && onSubmit(email)}
          style={{
            width: "100%", padding: "12px 16px",
            borderRadius: 10, fontSize: 15,
            border: "0.5px solid #e5e7eb", outline: "none",
            boxSizing: "border-box", marginBottom: 10,
          }}
        />
        <button
          onClick={() => valid && !loading && onSubmit(email)}
          disabled={!valid || loading}
          style={{
            width: "100%", padding: "12px 20px",
            borderRadius: 10, fontSize: 15, fontWeight: 500,
            background: !valid || loading ? "#c4b5fd" : "#7F77DD",
            color: "#fff", border: "none",
            cursor: !valid || loading ? "not-allowed" : "pointer",
            transition: "background .15s",
          }}
        >
          {loading ? "Sending your results..." : "See my score →"}
        </button>
      </div>

      <p style={{ fontSize: 12, color: "#9ca3af" }}>
        No spam. Just your results and one follow-up if DocMetrics can help.
      </p>
    </div>
  );
}

// ── SCREEN 3: Results ─────────────────────────────────────────────────────────
interface ResultsScreenProps {
  answers: (number | null)[];
  score: number;
  onRestart: () => void;
}

function ResultsScreen({ answers, score, onRestart }: ResultsScreenProps) {
  const observations = answers.map((a: number | null, qi: number) => {
    const s = questionScores[qi][a ?? 0];
    const good = s >= 15;
    return { insight: insightText[qi][good ? 0 : 1], good };
  });

  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>
      <ScoreRing score={score} />

      <p style={{ textAlign: "center", fontSize: 17, fontWeight: 500, color: "#111827", marginBottom: ".4rem" }}>
        {getScoreLabel(score)}
      </p>
      <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginBottom: "2rem", lineHeight: 1.6 }}>
        {getScoreDesc(score)}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.5rem" }}>
        {observations.map((o: { insight: string; good: boolean }, i: number) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "14px 16px",
            borderRadius: 12, border: "0.5px solid #e5e7eb", background: "#fff",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 5,
              background: o.good ? "#22c55e" : "#ef4444",
            }} />
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
              {o.insight}
            </p>
          </div>
        ))}
      </div>

      

      <div style={{
        padding: 20, borderRadius: 12,
        background: "#EEEDFE", border: "0.5px solid #AFA9EC",
        textAlign: "center", marginBottom: "1rem",
      }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: "#3C3489", marginBottom: ".4rem" }}>
          Stop guessing. Start knowing.
        </p>
        <p style={{ fontSize: 13, color: "#534AB7", marginBottom: "1rem", lineHeight: 1.5 }}>
          DocMetrics tracks every re-read, every hesitation, and tells you what the silence means — so you follow up with context, not hope.
        </p>
        <a
          href="https://docmetrics.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block", padding: "10px 24px",
            background: "#534AB7", color: "#fff",
            borderRadius: 8, fontSize: 13, fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Free to start at docmetrics.io →
        </a>
      </div>

      <p onClick={onRestart} style={{
        textAlign: "center", fontSize: 12, color: "#9ca3af",
        cursor: "pointer", textDecoration: "underline",
      }}>
        ← Retake the quiz
      </p>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SalesProposalGrader() {
  const [screen, setScreen] = useState<"quiz" | "email" | "results">("quiz");
  const [current, setCurrent] = useState<number>(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(5).fill(null));
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const totalScore = Math.min(
    100,
    answers.reduce((sum: number, a, qi: number) => {
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
    setCurrent(current + 1);
  };

  const handleBack = () => {
    if (current > 0) setCurrent(current - 1);
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
      if (!res.ok) throw new Error("Submission failed");
      setScreen("results");
    } catch (e) {
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
    <>
      <EmailGateScreen onSubmit={handleEmailSubmit} loading={submitting} />
      {error && (
        <p style={{ textAlign: "center", fontSize: 13, color: "#ef4444", marginTop: 8 }}>{error}</p>
      )}
    </>
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