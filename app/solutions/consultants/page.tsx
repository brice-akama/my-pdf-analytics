// app/solutions/consultants/page.tsx
// ✅ Server Component — Google indexes all content
// ✅ FAQAccordion isolated as its own client component
import type { Metadata } from "next";
import { JSX } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FAQAccordion } from "@/components/faq-accordion";

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "DocMetrics for Consultants — See How Clients Engage With Your Proposals & Reports",
  description:
    "Track proposal opens, page-by-page engagement, repeat visits, and client activity on every SOW, report, and deliverable you send. Know exactly when to follow up.",
  alternates: {
    canonical: "https://docmetrics.io/solutions/consultants",
  },
  openGraph: {
    title: "DocMetrics for Consultants — Know When Your Client Is Reading",
    description:
      "Real-time alerts when clients open your proposals or reports, page-by-page reading analytics, automatic engagement scoring, and e-signatures — all in one platform.",
    url: "https://docmetrics.io/solutions/consultants",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocMetrics for Consultants — Proposal and Report Tracking",
      },
    ],
  },
};

// ── FAQ DATA ──────────────────────────────────────────────────
const FAQS = [
  {
    question: "Can clients tell they are being tracked?",
    answer:
      "No. Clients receive a completely normal document viewing experience. There is no software to install and no indication that their engagement is being measured. They simply open and read the proposal or report as they normally would.",
  },
  {
    question: "How quickly do I get notified when a client opens my document?",
    answer:
      "Notifications arrive within seconds of a client opening your document. You receive an alert by email and in-app the moment the link is opened so you can follow up while the engagement is still top of mind for them.",
  },
  {
    question: "Can I track the same proposal sent to multiple clients?",
    answer:
      "Yes. Each client gets their own unique link so DocMetrics tracks each engagement individually. You see exactly who opened what, when they opened it, and how long they spent on each page — all kept separate, per client.",
  },
  {
    question: "What types of documents can I track?",
    answer:
      "DocMetrics supports PDF documents. This covers proposals, statements of work, project reports, case studies, deliverables, and any other client-facing material you currently share as a PDF.",
  },
  {
    question: "How is the engagement score calculated?",
    answer:
      "The engagement score is calculated from a combination of factors including number of visits, total time spent reading, pages viewed, whether the document was downloaded, and whether it was forwarded to other stakeholders. Higher scores indicate a client is more likely to move forward.",
  },
  {
    question: "Does DocMetrics work alongside how I already manage clients?",
    answer:
      "Yes. You generate tracked links from DocMetrics and share them however you normally would — by email, a client portal, or any other channel — while all analytics stay in DocMetrics. Your existing workflow does not need to change.",
  },
  {
    question: "Can I request e-signatures through DocMetrics?",
    answer:
      "Yes. You can send signature requests directly from DocMetrics, place signature fields on any page, set a signing order for multiple stakeholders, and track exactly how long each person took to open, read, and sign.",
  },
  {
    question: "Is my client data secure?",
    answer:
      "All documents are encrypted in transit and at rest. Share links support NDA gating so clients must sign a confidentiality agreement before they can view anything. You retain full ownership of everything you upload and can revoke access at any time.",
  },
];

