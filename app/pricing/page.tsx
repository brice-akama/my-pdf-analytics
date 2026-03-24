
// app/pricing/page.tsx
//  Server Component — Google indexes all content
//  PricingContent isolated as its own client component
import type { Metadata } from "next"
import { JSX } from "react"
import { PricingContent } from "@/components/pricing-content"

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Pricing — Simple Plans for Every Team",
  description:
    "Start free and scale as you grow. DocMetrics plans from $0 to $99/month — document tracking, e-signatures, secure data rooms, and bulk send included.",
  alternates: {
    canonical: "https://docmetrics.io/pricing",
  },
  openGraph: {
    title: "DocMetrics Pricing — Simple Plans. No Surprises.",
    description:
      "Start free and scale as you grow. Every plan includes document analytics, share links, and e-signatures. Upgrade when you need more.",
    url: "https://docmetrics.io/pricing",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocMetrics Pricing Plans",
      },
    ],
  },
}

// ── JSON-LD ───────────────────────────────────────────────────
const productSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocMetrics",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://docmetrics.io",
  description:
    "Document tracking, analytics, e-signatures, secure data rooms, and bulk send — for teams that close deals with documents.",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "5 documents, 3 share links, basic analytics, 1 Space, 2 eSignatures per month.",
      url: "https://docmetrics.io/signup",
    },
    {
      "@type": "Offer",
      name: "Starter",
      price: "19",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "19",
        priceCurrency: "USD",
        unitText: "MONTH",
      },
      description: "Unlimited documents, unlimited share links, full analytics, 3 Spaces, 10 eSignatures, video walkthroughs, custom branding.",
      url: "https://docmetrics.io/signup",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "49",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "49",
        priceCurrency: "USD",
        unitText: "MONTH",
      },
      description: "3 users, unlimited Spaces, unlimited eSignatures, bulk send, NDA and agreements, dynamic watermarking, compliance reports, version history, Google Drive and OneDrive.",
      url: "https://docmetrics.io/signup",
    },
    {
      "@type": "Offer",
      name: "Business",
      price: "99",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "99",
        priceCurrency: "USD",
        unitText: "MONTH",
      },
      description: "10 users, advanced data rooms, full audit logs, folder level permissions, advanced team management, custom docs domain, priority support.",
      url: "https://docmetrics.io/signup",
    },
  ],
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can I try DocMetrics for free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Free plan is free forever with no credit card required. You can upgrade anytime when you need more features.",
      },
    },
    {
      "@type": "Question",
      name: "What happens when my free trial ends?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You will be moved to the Free plan automatically. Your documents and data are kept safe. You can upgrade at any time.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. There are no long-term contracts. You can cancel your subscription at any time and you will not be charged again.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer refunds?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We offer a 14-day money-back guarantee on all paid plans. If you are not satisfied contact our support team.",
      },
    },
    {
      "@type": "Question",
      name: "Can I change my plan later?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can upgrade or downgrade your plan at any time from your account settings.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Your documents are encrypted in transit and at rest. You retain full ownership of everything you upload and can revoke access at any time.",
      },
    },
  ],
}

// ── PAGE ──────────────────────────────────────────────────────
export default function PricingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ── Hero ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-4">
          Pricing
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
          Simple pricing.{" "}
          <span className="text-indigo-600">No surprises.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10">
          Start free and scale as you grow. Every plan includes the core
          features you need to track, share, and close deals faster.
        </p>
      </div>

      {/* ✅ Only this part is client-side */}
      <PricingContent />

    </div>
  )
}