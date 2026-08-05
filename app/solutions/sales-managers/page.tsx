// app/solutions/sales-managers/page.tsx
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
  title: "DocMetrics for Sales Managers — Pipeline-Wide Document Engagement Visibility",
  description:
    "See document engagement across your entire team's pipeline. Spot stalling deals, coach reps with real data, and get buying-committee visibility across every account.",
  alternates: {
    canonical: "https://docmetrics.io/solutions/sales-managers",
  },
  openGraph: {
    title: "DocMetrics for Sales Managers — Pipeline-Wide Engagement Visibility",
    description:
      "Team-wide document engagement data, deal-risk signals, and coaching insights — all in one dashboard.",
    url: "https://docmetrics.io/solutions/sales-managers",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocMetrics for Sales Managers — Pipeline Engagement Dashboard",
      },
    ],
  },
};

// ── FAQ DATA ──────────────────────────────────────────────────
const FAQS = [
  {
    question: "Can I see engagement across my whole team, not just one deal?",
    answer:
      "Yes. Managers get a team-wide view showing every proposal shared by every rep, with engagement signals rolled up so you can see which deals are active and which have gone quiet — without asking each rep for a status update.",
  },
  {
    question: "Will this help me coach my reps?",
    answer:
      "Yes. You can see which proposals get read fully, which get skimmed, and which pages prospects consistently skip. That gives you concrete, document-level data to use in pipeline reviews and coaching conversations, instead of relying on rep self-reporting.",
  },
  {
    question: "Can I spot deals that are at risk before the rep notices?",
    answer:
      "DocMetrics surfaces signals like slowing engagement, drop-off in stakeholder activity, or no re-opens after the first view. These are shown as evidence with confidence levels, not instructions — your team decides how to act on them.",
  },
  {
    question: "Do reps need to change how they send proposals?",
    answer:
      "No. Reps keep sending documents the way they already do — by email, LinkedIn, or any other channel. DocMetrics tracks engagement in the background and rolls it up into your team dashboard automatically.",
  },
  {
    question: "Can I see who else at the buyer's company is involved?",
    answer:
      "Yes. DocMetrics detects when a document is forwarded or opened by additional stakeholders and flags growing buying-committee activity, which is often a stronger signal of deal momentum than any single viewer's behavior.",
  },
  {
    question: "Does this integrate with our CRM or reporting?",
    answer:
      "You can connect DocMetrics to your existing pipeline reporting so engagement data sits alongside deal stage and forecast data your team already tracks, rather than living in a separate tool.",
  },
  {
    question: "Can I control what my reps are allowed to share?",
    answer:
      "Yes. As a manager or admin you can set organization-wide sharing defaults — password protection, domain restrictions, NDA gating, and expiry dates — so sensitive materials stay controlled across the whole team.",
  },
  {
    question: "Is document data secure across the whole organization?",
    answer:
      "All documents are encrypted in transit and at rest. Team members only see what they're permitted to see, and admins retain full visibility and control over every share link created under the organization.",
  },
];