// ── JSON-LD ───────────────────────────────────────────────────
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocMetrics for Consultants",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://docmetrics.io/solutions/consultants",
  description:
    "Document tracking and analytics for independent consultants and agencies. Real-time alerts when clients open proposals or reports, page-by-page reading data, automatic engagement scoring, and e-signatures.",
  featureList: [
    "Real-time open notifications by email, Slack, and in-app",
    "Page-by-page reading time analytics",
    "Automatic engagement scoring based on client activity",
    "Bulk send with individual tracking per client",
    "E-signature requests with signing funnel analytics",
    "Secure share links with password protection and expiry dates",
    "Live reading indicator",
    "Forwarding detection",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free trial — no credit card required",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

// ── COMPONENTS ────────────────────────────────────────────────
function FeatureBlock({
  step,
  label,
  title,
  description,
  bullets,
  imageSrc,
  imageAlt,
  reverse,
}: {
  step: string
  label: string
  title: string
  description: string
  bullets: string[]
  imageSrc: string
  imageAlt: string
  reverse?: boolean
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div
        className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
          reverse ? "lg:grid-flow-dense" : ""
        }`}
      >
        <div className={reverse ? "lg:col-start-2" : ""}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {step}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {label}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-4">
            {title}
          </h2>
          <p className="text-base text-slate-500 leading-relaxed mb-6">
            {description}
          </p>
          <ul className="space-y-3">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div
          className={`flex items-center justify-center ${
            reverse ? "lg:col-start-1 lg:row-start-1" : ""
          }`}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={520}
            height={420}
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────
export default function ConsultantsPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ── HERO ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
              For Consultants
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
              Know when your client is actually{" "}
              <span className="text-sky-600">reading your proposal.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              DocMetrics gives independent consultants and agencies real-time visibility into how clients engage with proposals, SOWs, and reports — not just who opened it, but where they hesitated, what they re-read, and when an engagement starts going cold before the client goes quiet.
            </p>
            <Button
              size="lg"
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-6 text-base rounded-xl shadow-md hover:shadow-lg transition-all"
              asChild
            >
              <Link href="/signup">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-slate-400 mt-3">
              No credit card required
            </p>
          </div>
          <div className="flex items-center justify-center">
            <Image
              src="/assets/illustrations/consultant-hero.png"
              alt="DocMetrics consultant proposal tracking dashboard"
              width={560}
              height={460}
              priority
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <div className="bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-4">
              You send the proposal. Then silence.
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              You spend hours on a scope of work, a project report, or a
              pricing proposal for a client. You send it. Then you have no
              idea what happens next. Did they open it? Which sections did
              they actually read? Is now the right time to check in, or will
              you come across as chasing them? Meanwhile the client is
              quietly comparing you to another consultant who happened to
              call at the right moment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "No visibility after sending",
                description:
                  "Once you hit send you lose all visibility. You know when the proposal went out, but not what happened after, let alone which sections they actually read.",
              },
              {
                title: "Wrong follow-up timing",
                description:
                  "Checking in too early feels pushy. Waiting too long means the client already moved forward with someone else while you were still deciding.",
              },
              {
                title: "No signal of client intent",
                description:
                  "You cannot tell which clients are ready to move and which are just gathering quotes. Every proposal gets the same follow-up regardless of real interest.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-slate-200 rounded-xl p-6"
              >
                <div className="h-1.5 w-6 rounded-full bg-red-300 mb-5" />
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  {item.title}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURE BLOCKS ── */}
      <FeatureBlock
        step="1"
        label="Real-Time Alerts"
        title="Know the instant your client opens your proposal."
        description="The moment a client opens your document, DocMetrics sends you a notification. You see when they opened it, what device they used, and how many times they have come back. You can follow up while you are still top of mind."
        bullets={[
          "Instant notification the moment your document is opened",
          "See the viewer's location, device, and time of visit",
          "Track every return visit — multiple opens signal real interest",
          "Know when your proposal gets forwarded to another stakeholder",
          "Live indicator shows when someone is reading your document right now",
        ]}
        imageSrc="/assets/illustrations/consultant-alerts.png"
        imageAlt="Real-time client document open notification alert"
      />

      <FeatureBlock
        step="2"
        label="Page Analytics"
        title="See where clients spend the most time in your proposal."
        description="DocMetrics tracks time spent on every page of every document you share. If a client spends six minutes on your pricing page but skips your methodology section entirely, you know exactly what to address on your next call."
        bullets={[
          "Per-page bar chart showing exact reading time for every visitor",
          "See which pages were skipped and which ones were read multiple times",
          "Identify the sections that actually drive client decisions",
          "Compare engagement across multiple clients on the same proposal template",
          "Use reading data to prepare a sharper, more targeted follow-up call",
        ]}
        imageSrc="/assets/illustrations/consultant-analytics.png"
        imageAlt="Client proposal page-by-page analytics chart"
        reverse
      />

      <FeatureBlock
        step="3"
        label="Deal Intelligence"
        title="Spot engagement patterns before your next check-in."
        description="DocMetrics highlights engagement signals such as repeated page views, pricing revisits, and video replays that may indicate areas worth discussing with your client before they go quiet."
        bullets={[
          "See which pages were viewed multiple times",
          "Know when a client revisited your pricing section multiple times",
          "Video replay detection shows which explanations clients watched more than once",
          "See when engagement slows so you know which proposals may need attention",
          "Receive alerts when new engagement happens so you can decide when to check in",
        ]}
        imageSrc="/assets/illustrations/consultant-intelligence.png"
        imageAlt="Deal intelligence hesitation signals for consultant proposals"
      />

      <FeatureBlock
        step="4"
        label="Client Scoring"
        title="Prioritize the clients most likely to move forward."
        description="DocMetrics automatically scores every client based on their engagement — time spent reading, number of visits, pages reviewed, downloads, and whether they shared the document with others. The clients closest to a decision rise to the top."
        bullets={[
          "Automatic engagement score calculated from visits, time, and actions",
          "Score based on document activity so you prioritize the right follow-ups",
          "See the full engagement history for every client in one view",
          "Stop chasing clients who opened once and never returned",
          "Focus your energy where interest is actually high",
        ]}
        imageSrc="/assets/illustrations/consultant-scoring.png"
        imageAlt="Automatic client engagement scoring for consultants"
      />

      <FeatureBlock
        step="5"
        label="Secure Sharing"
        title="Full control over who sees your proposals and for how long."
        description="Every link you create has its own settings. Require an email address, add a password, restrict to specific domains, set an expiry date, or block downloads — all before you send. Every link is unique and every view is tracked individually."
        bullets={[
          "Require email verification before anyone can open your proposal",
          "Password protect sensitive pricing documents and contracts",
          "Restrict access to specific email addresses or company domains",
          "Set expiry dates so old proposals cannot be accessed after an engagement ends",
          "Block downloads while still allowing full document viewing",
        ]}
        imageSrc="/assets/illustrations/step-share.png"
        imageAlt="Secure document sharing with access controls"
        reverse
      />

      <FeatureBlock
        step="6"
        label="Bulk Send"
        title="Send personalised proposals to every prospective client at once."
        description="Upload your CSV, map your custom fields, and DocMetrics generates a unique tracked link for every recipient. Each client gets their own document and you track each one individually — opens, pages read, time spent, and engagement score."
        bullets={[
          "Upload a CSV with client names, emails, and custom fields",
          "Each client gets their own unique tracked link",
          "Preview the document for any client before sending",
          "Track engagement per client — opens, pages read, and score",
          "Follow up with non-openers or high-intent readers as a targeted group",
        ]}
        imageSrc="/assets/illustrations/consultant-bulk.png"
        imageAlt="Bulk send personalised client proposals with individual tracking"
      />

      <FeatureBlock
        step="7"
        label="E-Signatures"
        title="Request signatures and track every step of the signing process."
        description="Send documents for e-signature directly from DocMetrics. Place signature fields, set a signing order, and track exactly how long each recipient took to open, read, and sign. All signature data appears in the same analytics dashboard."
        bullets={[
          "Send signature requests to one or multiple stakeholders",
          "Place signature, date, text, checkbox, and attachment fields",
          "Track time to open, time to sign, and pages viewed before signing",
          "Signing funnel shows how many opened, reached the signature, and completed",
          "Bundle multiple documents into one envelope for complex engagements",
        ]}
        imageSrc="/assets/illustrations/step-sign.png"
        imageAlt="E-signature tracking and signing funnel analytics"
        reverse
      />

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-base text-slate-500">
              Everything you need to know about DocMetrics for consultants{" "}
              <a
                href="/contact"
                className="text-[#0284c7] hover:text-[#0369a1] font-medium transition-colors"
              >
                Contact us
              </a>{" "}
              if you cannot find what you are looking for.
            </p>
          </div>
          {/*  Only this part is client-side */}
          <FAQAccordion faqs={FAQS} defaultOpen={0} />
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Start knowing what happens after you hit send.
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Upload your first proposal and see real engagement data in
            under two minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              View pricing
            </Link>
          </div>
          <p className="text-xs text-white/60 mt-5">
            No credit card required
          </p>
        </div>
      </div>

    </div>
  );
}