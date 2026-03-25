// app/about/page.tsx
// ✅ Already a Server Component — just adding metadata and JSON-LD
import type { Metadata } from "next";
import React, { JSX } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "About DocMetrics — Document Intelligence for Modern Teams",
  description:
    "DocMetrics turns static documents into live data sources. Know who read your proposals, which pages held their attention, and exactly when to follow up. Built for sales teams, founders, and professionals.",
  alternates: {
    canonical: "https://docmetrics.io/about",
  },
  openGraph: {
    title: "About DocMetrics — Document Intelligence for Modern Teams",
    description:
      "DocMetrics turns static documents into live data sources. Know who read your proposals, which pages held their attention, and exactly when to follow up.",
    url: "https://docmetrics.io/about",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "About DocMetrics — Document Intelligence Platform",
      },
    ],
  },
};

// ── JSON-LD ───────────────────────────────────────────────────
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DocMetrics",
  url: "https://docmetrics.io",
  logo: "https://docmetrics.io/logo.png",
  description:
    "DocMetrics is a document intelligence platform that gives sales teams, founders, recruiters, and professionals real-time visibility into how their documents are read, shared, and acted upon.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@docmetrics.io",
    contactType: "customer support",
  },
  sameAs: [],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can recipients tell they are being tracked?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Recipients receive a normal document viewing experience. There is no software to install and no visible indication that engagement is being measured. Senders always know what is tracked — recipients experience a clean, seamless viewing flow.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. DocMetrics has a free plan that lets you upload documents, create share links, and see basic analytics with no credit card required. Paid plans unlock unlimited documents, advanced analytics, Spaces, e-signatures, and more.",
      },
    },
    {
      "@type": "Question",
      name: "How is my document data protected?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All data is encrypted in transit using HTTPS and TLS. Documents are stored securely and access is controlled by the permissions you set. You can revoke access to any document or link at any time.",
      },
    },
    {
      "@type": "Question",
      name: "Can I export my data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can export analytics reports and audit logs as CSV at any time from your dashboard. Your documents and data belong to you.",
      },
    },
    {
      "@type": "Question",
      name: "Does DocMetrics comply with GDPR?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. DocMetrics is designed with GDPR compliance in mind. We collect the minimum data necessary to provide the Service, support data export and deletion on request, and process personal data only as described in our Privacy Policy.",
      },
    },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About DocMetrics",
  url: "https://docmetrics.io/about",
  description:
    "Learn about DocMetrics — our mission, vision, principles, and the team behind the document intelligence platform.",
  publisher: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
  },
};

