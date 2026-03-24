// app/blog/page.tsx
//  Server Component — Google indexes the hero and metadata
//  BlogContent isolated as its own client component
import type { Metadata } from "next"
import { JSX } from "react"
import { BlogContent } from "@/components/blog-content"

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Blog — Insights, Guides, and Product Updates",
  description:
    "Practical advice on document sharing, analytics, e-signatures, and everything in between — written for the teams that use DocMetrics every day.",
  alternates: {
    canonical: "https://docmetrics.io/blog",
  },
  openGraph: {
    title: "DocMetrics Blog — Insights, Guides, and Product Updates",
    description:
      "Practical advice on document sharing, analytics, e-signatures, and everything in between — written for the teams that use DocMetrics every day.",
    url: "https://docmetrics.io/blog",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocMetrics Blog",
      },
    ],
  },
}

// ── JSON-LD ───────────────────────────────────────────────────
const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "DocMetrics Blog",
  description:
    "Practical advice on document sharing, analytics, e-signatures, and everything in between — written for the teams that use DocMetrics every day.",
  url: "https://docmetrics.io/blog",
  publisher: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
  },
}

// ── PAGE ──────────────────────────────────────────────────────
export default function BlogPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      {/* ── HERO ── */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
              Blog
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
              Insights, guides, and{" "}
              <span className="text-sky-600">product updates.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-lg">
              Practical advice on document sharing, analytics, e-signatures,
              and everything in between — written for the teams that use
              DocMetrics every day.
            </p>
          </div>
        </div>
      </div>

      {/*  Only this part is client-side */}
      <BlogContent />

    </div>
  )
}