import type { Metadata } from "next";
import { JSX } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VideoPlayer } from "@/components/video-player";

export const metadata: Metadata = {
  title: "See DocMetrics in Action — Full Product Walkthrough",
  description:
    "Watch a 4-minute walkthrough of DocMetrics — upload a document, create a share link, and see exactly how long each person spent on every page.",
  alternates: {
    canonical: "https://docmetrics.io/product/demo",
  },
  openGraph: {
    title: "See DocMetrics in Action — Full Product Walkthrough",
    description:
      "Watch a 4-minute walkthrough of DocMetrics — upload a document, create a share link, and see exactly how long each person spent on every page.",
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

const videoSchema = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "DocMetrics Product Walkthrough",
  description:
    "A full walkthrough of DocMetrics — from uploading a document to seeing exactly how long each person spent on every page. Covers share links, real-time tracking, and data rooms.",
  thumbnailUrl: "https://docmetrics.io/assets/screenshots/demo-poster.png",
  uploadDate: new Date().toISOString(),
  duration: "PT4M27S",
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

export default function DemoPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />

      {/* ── Hero — text centered, no side by side ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
          See It In Action
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
          The whole product in{" "}
          <span className="text-sky-600">four minutes.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10">
          Watch a real walkthrough of DocMetrics — from uploading a
          document to seeing exactly how long each person spent on every
          page.
        </p>

        {/* ── Video full width under the text ── */}
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
          <VideoPlayer />
        </div>

        {/* Timestamp markers */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          {[
            { time: "0:00", label: "Upload a document" },
            { time: "0:45", label: "Create a share link" },
            { time: "1:30", label: "See who read what" },
            { time: "2:45", label: "Spaces & data rooms" },
          ].map((item) => (
            <div
              key={item.time}
              className="flex items-start gap-2.5 p-4 rounded-xl bg-slate-50 border border-slate-100"
            >
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

      {/* ── What you will see — 3 columns below video ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid sm:grid-cols-3 gap-8 border-t border-slate-100 pt-12">
          {[
            {
              title: "Upload & Share",
              description:
                "See how to upload any PDF and create a secure share link in under 60 seconds.",
            },
            {
              title: "Live Analytics",
              description:
                "Watch real-time tracking in action — who opened it, which pages they read, and how long they spent.",
            },
            {
              title: "Data Rooms",
              description:
                "See how to create a secure data room, invite contacts, and track every interaction.",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
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