

// app/features/analytics/page.tsx
// ✅ Server Component — Google indexes all content
// ✅ VideoBlock isolated as its own client component
import type { Metadata } from "next";
import { JSX } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { VideoBlock } from "@/components/video-block";

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Document Analytics — Know Exactly What Happens After You Send",
  description:
    "See who read your document, how long they spent on each page, whether they understood it, and where they dropped off. Real-time notifications, visitor profiles, and signature analytics.",
  alternates: {
    canonical: "https://docmetrics.io/features/analytics",
  },
  openGraph: {
    title: "Document Analytics — DocMetrics",
    description:
      "See who read your document, how long they spent on each page, whether they understood it, and where they dropped off.",
    url: "https://docmetrics.io/features/analytics",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocMetrics Document Analytics Dashboard",
      },
    ],
  },
};

// ── JSON-LD: SoftwareApplication Feature List ─────────────────
const analyticsSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocMetrics Document Analytics",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://docmetrics.io/features/analytics",
  description:
    "Document analytics that shows who read your document, time spent per page, visitor identity, real-time notifications, understanding analytics, and e-signature funnel tracking.",
  featureList: [
    "Page-by-page reading time bar chart",
    "Visitor identity and engagement history",
    "Real-time open notifications via email, dashboard, and Slack",
    "Understanding analytics with video walkthrough completion tracking",
    "E-signature funnel analytics",
    "Dashboard overview with most engaged contacts",
    "Live reading indicator",
    "Deal intent tracking",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free trial available — no credit card required",
  },
};

// ── COMPONENTS ────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mt-16 mb-8">
      {children}
    </p>
  );
}

function ScreenshotBlock({
  title,
  description,
  imageSrc,
  imageAlt,
  reverse = false,
}: {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
      <div className={reverse ? "lg:order-2" : "lg:order-1"}>
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-4">
          {title}
        </h2>
        <p className="text-base text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      <div
        className={`${
          reverse ? "lg:order-1" : "lg:order-2"
        } rounded-2xl overflow-hidden shadow-xl bg-slate-50`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1200}
          height={800}
          quality={100}
          className="w-full h-auto block"
        />
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────
export default function DocumentAnalyticsPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(analyticsSchema) }}
      />

      {/* ── Hero ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
              Analytics
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
              Know exactly what happens{" "}
              <span className="text-sky-600">after you send.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              Every document you share becomes a live data source. See who
              read it, how long they spent on each page, whether they
              understood it, and where they dropped off.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-slate-400 mt-3">
              No credit card required
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-xl bg-slate-50">
            <Image
              src="/assets/feature-dataroom.png"
              alt="DocMetrics document analytics dashboard showing most engaged contacts"
              width={1200}
              height={800}
              quality={100}
              priority
              className="w-full h-auto block"
            />
          </div>
        </div>
      </div>

      {/* ── Feature sections ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        <SectionLabel>Page by page reading data</SectionLabel>

        <VideoBlock
          title="See how long each person spent on every page."
          description="When someone opens your document a bar chart builds in real time showing their reading time per page. Tall bars mean they read carefully. Short bars mean they skimmed or skipped. Hover over any bar to see a thumbnail of that page and the exact time spent. You see this for every visitor individually — not averaged across everyone."
          videoSrc="/videos/analytics-demo.mp4"
          posterSrc="/assets/screenshots/page-bar-chart-poster.png"
        />

        <SectionLabel>Visitor identity and history</SectionLabel>

        <ScreenshotBlock
          title="Know who opened your document, not just that someone did."
          description="Every visitor is identified by their email address — either captured at the gate before they open the link, or matched against your share link settings. You see their first visit, every return visit, total time spent across all sessions, and which pages they came back to. Multiple visits from the same person stack into one profile so you see the full picture of their engagement over time."
          imageSrc="/assets/doc-open.png"
          imageAlt="Visitor identity and document engagement profile in DocMetrics"
          reverse
        />

        <SectionLabel>Understanding analytics</SectionLabel>

        <ScreenshotBlock
          title="Reading time tells you how long. This tells you if they understood."
          description="For every page that has a video walkthrough recorded, you see two bars per visitor — their reading time and how much of your explanation they watched. If someone watched your page 4 walkthrough three times you know that page needs a conversation. If they marked every page as clear and answered ready to move forward on the deal intent question, you know the timing is right to close."
          imageSrc="/assets/understanding-bars.png"
          imageAlt="Document understanding analytics with video walkthrough completion"
        />

        <SectionLabel>Real time notifications</SectionLabel>

        <VideoBlock
          title="Know the moment someone opens your document."
          description="The instant a recipient opens your share link you receive a notification — in your dashboard, by email, and in Slack if connected. The notification includes their email, which document they opened, and what time. If they are viewing right now a live indicator appears on your dashboard. You always know when to follow up and you never have to guess whether they have seen it yet."
          videoSrc="/videos/tracking-demo.mp4"
          posterSrc="/assets/screenshots/notifications-poster.png"
          reverse
        />

        <SectionLabel>Signature analytics</SectionLabel>

        <ScreenshotBlock
          title="Track the entire signing journey, not just the outcome."
          description="For every signature request you see a funnel — how many recipients opened the document, how many scrolled to the signature field, how many started signing, and how many completed it. For each individual signer you see their reading time per page, their video walkthrough completion, and if they declined, the page they were on and the reason they gave."
          imageSrc="/assets/signature-analytics.png"
          imageAlt="E-signature analytics funnel showing completion rates"
        />

        <SectionLabel>Dashboard overview</SectionLabel>

        <ScreenshotBlock
          title="Your most engaged contacts, always at the top."
          description="Your dashboard shows the contacts who have spent the most time across all your documents in the last 30 days — ranked by visits, total time, and number of documents viewed. Below that you see your top documents by views, your most recent visits in real time, and your hottest visitors by engagement score. Everything you need to know about what is happening across your entire document library, without digging."
          imageSrc="/assets/dashboard.png"
          imageAlt="DocMetrics dashboard overview showing engaged contacts and document activity"
          reverse
        />

      </div>

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            See your own documents come alive.
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Upload any PDF and share it. You will see your first analytics
            within seconds of your recipient opening the link.
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
              href="/product/how-it-works"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              How it works
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