// ── JSON-LD ───────────────────────────────────────────────────
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocMetrics for Sales Managers",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://docmetrics.io/solutions/sales-managers",
  description:
    "Team-wide document engagement analytics for sales managers. Pipeline visibility, deal-risk signals, coaching data, and buying-committee detection across every rep's shared proposals.",
  featureList: [
    "Team-wide dashboard across every rep's shared documents",
    "Deal-risk signals from slowing or stalled engagement",
    "Page-by-page engagement data for coaching conversations",
    "Buying-committee detection across accounts",
    "Organization-wide sharing controls and governance",
    "Pipeline and CRM reporting integration",
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
  step: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
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
export default function SalesManagersPage(): JSX.Element {
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
              For Sales Managers
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
              See your whole pipeline&apos;s engagement,{" "}
              <span className="text-sky-600">not just one deal at a time.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              DocMetrics gives sales managers a team-wide view of proposal engagement — which deals are heating up, which have gone quiet, and where to focus coaching, without waiting on rep status updates.
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
              src="/assets/illustrations/managers-hero.png"
              alt="DocMetrics sales manager pipeline engagement dashboard"
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
              Your pipeline report says "in progress." That doesn&apos;t tell you much.
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              Every rep says their deals are moving. Your CRM says the stage
              hasn&apos;t changed in three weeks. You don&apos;t have time to
              ask every rep for a play-by-play on every account, but without
              real engagement data, you can&apos;t tell which deals are
              actually stalling until it&apos;s too late to help.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "No pipeline-wide visibility",
                description:
                  "You see deal stages in your CRM, but not what's actually happening after a proposal goes out — until the rep tells you, if they tell you.",
              },
              {
                title: "Coaching without data",
                description:
                  "You want to help reps improve their proposals and follow-up timing, but without engagement data, coaching conversations stay anecdotal.",
              },
              {
                title: "Deals go quiet without warning",
                description:
                  "By the time a deal shows as stalled in your CRM, engagement may have been dropping for weeks. You find out after it's too late to intervene.",
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
        label="Team Dashboard"
        title="Every rep's document activity, in one place."
        description="See every proposal your team has shared, who opened it, and how engagement is trending — without pinging reps for updates or waiting for the next pipeline review."
        bullets={[
          "Team-wide view across every rep's shared documents",
          "Filter by rep, account, or deal stage",
          "See which deals have active engagement right now",
          "Spot reps whose proposals consistently underperform",
          "No extra work for reps — tracking happens automatically",
        ]}
        imageSrc="/assets/illustrations/managers-dashboard.png"
        imageAlt="Sales manager team-wide document engagement dashboard"
      />

      <FeatureBlock
        step="2"
        label="Deal Risk Signals"
        title="Know which deals are cooling off before your forecast call."
        description="DocMetrics surfaces engagement signals — slowing activity, no re-opens, drop-off in stakeholder involvement — as evidence with confidence levels, so you can flag at-risk deals before they fall out of the pipeline."
        bullets={[
          "See engagement trends across the deal lifecycle, not just the first open",
          "Flag deals with declining activity for closer review",
          "Compare engagement against deal stage to sanity-check forecasts",
          "Signals are shown with confidence levels, never as instructions",
          "Catch stalling deals early enough to actually intervene",
        ]}
        imageSrc="/assets/illustrations/managers-risk.png"
        imageAlt="Deal risk signal detection for sales pipeline"
        reverse
      />

      <FeatureBlock
        step="3"
        label="Coaching Data"
        title="Give feedback grounded in what actually happened."
        description="Instead of guessing why a deal didn't convert, look at exactly which pages prospects read, skipped, or re-read. Use it to coach reps on proposal structure, pricing presentation, and follow-up timing."
        bullets={[
          "Page-by-page reading data for every proposal a rep sends",
          "Compare a rep's proposals against team benchmarks",
          "Identify proposal sections that consistently lose attention",
          "Use real reading behavior in 1:1s and pipeline reviews",
          "Help reps improve based on evidence, not guesswork",
        ]}
        imageSrc="/assets/illustrations/managers-coaching.png"
        imageAlt="Sales coaching using document engagement data"
      />

      <FeatureBlock
        step="4"
        label="Buying Committee Visibility"
        title="See when a deal is expanding beyond your primary contact."
        description="DocMetrics flags when a document is forwarded internally or opened by additional stakeholders at the buyer's company — often a stronger signal of momentum than anything your primary contact tells you."
        bullets={[
          "Detect forwarding and additional viewers automatically",
          "See growing stakeholder activity across an account",
          "Understand who else may be involved in the decision",
          "Surface this to reps so they can adjust their outreach",
          "Available across every deal on your team, not just flagged ones",
        ]}
        imageSrc="/assets/illustrations/managers-committee.png"
        imageAlt="Buying committee detection across sales accounts"
        reverse
      />

      <FeatureBlock
        step="5"
        label="Governance & Controls"
        title="Set sharing standards across your whole team."
        description="As a manager or admin, control how sensitive materials are shared org-wide — password protection, domain restrictions, NDA gating, and link expiry — so reps don't have to make security decisions deal by deal."
        bullets={[
          "Organization-wide defaults for password and domain restrictions",
          "Require NDA acceptance before sensitive documents are viewable",
          "Set expiry dates so old proposals can't be reopened after a deal closes",
          "Full visibility into every share link created by your team",
          "Revoke access to any document at any time",
        ]}
        imageSrc="/assets/illustrations/managers-security.png"
        imageAlt="Team-wide document sharing governance and controls"
      />

      <FeatureBlock
        step="6"
        label="Reporting Integration"
        title="Roll engagement data into the reporting you already run."
        description="Connect DocMetrics to your existing pipeline reporting so document engagement sits alongside deal stage and forecast data, instead of living in a separate tool your team has to check manually."
        bullets={[
          "Bring engagement signals into your existing pipeline view",
          "Use engagement trends to sanity-check forecast confidence",
          "Export team-level engagement summaries for leadership reviews",
          "Keep reps in their normal workflow — no extra data entry",
          "One place to see activity and outcomes together",
        ]}
        imageSrc="/assets/illustrations/managers-reporting.png"
        imageAlt="Sales pipeline reporting with document engagement data"
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
              Everything you need to know about DocMetrics for sales managers{" "}
              <a
                href="/contact"
                className="text-[#0284c7] hover:text-[#0369a1] font-medium transition-colors"
              >
                Contact us
              </a>{" "}
              if you cannot find what you are looking for.
            </p>
          </div>
          {/* Only this part is client-side */}
          <FAQAccordion faqs={FAQS} defaultOpen={0} />
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Stop finding out deals stalled after it's too late.
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Get pipeline-wide engagement visibility in under two minutes.
            No credit card required.
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