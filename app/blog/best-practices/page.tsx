
// app/blog/best-practices/page.tsx
// ✅ Server Component — Google indexes all content
// ✅ BestPracticesContent isolated as its own client component
import type { Metadata } from "next"
import { JSX } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BestPracticesContent } from "@/components/best-practices-content"

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Best Practices — Get More Out of Every Document You Share",
  description:
    "Practical guidance on how to use DocMetrics effectively — from setting up share links and reading analytics to running bulk send campaigns and securing confidential documents.",
  alternates: {
    canonical: "https://docmetrics.io/blog/best-practices",
  },
  openGraph: {
    title: "DocMetrics Best Practices — Get More Out of Every Document You Share",
    description:
      "Practical guidance on sharing documents, reading analytics, managing Spaces, collecting signatures, securing materials, and running bulk send campaigns.",
    url: "https://docmetrics.io/blog/best-practices",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocMetrics Best Practices Guide",
      },
    ],
  },
}

// ── JSON-LD ───────────────────────────────────────────────────
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best Practices — Get More Out of Every Document You Share",
  description:
    "Practical guidance on how to use DocMetrics effectively — from setting up share links and reading analytics to running bulk send campaigns and securing confidential documents.",
  url: "https://docmetrics.io/blog/best-practices",
  publisher: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://docmetrics.io/blog/best-practices",
  },
}

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Get More Out of Every Document You Share with DocMetrics",
  description:
    "Step-by-step best practices for sharing documents, tracking analytics, managing Spaces, collecting signatures, securing materials, and running bulk sends.",
  url: "https://docmetrics.io/blog/best-practices",
  step: [
    {
      "@type": "HowToSection",
      name: "Sharing Documents",
      itemListElement: [
        {
          "@type": "HowToStep",
          name: "Create a separate link for every recipient",
          text: "Generate a unique share link per recipient so you get individual tracking data for each person.",
        },
        {
          "@type": "HowToStep",
          name: "Write a message that tells the recipient exactly what to do",
          text: "State what the document is, why you are sending it, and what action you need in two to three sentences.",
        },
        {
          "@type": "HowToStep",
          name: "Set the right expiry for every document type",
          text: "Use 7 to 14 day expiry on proposals, 30 days on decision documents, and no expiry only for evergreen materials.",
        },
      ],
    },
    {
      "@type": "HowToSection",
      name: "Analytics",
      itemListElement: [
        {
          "@type": "HowToStep",
          name: "Check the page breakdown before every follow-up call",
          text: "Review which pages had the highest reading time before calling so you know exactly what to lead with.",
        },
        {
          "@type": "HowToStep",
          name: "Use return visits as your strongest buying signal",
          text: "Treat any prospect with three or more visits as a priority follow-up within the same day.",
        },
        {
          "@type": "HowToStep",
          name: "Compare engagement across links to find your best performing content",
          text: "Review analytics monthly and look for patterns in which pages consistently lose attention.",
        },
      ],
    },
    {
      "@type": "HowToSection",
      name: "Spaces",
      itemListElement: [
        {
          "@type": "HowToStep",
          name: "Create one Space per client or deal",
          text: "Create a new Space the moment you begin working with a new client and set up folder structure before inviting anyone.",
        },
        {
          "@type": "HowToStep",
          name: "Use role-based access to control what each person sees",
          text: "Assign Viewer role to most external contacts by default and use folder-level permissions for sensitive materials.",
        },
        {
          "@type": "HowToStep",
          name: "Require an NDA before anyone enters a Space with sensitive materials",
          text: "Attach your NDA to any Space containing confidential materials before inviting anyone.",
        },
      ],
    },
    {
      "@type": "HowToSection",
      name: "Signatures",
      itemListElement: [
        {
          "@type": "HowToStep",
          name: "Place signature fields after the pages that matter most",
          text: "Place signature fields immediately after the final terms or key conditions, not on page one.",
        },
        {
          "@type": "HowToStep",
          name: "Use sequential signing order when one signature depends on another",
          text: "Enable sequential signing any time one signature logically follows another in your approval process.",
        },
        {
          "@type": "HowToStep",
          name: "Check the signing analytics before sending a reminder",
          text: "Check whether the recipient opened the request before sending a reminder — it tells you whether to email or call.",
        },
      ],
    },
    {
      "@type": "HowToSection",
      name: "Security",
      itemListElement: [
        {
          "@type": "HowToStep",
          name: "Use email verification on every link sent to a named individual",
          text: "Enable email verification on any link sent directly to a named client, investor, or prospect.",
        },
        {
          "@type": "HowToStep",
          name: "Enable dynamic watermarking on confidential documents",
          text: "Enable dynamic watermarking on any document containing financial projections, legal terms, or proprietary information.",
        },
        {
          "@type": "HowToStep",
          name: "Audit your active links regularly and revoke anything no longer needed",
          text: "Set a recurring reminder to review active links once a month and revoke anything attached to closed deals.",
        },
      ],
    },
    {
      "@type": "HowToSection",
      name: "Bulk Sending",
      itemListElement: [
        {
          "@type": "HowToStep",
          name: "Validate and preview your CSV before sending to hundreds of recipients",
          text: "Send a test batch of five recipients first and preview the document for a sample of recipients before sending to your full list.",
        },
        {
          "@type": "HowToStep",
          name: "Segment your recipient list so you can follow up meaningfully",
          text: "After 48 to 72 hours review engagement scores and write different follow-ups for high, low, and zero engagement recipients.",
        },
        {
          "@type": "HowToStep",
          name: "Use CC recipients on bulk sends for deals that require oversight",
          text: "Add your manager or legal contact as a CC recipient on any bulk send involving contracts or legally binding documents.",
        },
      ],
    },
  ],
}

// ── PAGE ──────────────────────────────────────────────────────
export default function BestPracticesPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* ── HERO ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
            Best Practices
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
            Get more out of{" "}
            <span className="text-sky-600">every document you share.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
            Practical guidance on how to use DocMetrics effectively — from
            setting up your first share link to running a bulk send campaign
            to thousands of recipients.
          </p>
          <Button
            size="lg"
            className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-6 text-base rounded-xl shadow-md hover:shadow-lg transition-all gap-2"
            asChild
          >
            <Link href="/signup">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-xs text-slate-400 mt-3">No credit card required</p>
        </div>
      </div>

      {/* ✅ Only this part is client-side */}
      <BestPracticesContent />

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Ready to put this into practice?
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Everything covered in this guide is available inside DocMetrics
            today. Upload your first document and start applying these
            practices in under two minutes.
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
              
              href="https://docmetrics-documentation.gitbook.io/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Read the documentation
            </Link>
          </div>
          <p className="text-xs text-white/60 mt-5">No credit card required</p>
        </div>
      </div>

    </div>
  )
}