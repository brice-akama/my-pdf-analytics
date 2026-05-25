// app/templates/page.tsx
// ✅ Server Component — fully indexed by Google
// ✅ No client components needed — pure static page

import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";

// ── METADATA ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Free Proposal & Contract Templates for Freelancers — DocMetrics",
  description:
    "Download free proposal and contract templates for web designers, copywriters, digital marketing agencies, and consultants. No email required. Includes tips on tracking when clients open your proposals.",
  alternates: {
    canonical: "https://docmetrics.io/templates",
  },
  openGraph: {
    title: "Free Proposal Templates for Freelancers & Consultants — DocMetrics",
    description:
      "Free downloadable proposal and contract templates. Know when your client opens your proposal with DocMetrics.",
    url: "https://docmetrics.io/templates",
    siteName: "DocMetrics",
    type: "website",
  },
  keywords: [
    "free proposal template",
    "website design proposal template",
    "copywriting contract template",
    "consulting proposal template",
    "digital marketing agency proposal",
    "freelance proposal template free download",
    "client proposal template",
    "freelance contract template",
  ],
};

// ── JSON-LD ───────────────────────────────────────────────────────────────────
const schema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Free Proposal and Contract Templates",
  url: "https://docmetrics.io/templates",
  description:
    "Free downloadable proposal and contract templates for freelancers, consultants, and agencies.",
  hasPart: [
    {
      "@type": "CreativeWork",
      name: "Website Design Proposal Template",
      url: "https://docmetrics.io/templates",
      description: "Free website design proposal template for freelancers.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "CreativeWork",
      name: "Copywriting Retainer Contract Template",
      url: "https://docmetrics.io/templates",
      description: "Free copywriting retainer contract for freelance writers.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "CreativeWork",
      name: "Digital Marketing Agency Proposal Template",
      url: "https://docmetrics.io/templates",
      description: "Free agency proposal template for digital marketing services.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "CreativeWork",
      name: "Consulting Services Proposal Template",
      url: "https://docmetrics.io/templates",
      description: "Free consulting proposal template for independent consultants.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

// ── TEMPLATE DATA ─────────────────────────────────────────────────────────────
const templates = [
  {
    id: "website-design-proposal",
    title: "Website Design Proposal Template",
    description:
      "A clean, professional proposal for freelance web designers. Includes project scope, deliverables, investment options, timeline, and next steps. Built to help clients say yes faster.",
    bestFor: "Freelance web designers and developers",
    pages: "4 pages",
    format: "PDF",
    docmetricsNote:
      "Want to know the moment your client opens this proposal and which sections they spent the most time reading? Upload it to DocMetrics and track every page for free.",
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#ede9fe",
    icon: "🖥️",
    downloadHref: "/templates/editor?template=website-design",
  },
  {
    id: "copywriting-retainer",
    title: "Copywriting Retainer Contract Template",
    description:
      "A complete retainer contract for freelance copywriters and content writers. Covers scope, payment terms, revision policy, confidentiality, and termination. Protects both parties clearly.",
    bestFor: "Freelance copywriters and content creators",
    pages: "3 pages",
    format: "PDF",
    docmetricsNote:
      "Before sending this contract upload it to DocMetrics to see exactly when your client opens it, how long they spend on each clause, and whether they forwarded it to someone else.",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#e0f2fe",
    icon: "✍️",
    downloadHref: "/templates/editor?template=copywriting-retainer",
  },
  {
    id: "digital-marketing-proposal",
    title: "Digital Marketing Agency Proposal Template",
    description:
      "A structured proposal for SEO, social media, paid ads, or full-service marketing engagements. Includes executive summary, problem diagnosis, strategy, investment, and a case study section.",
    bestFor: "Digital marketing agencies and consultants",
    pages: "6 pages",
    format: "PDF",
    docmetricsNote:
      "Agency proposals often get shared internally before a decision is made. DocMetrics tells you when that happens and who read which sections.",
    color: "#0f766e",
    bg: "#f0fdfa",
    border: "#ccfbf1",
    icon: "📈",
    downloadHref: "/templates/editor?template=digital-marketing",
  },
  {
    id: "consulting-proposal",
    title: "Consulting Services Proposal Template",
    description:
      "A high-trust proposal template for independent consultants charging premium rates. Leads with credentials, diagnoses the client problem, presents the recommended engagement, and makes the ROI case clearly.",
    bestFor: "Independent consultants and advisors",
    pages: "5 pages",
    format: "PDF",
    docmetricsNote:
      "Consulting proposals often sit with multiple stakeholders for days. DocMetrics tracks every time your proposal is opened, re-read, or shared internally so you always know where the decision stands.",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fef3c7",
    icon: "💼",
    downloadHref: "/templates/editor?template=consulting",
  },
];

// ── FAQ DATA ──────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "Are these templates really free?",
    a: "Yes. Every template on this page is completely free to download. No email address required. No sign-up wall. Just click download and the PDF is yours.",
  },
  {
    q: "Can I edit these templates?",
    a: "Yes. The templates are designed to be filled in directly or imported into Google Docs or Word for editing. Every section has clear placeholders showing you exactly what to write.",
  },
  {
    q: "Why does my proposal get ignored after sending?",
    a: "Most proposals get ignored not because of the proposal itself but because of what happens after it is sent. You have no visibility into whether the client opened it, which sections they read, or whether they forwarded it to a decision maker. DocMetrics gives you that visibility so you know exactly when and how to follow up.",
  },
  {
    q: "What is DocMetrics?",
    a: "DocMetrics is a free tool that tracks what happens to your proposal after you send it. You can see when your client opens it, which pages they spent the most time on, whether they came back to re-read sections, and whether they forwarded it internally. It tells you whether your deal is moving or going cold before your client says a word.",
  },
  {
    q: "How do I know if my client actually read my proposal?",
    a: "Without a tracking tool you have no way of knowing. With DocMetrics you see exactly when the proposal was opened, how long they spent on each page, and whether they returned for a second look. Upload your proposal to DocMetrics after downloading your template and you will have complete visibility from the moment they click the link.",
  },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function TemplatesPage(): JSX.Element {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* ── HERO ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.25rem 2rem", textAlign: "center" }}>
        <span style={{
          display: "inline-block", padding: "5px 14px", borderRadius: 20,
          background: "#f5f3ff", color: "#6d28d9",
          fontSize: 12, fontWeight: 600, letterSpacing: ".04em",
          textTransform: "uppercase", marginBottom: "1.25rem",
        }}>
          Free Downloads
        </span>
        <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, color: "#111827", lineHeight: 1.25, marginBottom: "1rem" }}>
          Free Proposal and Contract Templates
        </h1>
        <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.65, maxWidth: 520, margin: "0 auto 1rem" }}>
          Download any template free. No email required. Each one is built to help freelancers and consultants close deals faster — and includes a note on how to track when your client opens it.
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          4 templates · PDF format · No sign-up required
        </p>
      </div>

      {/* ── TEMPLATES GRID ── */}
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "0 1.25rem 4rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          {templates.map((t) => (
            <div
              key={t.id}
              style={{
                borderRadius: 16, border: `1px solid ${t.border}`,
                background: "#fff", overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,.05)",
              }}
            >
              {/* Card header */}
              <div style={{ padding: "20px 22px 16px", background: t.bg, borderBottom: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{t.icon}</div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
                  {t.title}
                </h2>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px",
                    borderRadius: 20, background: "#fff",
                    color: t.color, border: `1px solid ${t.border}`,
                  }}>
                    {t.pages}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px",
                    borderRadius: 20, background: "#fff",
                    color: t.color, border: `1px solid ${t.border}`,
                  }}>
                    {t.format}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px",
                    borderRadius: 20, background: "#fff",
                    color: t.color, border: `1px solid ${t.border}`,
                  }}>
                    Free
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: "18px 22px" }}>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: "0 0 12px" }}>
                  {t.description}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", margin: "0 0 16px" }}>
                  Best for: {t.bestFor}
                </p>

                {/* DocMetrics note */}
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: "#fafafa", border: "1px solid #f1f5f9",
                  marginBottom: 16,
                }}>
                  <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                    💡 {t.docmetricsNote}{" "}
                    <a href="https://docmetrics.io/signup" style={{ color: "#6d28d9", fontWeight: 600, textDecoration: "none" }}>
                      Free at docmetrics.io →
                    </a>
                  </p>
                </div>

                {/* Download button */}
                <a
                  href={t.downloadHref}
                  download
                  style={{
                    display: "block", textAlign: "center",
                    padding: "11px 20px", borderRadius: 10,
                    background: t.color, color: "#fff",
                    fontSize: 13, fontWeight: 600,
                    textDecoration: "none", transition: "opacity .15s",
                  }}
                >
                  ↓ Download Free Template
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY TRACK YOUR PROPOSAL ── */}
      <div style={{ background: "#fafafa", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.25rem" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: "0.5rem", textAlign: "center" }}>
            A great template is only half the job
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: "2.5rem", lineHeight: 1.65 }}>
            The other half is knowing what happens after you send it. Most proposals fail not because of the proposal itself but because of the silence that follows.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { icon: "👁️", title: "See when they open it", body: "Know the exact moment your client clicks the link. No more wondering if they received it." },
              { icon: "📄", title: "See which pages they read", body: "Know if they spent 8 minutes on your pricing section or skipped straight to the end." },
              { icon: "🔄", title: "Detect when they return", body: "When a prospect comes back to re-read your proposal that is one of the strongest buying signals there is." },
              { icon: "👥", title: "Detect internal sharing", body: "Know when your proposal gets forwarded to a decision maker you have never met." },
            ].map((item, i) => (
              <div key={i} style={{ padding: "18px 20px", borderRadius: 12, background: "#fff", border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>{item.title}</p>
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <a
              href="https://docmetrics.io/signup"
              style={{
                display: "inline-block", padding: "12px 28px",
                background: "#6d28d9", color: "#fff",
                borderRadius: 10, fontSize: 14, fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Track your next proposal free →
            </a>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>No credit card required</p>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 1.25rem 5rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: "2rem", textAlign: "center" }}>
          Frequently asked questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid #f1f5f9", background: "#fff" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>{faq.q}</p>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER CTA ── */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 1.25rem 5rem", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.65 }}>
          Templates by{" "}
          <a href="https://docmetrics.io" style={{ color: "#6d28d9", textDecoration: "none", fontWeight: 500 }}>
            DocMetrics
          </a>
          {" "}— post-proposal intelligence for freelancers, consultants, and sales teams.
        </p>
      </div>

    </div>
  );
}