// app/product/how-it-works/page.tsx
import type { Metadata } from "next";
import { JSX } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "How It Works — From Upload to Insight in Minutes",
  description:
    "Upload a document, share a secure link, and see who read every page in real time. Track views, collect e-signatures, and know exactly when to follow up.",
  alternates: {
    canonical: "https://docmetrics.io/product/how-it-works",
  },
  openGraph: {
    title: "How DocMetrics Works — Document Analytics for Sales Teams",
    description:
      "Upload a document, share a secure link, and see who read every page in real time. Track views, collect e-signatures, and know exactly when to follow up.",
    url: "https://docmetrics.io/product/how-it-works",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "How DocMetrics Works — Document Analytics",
      },
    ],
  },
};

// ── JSON-LD: HowTo Schema ─────────────────────────────────────
// This tells Google this page is a step-by-step guide
// Google can show this as a rich result with numbered steps
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Track Your Documents with DocMetrics",
  description:
    "DocMetrics turns every document you share into a live data source. See who read it, how long they stayed on each page, and exactly when to follow up.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Upload Your Document",
      text: "Drag your PDF into DocMetrics and within seconds you have a trackable share link ready to send. Import directly from Google Drive or OneDrive — no downloading required.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Share With Full Control",
      text: "Every link you create has its own settings. Require an email, add a password, restrict to specific domains, set an expiry date, or block downloads — all before you send.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Track Every Page in Real Time",
      text: "The moment your recipient opens the link you get a notification. A bar chart shows exactly how long they spent on each page, which pages they skipped, and which ones they came back to.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Understand If They Got It",
      text: "Record a short video walkthrough for any page. Prospects watch your explanation without leaving the document and you see exactly how much they understood.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Collect E-Signatures",
      text: "Send documents for e-signature directly from DocMetrics. Track time to open, time to sign, and pages viewed before signing — all in one analytics dashboard.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "Organize Deals in a Data Room",
      text: "Create a private branded space for one client, investor, or deal. Invite people with one link, assign roles, require an NDA, and track every view across every document inside.",
    },
  ],
};

// ── STEP BLOCK COMPONENT ──────────────────────────────────────
//  No "use client" needed — pure display, no state or events
function StepBlock({
  step,
  label,
  title,
  description,
  bullets,
  imageSrc,
  imageAlt,
}: {
  step: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* LEFT: Text */}
        <div>
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

        {/* RIGHT: Illustration */}
        <div className="flex items-center justify-center">
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
export default function HowItWorksPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* ── Hero ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* LEFT: Text */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
              How It Works
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
              From upload to insight —{" "}
              <span className="text-sky-600">in minutes.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              DocMetrics turns every document you share into a live data
              source. See who read it, how long they stayed on each page,
              and exactly when to follow up.
            </p>
            <Button
              size="lg"
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-6 text-base rounded-xl transition-colors"
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

          {/* RIGHT: Hero illustration */}
          <div className="flex items-center justify-center">
            <Image
              src="/assets/illustrations/hero-how-it-works.png"
              alt="DocMetrics platform overview showing document analytics dashboard"
              width={560}
              height={460}
              className="w-full h-auto"
              priority
            />
          </div>

        </div>
      </div>

      {/* ── Steps ── */}
      <StepBlock
        step="1"
        label="Upload"
        title="Upload your document and get a secure link instantly."
        description="Drag your PDF into DocMetrics and within seconds you have a trackable share link ready to send. Import directly from Google Drive or OneDrive — no downloading required."
        bullets={[
          "PDF files — pitch decks, proposals, contracts, NDAs",
          "Import directly from Google Drive or OneDrive",
          "Each link is unique so tracking is always accurate",
          "Upload once, create unlimited share links from the same document",
        ]}
        imageSrc="/assets/illustrations/step-upload.png"
        imageAlt="Upload document to DocMetrics for tracking"
      />

      <StepBlock
        step="2"
        label="Share"
        title="Control exactly who sees your document and how."
        description="Every link you create has its own settings. Require an email, add a password, restrict to specific domains, set an expiry date, or block downloads — all before you send."
        bullets={[
          "Require an email address before anyone can open the link",
          "Password protect sensitive documents",
          "Restrict access to specific email addresses or company domains",
          "Block downloads and forwarding",
          "Set a link to expire after a number of views or a specific date",
        ]}
        imageSrc="/assets/illustrations/step-share.png"
        imageAlt="Document share link settings and access controls"
      />

      <StepBlock
        step="3"
        label="Track"
        title="See every page they read — in real time."
        description="The moment your recipient opens the link you get a notification. A bar chart shows exactly how long they spent on each page, which pages they skipped, and which ones they came back to."
        bullets={[
          "Instant notification by email, Slack, or in-app the moment your document is opened",
          "Page-by-page bar chart shows reading time for every visitor",
          "Revisit indicator shows when someone comes back to a page",
          "Track multiple visitors on the same link and compare engagement",
          "Live indicator shows when someone is reading right now",
        ]}
        imageSrc="/assets/illustrations/step-track.png"
        imageAlt="Real time document tracking analytics dashboard"
      />

      <StepBlock
        step="4"
        label="Understand"
        title="Know if they actually understood what they read."
        description="Reading time tells you how long they stayed. DocMetrics goes further — record a short video walkthrough for any page. Prospects watch your explanation without leaving the document and you see exactly how much they understood."
        bullets={[
          "Record a 60-second video explanation for any page",
          "A floating bubble appears as the viewer reads — they click to watch",
          "See how much of the video each person watched and whether they replayed it",
          "Viewers mark each page as clear or flag that they have questions",
          "Deal intent question at the end — ready to move forward, need more info, or discussing with team",
        ]}
        imageSrc="/assets/illustrations/step-understand.png"
        imageAlt="Document understanding analytics with video walkthrough"
      />

      <StepBlock
        step="5"
        label="Sign"
        title="Send for signature and track every step of the signing process."
        description="Send documents for e-signature directly from DocMetrics. The signer reads, watches your walkthroughs, and signs in one seamless flow. You see how long they read before signing and which page they were on when they declined."
        bullets={[
          "Send signature requests to one or multiple recipients",
          "Track time to open, time to sign, and pages viewed before signing",
          "Signing funnel shows how many opened, scrolled to signature, and completed",
          "Bundle multiple documents into one envelope for complex deals",
          "All signature data appears in the same analytics dashboard",
        ]}
        imageSrc="/assets/illustrations/step-sign.png"
        imageAlt="E-signature tracking and analytics"
      />

      <StepBlock
        step="6"
        label="Data Rooms"
        title="Organize everything for one deal in a secure data room."
        description="A Space is a private branded environment for one client, investor, or deal. Invite people with one link, assign roles, and track every view across every document inside."
        bullets={[
          "Create a branded space with folders — financial, legal, pitch materials",
          "Invite clients or investors with role-based access",
          "Require an NDA signature before anyone can enter",
          "Full audit log — every action, every document view, every download, timestamped",
          "Q&A tab where visitors ask questions and you reply inside the space",
        ]}
        imageSrc="/assets/illustrations/step-dataroom.png"
        imageAlt="Secure data room for deal management"
      />

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Ready to track your first document?
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Start for free — no credit card required. Upload a document
            and see your first analytics in under two minutes.
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
              href="/contact"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Talk to us
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