// app/product/demo/page.tsx
//  Server Component — Google indexes all content
//  VideoPlayer isolated as its own client component
import type { Metadata } from "next";
import { JSX } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VideoPlayer } from "@/components/video-player";

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "See DocMetrics in Action — Full Product Walkthrough",
  description:
    "Watch a 2-minute walkthrough of DocMetrics — upload a document, create a share link, and see exactly how long each person spent on every page.",
  alternates: {
    canonical: "https://docmetrics.io/product/demo",
  },
  openGraph: {
    title: "See DocMetrics in Action — Full Product Walkthrough",
    description:
      "Watch a 2-minute walkthrough of DocMetrics — upload a document, create a share link, and see exactly how long each person spent on every page.",
    url: "https://docmetrics.io/product/demo",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocMetrics Product Demo Walkthrough",
      },
    ],
  },
};

// ── JSON-LD: VideoObject Schema ───────────────────────────────
// Tells Google this page contains a video
// Google can show it as a rich result with thumbnail in search
const videoSchema = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "DocMetrics Product Walkthrough",
  description:
    "A full walkthrough of DocMetrics — from uploading a document to seeing exactly how long each person spent on every page. Covers share links, real-time tracking, and data rooms.",
  thumbnailUrl: "https://docmetrics.io/assets/screenshots/demo-poster.png",
  uploadDate: new Date().toISOString(),
  duration: "PT2M",
  contentUrl: "https://docmetrics.io/videos/demo.mp4",
  embedUrl: "https://docmetrics.io/product/demo",
  publisher: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
    logo: {
      "@type": "ImageObject",
      url: "https://docmetrics.io/logo.png",
    },
  },
};

// ── PAGE ──────────────────────────────────────────────────────
export default function DemoPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />

      {/* ── Hero ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
          See It In Action
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
          The whole product in{" "}
          <span className="text-sky-600">two minutes.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Watch a real walkthrough of DocMetrics — from uploading a
          document to seeing exactly how long each person spent on every
          page.
        </p>
      </div>

      {/* ── Video ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
        <VideoPlayer />

        {/* What the video covers */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { time: "0:00", label: "Upload a document" },
            { time: "0:30", label: "Create a share link" },
            { time: "0:55", label: "See who read what" },
            { time: "1:30", label: "Spaces & data rooms" },
          ].map((item) => (
            <div key={item.time} className="flex items-start gap-2.5">
              <span className="text-xs font-mono font-semibold text-sky-500 mt-0.5 flex-shrink-0">
                {item.time}
              </span>
              <span className="text-xs text-slate-500 leading-relaxed">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Ready to try it yourself?
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Start for free — no credit card required. Upload your first
            document and see real analytics in under two minutes.
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