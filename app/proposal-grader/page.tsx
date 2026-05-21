import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SalesProposalGrader from "./SalesProposalGrader";

export const metadata: Metadata = {
  title: "Free Sales Proposal Grader — Score Your Proposal Process in 2 Minutes",
  description:
    "Answer 5 questions and get an instant score on your sales proposal process. Find out where deals are slipping through the cracks and what to fix first.",
  alternates: {
    canonical: "https://docmetrics.io/proposal-grader",
  },
  openGraph: {
    title: "Free Sales Proposal Grader — How Strong Is Your Process?",
    description:
      "5 questions. Instant score. Find out why proposals go silent and what to do about it.",
    url: "https://docmetrics.io/proposal-grader",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-grader.png",
        width: 1200,
        height: 630,
        alt: "Sales Proposal Grader by DocMetrics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Sales Proposal Grader — Score Your Process in 2 Minutes",
    description:
      "5 questions. Instant score. Find out why proposals go silent and what to do about it.",
    images: ["/og-grader.png"],
  },
  keywords: [
    "sales proposal grader",
    "proposal process assessment",
    "sales proposal score",
    "how to improve sales proposals",
    "proposal follow up",
    "free sales tool",
    "document engagement tracking",
    "sales process audit",
    "proposal analytics",
    "docmetrics",
  ],
};

// ── JSON-LD schemas ───────────────────────────────────────────────────────────

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  name: "Sales Proposal Grader",
  description:
    "A free tool that scores your sales proposal process across five dimensions — proposal length, pricing position, follow-up method, visibility, and outcomes. Takes under two minutes.",
  url: "https://docmetrics.io/proposal-grader",
  provider: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
  },
  educationalUse: "Self-assessment",
  typicalAgeRange: "18-",
  about: {
    "@type": "Thing",
    name: "Sales proposals and document engagement",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const toolSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sales Proposal Grader",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://docmetrics.io/proposal-grader",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  provider: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long does the proposal grader take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Under two minutes. There are five questions, each with four options. You select an answer and move to the next question. Your score appears immediately after you enter your email.",
      },
    },
    {
      "@type": "Question",
      name: "What does the proposal grader measure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The grader scores your proposal process across five dimensions: proposal length, where pricing appears, how you follow up after sending, whether you have visibility into whether the proposal was read, and what outcomes you typically experience.",
      },
    },
    {
      "@type": "Question",
      name: "Is the proposal grader really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The grader is completely free. You enter your email to receive your full results. There is no credit card, no sign-up, and no obligation.",
      },
    },
    {
      "@type": "Question",
      name: "What happens after I get my score?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You receive your score immediately on screen plus a breakdown of what each answer reveals about your process. We also send the full results to your email. If DocMetrics can help you fix a gap in your process we will mention it once.",
      },
    },
    {
      "@type": "Question",
      name: "What is the most common reason proposals fail to close?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The most common reason proposals fail is not the proposal itself — it is what happens after it is sent. Most salespeople have no visibility into whether a prospect read the proposal, which sections held their attention, or whether the proposal was shared internally. Without that information every follow-up is a guess.",
      },
    },
  ],
};

// ── Static content ────────────────────────────────────────────────────────────

const INSIGHTS = [
  {
    heading: "Most proposals are too long",
    body: "Proposals over 10 pages are rarely read in full. A prospect who stops reading before your pricing or next steps cannot say yes. Every page that does not move the decision forward is a page working against you.",
  },
  {
    heading: "The 72 hours after sending are the most important",
    body: "Whether a prospect engages in the first 72 hours after receiving your proposal is the clearest signal of deal temperature you have. Most salespeople have no way to see what is happening in that window.",
  },
  {
    heading: "There are two types of silence",
    body: "Silence after sending a proposal is almost always one of two things — disengagement or internal friction. They look identical from the outside but need completely opposite responses. You cannot tell which one you are dealing with without data.",
  },
  {
    heading: "Internal sharing is the strongest signal",
    body: "When a prospect forwards your proposal to someone else inside their organisation that is one of the highest-cost actions they can take. It means they are advocating for you internally before you even know it. Most document tools cannot detect this at all.",
  },
];

const FAQS = [
  {
    q: "How long does the proposal grader take?",
    a: "Under two minutes. Five questions, four options each. Your score appears immediately after you enter your email.",
  },
  {
    q: "Is this actually free?",
    a: "Yes. No credit card, no sign-up wall, no obligation. You enter your email to receive the full results. If DocMetrics can help fix something in your process we mention it once.",
  },
  {
    q: "What does the score actually measure?",
    a: "Proposal length, pricing position, follow-up behaviour, visibility into whether the proposal was read, and the outcomes you typically experience. Five dimensions that together tell you whether your process is working or leaking deals.",
  },
  {
    q: "What is the most common reason proposals fail?",
    a: "Not the proposal itself. What happens after it is sent. Most salespeople have no visibility into whether a prospect read the document, which sections they reviewed, or whether it was forwarded internally. Without that information every follow-up is a guess.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div style={{ background: "#fafafa", minHeight: "100vh" }}>

        {/* ── HERO ── */}
        <div style={{
          maxWidth: 640, margin: "0 auto", padding: "4rem 1.25rem 2rem",
          textAlign: "center", fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <span style={{
            display: "inline-block", padding: "5px 14px", borderRadius: 20,
            background: "#f5f3ff", color: "#6d28d9",
            fontSize: 12, fontWeight: 600, letterSpacing: ".04em",
            textTransform: "uppercase", marginBottom: "1.25rem",
          }}>
            Free Tool
          </span>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, color: "#111827", lineHeight: 1.25, marginBottom: "1rem" }}>
            Sales Proposal Grader
          </h1>
          <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.65, maxWidth: 520, margin: "0 auto 2.5rem" }}>
            Five questions. Two minutes. Find out exactly what your proposal process is missing and what it is costing you.
          </p>
        </div>

        {/* ── GRADER COMPONENT ── */}
        <div style={{
          maxWidth: 640, margin: "0 auto",
          border: "1px solid #e5e7eb", borderRadius: 20,
          background: "#fff", overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.04)",
          marginBottom: "5rem",
        }}>
          <Suspense fallback={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          }>
            <SalesProposalGrader />
          </Suspense>
        </div>

        {/* ── INSIGHTS ── */}
        <div style={{
          maxWidth: 720, margin: "0 auto", padding: "0 1.25rem 5rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: "0.5rem", textAlign: "center" }}>
            What the research says about proposal success
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: "2.5rem", lineHeight: 1.65 }}>
            These patterns come from tracking thousands of proposals and the sales behaviour around them.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {INSIGHTS.map((item, i) => (
              <div key={i} style={{
                padding: "20px 22px", borderRadius: 14,
                border: "1px solid #f1f5f9", background: "#fafafa",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
                  {item.heading}
                </p>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={{
          maxWidth: 640, margin: "0 auto", padding: "0 1.25rem 6rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: "2rem", textAlign: "center" }}>
            Frequently asked questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                padding: "18px 20px", borderRadius: 12,
                border: "1px solid #f1f5f9", background: "#fff",
              }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>
                  {faq.q}
                </p>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER CTA ── */}
        <div style={{
          maxWidth: 560, margin: "0 auto", padding: "0 1.25rem 5rem",
          textAlign: "center", fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.65 }}>
            This tool is built and maintained by{" "}
            <a href="https://docmetrics.io" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 500 }}>
              DocMetrics
            </a>
            {" "}—see what happens to your proposals after you send them.
          </p>
        </div>

      </div>
    </>
  );
}