// ── PAGE ──────────────────────────────────────────────────────
export default function AboutPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      {/* ── HERO ── */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
            About
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
            We built DocMetrics because documents should not be invisible
            after you send them.
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl">
            DocMetrics is a document intelligence platform that gives sales
            teams, founders, recruiters, and professionals real-time
            visibility into how their documents are read, shared, and acted
            upon.
          </p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">

          {/* Mission */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Our Mission
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We exist to make documents actionable. Every day, professionals
              send proposals, pitch decks, contracts, and reports — and then
              have no idea what happens next. DocMetrics turns those static
              files into live data sources so you know who read them, which
              pages held their attention, and exactly when to follow up.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              We believe that the intelligence gap between sending a document
              and closing a deal is one of the most solvable problems in
              business. DocMetrics closes that gap.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Vision */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Our Vision
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              To be the standard platform for document intelligence — where
              every professional has real-time insight into how their
              information is consumed and acted upon.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              We envision a future where every shared document is a
              measurable channel for learning, conversion, and continuous
              improvement — not an email attachment that disappears into
              silence.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* What DocMetrics does */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              What DocMetrics Does
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  title: "Document Tracking",
                  description:
                    "Know the instant someone opens your document. See their name, location, device, and time of visit. Track every return visit and get notified when a prospect is reading right now.",
                },
                {
                  title: "Page-by-Page Analytics",
                  description:
                    "A bar chart shows exactly how long each visitor spent on every page. See which sections drove decisions and which pages were skipped entirely.",
                },
                {
                  title: "Secure Sharing",
                  description:
                    "Password protection, email verification, domain restriction, expiry dates, download blocking, and dynamic watermarking — full control over every document you share.",
                },
                {
                  title: "Data Rooms",
                  description:
                    "Create a branded Space for every client or deal. Organize documents into folders, assign role-based access, require NDA signatures, and track every interaction across every document inside.",
                },
                {
                  title: "E-Signatures",
                  description:
                    "Send documents for signature directly from DocMetrics. Place fields, set signing order, and track exactly how long each recipient spent reading before they signed.",
                },
                {
                  title: "Bulk Send",
                  description:
                    "Send personalised documents to hundreds of recipients at once. Each person gets a unique tracked link and their own engagement score.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-slate-200 rounded-xl p-5"
                >
                  <div className="h-1.5 w-6 rounded-full bg-sky-400 mb-4" />
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

          <div className="border-t border-slate-100" />

          {/* Who it is for */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Who DocMetrics Is For
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              DocMetrics is built for anyone who shares documents as part of
              their work and needs to know what happens after they hit send.
            </p>
            <div className="space-y-3">
              {[
                {
                  audience: "Sales teams",
                  use: "track proposals, score leads, and follow up at exactly the right moment",
                },
                {
                  audience: "Founders raising capital",
                  use: "know which investors are serious about their pitch deck and which slides drive the most attention",
                },
                {
                  audience: "Freelancers and consultants",
                  use: "send professional client portals, get contracts signed, and collect files without email back and forth",
                },
                {
                  audience: "Real estate professionals",
                  use: "organize deal documents in secure data rooms, require NDAs, and track every party's engagement",
                },
                {
                  audience: "Recruiters",
                  use: "share candidate profiles with hiring managers and send offer letters for signature with full visibility",
                },
              ].map((item) => (
                <div
                  key={item.audience}
                  className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>
                    <span className="font-semibold text-slate-900">
                      {item.audience}
                    </span>{" "}
                    — {item.use}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Values */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              Our Principles
            </h2>
            <div className="space-y-6">
              {[
                {
                  title: "Privacy by Design",
                  description:
                    "We collect the minimum data necessary to provide insights. Tracking is transparent — recipients are never deceived and senders always know what is being measured. We follow GDPR best practices and support data export and deletion on request.",
                },
                {
                  title: "Simplicity Over Complexity",
                  description:
                    "Powerful analytics should not require a data team to interpret. Every metric in DocMetrics is designed to produce a clear, actionable next step — not noise.",
                },
                {
                  title: "Security at Every Layer",
                  description:
                    "All data in transit is encrypted using HTTPS and TLS. Document access is controlled by the sender at every step — password protection, domain restriction, NDA gating, and audit logs give you a complete record of who accessed what and when.",
                },
                {
                  title: "Built for Real Work",
                  description:
                    "Every feature in DocMetrics exists because real professionals needed it. We build based on what our users actually do, not what looks impressive on a feature list.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <p className="text-sm font-semibold text-slate-900 mb-1.5">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Why we built it */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Why We Built DocMetrics
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              The problem DocMetrics solves is simple but expensive. Every
              day, professionals send documents that represent real business
              opportunities — proposals that could close deals, pitch decks
              that could secure funding, contracts that could start
              relationships — and they have no visibility into what happens
              next.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              The existing tools were either too basic — simple link tracking
              with no depth — or too expensive and complex for anyone outside
              a large enterprise. DocMetrics was built to sit in between.
              Powerful enough to replace multiple tools. Simple enough to use
              on day one. Priced so that individuals and small teams can
              actually afford it.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              We are building DocMetrics for the professionals who move fast,
              work globally, and need their tools to work as hard as they do.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Security */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Security and Trust
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              All documents uploaded to DocMetrics are encrypted in transit
              and at rest. Access controls are enforced at every layer — from
              individual link settings to folder-level permissions inside
              data rooms. Every action taken inside a Space is recorded in a
              tamper-evident audit log.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              We do not sell your data or your documents to third parties. We
              use your data only to provide and improve the Service. You
              retain full ownership of everything you upload and can export
              or delete your data at any time.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              Common Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "Can recipients tell they are being tracked?",
                  a: "Recipients receive a normal document viewing experience. There is no software to install and no visible indication that engagement is being measured. Senders always know what is tracked — recipients experience a clean, seamless viewing flow.",
                },
                {
                  q: "Is there a free plan?",
                  a: "Yes. DocMetrics has a free plan that lets you upload documents, create share links, and see basic analytics with no credit card required. Paid plans unlock unlimited documents, advanced analytics, Spaces, e-signatures, and more.",
                },
                {
                  q: "How is my document data protected?",
                  a: "All data is encrypted in transit using HTTPS and TLS. Documents are stored securely and access is controlled by the permissions you set. You can revoke access to any document or link at any time.",
                },
                {
                  q: "Can I export my data?",
                  a: "Yes. You can export analytics reports and audit logs as CSV at any time from your dashboard. Your documents and data belong to you.",
                },
                {
                  q: "Does DocMetrics comply with GDPR?",
                  a: "Yes. DocMetrics is designed with GDPR compliance in mind. We collect the minimum data necessary to provide the Service, support data export and deletion on request, and process personal data only as described in our Privacy Policy.",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="border border-slate-200 rounded-xl p-5"
                >
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    {item.q}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* CTA */}
          <div className="rounded-2xl bg-sky-600 px-8 py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
              Start tracking your documents today.
            </h2>
            <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
              Upload your first document and see real engagement data in
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
                href="/contact"
                className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                Contact us
              </Link>
            </div>
            <p className="text-xs text-white/60 mt-5">
              No credit card required
            </p>
          </div>

        </div>
      </div>

      {/* Footer line */}
      <div className="border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} DocMetrics — Document intelligence
            for modern teams.
          </p>
        </div>
      </div>

    </div>
  );
}