
// app/help/page.tsx
// ✅ Server Component — Google indexes all content
// ✅ HelpFAQ isolated as its own client component
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HelpFAQ } from "./help-faq";
 

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Help Center — DocMetrics Support and Guides",
  description:
    "Find answers to common questions about DocMetrics — document tracking, share links, e-signatures, Spaces, and account settings. Browse guides or contact support.",
  alternates: {
    canonical: "https://docmetrics.io/help",
  },
  openGraph: {
    title: "DocMetrics Help Center — Support and Guides",
    description:
      "Find answers to common questions about document tracking, share links, e-signatures, Spaces, and account settings.",
    url: "https://docmetrics.io/help",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocMetrics Help Center",
      },
    ],
  },
};

// ── JSON-LD ───────────────────────────────────────────────────
// All FAQ questions across all categories
// Google can show any of these as rich results in search
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    // Account
    {
      "@type": "Question",
      name: "How do I change my email address?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Go to Settings, click the Profile tab, and update your email address. You will receive a verification email to confirm the change before it takes effect.",
      },
    },
    {
      "@type": "Question",
      name: "How do I cancel my subscription?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Go to Settings and click the Billing tab. Click Cancel Subscription and confirm. Your subscription will remain active until the end of your current billing period and you will not be charged again.",
      },
    },
    {
      "@type": "Question",
      name: "Can I invite team members to my account?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Go to Settings and click the Team tab. Enter your team member's email address and assign them a role. They will receive an invitation email. Free accounts support up to 3 team members.",
      },
    },
    // Documents
    {
      "@type": "Question",
      name: "What file types does DocMetrics support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DocMetrics currently supports PDF files. This covers the majority of business documents including proposals, contracts, pitch decks, reports, and financial models.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a file size limit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The maximum file size depends on your plan. Free accounts support files up to 10MB. Starter accounts support up to 100MB. Pro and Business accounts support up to 500MB per file.",
      },
    },
    {
      "@type": "Question",
      name: "Can I replace a document without losing my analytics?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Use the Version History feature to upload a new version of any document. Your previous analytics are preserved and attached to the older version. The new version starts collecting fresh analytics immediately.",
      },
    },
    // Sharing
    {
      "@type": "Question",
      name: "How many share links can I create per document?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There is no limit on the number of share links you can create for a single document. Each link tracks engagement independently so you can create a separate link for every recipient if needed.",
      },
    },
    {
      "@type": "Question",
      name: "Can I see who opened my document if I did not require email verification?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Without email verification you will see anonymous visit data — device type, location, and reading time — but not the name or email of the viewer. Enable email verification on any link to identify viewers individually.",
      },
    },
    {
      "@type": "Question",
      name: "How do I disable a share link?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Open the document and go to the Activity tab. Find the share link you want to disable and toggle it off. The link will immediately stop working for anyone who tries to open it.",
      },
    },
    // Signatures
    {
      "@type": "Question",
      name: "Are DocMetrics e-signatures legally binding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. DocMetrics e-signatures comply with major electronic signature laws including eIDAS in the European Union and ESIGN in the United States. Each signed document includes a certificate with timestamps, IP addresses, and a full audit trail.",
      },
    },
    {
      "@type": "Question",
      name: "Can I send a document to multiple people for signature?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Add multiple recipients when setting up a signature request. You can set them to sign in any order or in a specific sequential order where each person is notified only after the previous person signs.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if a recipient declines to sign?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You will receive a notification immediately. The Signatures tab will show the decline status and any reason the recipient provided. You can then reach out directly or send a revised document.",
      },
    },
    // Spaces
    {
      "@type": "Question",
      name: "What is a Space?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Space is a secure branded data room for one client, deal, or project. You organize documents into folders, invite people with role-based access, and track every interaction across every document inside.",
      },
    },
    {
      "@type": "Question",
      name: "Can I require an NDA before someone enters my Space?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Upload your NDA as a PDF when setting up or editing a Space and enable NDA gating. Anyone you invite must sign the NDA digitally before they can access any documents inside. Signatures are timestamped and stored automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Can different people inside a Space see different documents?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Use folder-level permissions to control which folders each person can access. A legal advisor can see the contracts folder while a financial partner sees only the financials folder — all inside the same Space.",
      },
    },
  ],
};

const helpCenterSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "DocMetrics Help Center",
  url: "https://docmetrics.io/help",
  description:
    "Help center for DocMetrics — guides, FAQs, and support for document tracking, share links, e-signatures, and Spaces.",
  publisher: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
  },
};

// ── GETTING STARTED DATA ──────────────────────────────────────
const GETTING_STARTED = [
  {
    title: "Create your account",
    description:
      "Sign up with your email address or Google account. No credit card required. Your account is ready in under a minute.",
    link: "https://docmetrics-documentation.gitbook.io/docs",
    linkLabel: "Read guide",
  },
  {
    title: "Upload your first document",
    description:
      "Drag and drop any PDF into your dashboard. DocMetrics supports files up to 2GB. Your document is processed and ready to share in seconds.",
    link: "https://docmetrics-documentation.gitbook.io/docs",
    linkLabel: "Read guide",
  },
  {
    title: "Create your first share link",
    description:
      "Generate a tracked link for any document. Set a password, expiry date, or email verification before sharing. Each link tracks engagement independently.",
    link: "https://docmetrics-documentation.gitbook.io/docs",
    linkLabel: "Read guide",
  },
  {
    title: "Read your first analytics",
    description:
      "Open any document and go to the Performance tab. See who opened your document, how long they spent on each page, and whether they came back.",
    link: "https://docmetrics-documentation.gitbook.io/docs",
    linkLabel: "Read guide",
  },
  {
    title: "Send your first signature request",
    description:
      "Open a document and click Send for Signature. Add recipients, place signature fields, and send. Track every step of the signing process in real time.",
    link: "https://docmetrics-documentation.gitbook.io/docs",
    linkLabel: "Read guide",
  },
  {
    title: "Create your first Space",
    description:
      "Go to Spaces and click New Space. Add your branding, create folders, invite your client, and start tracking every document inside.",
    link: "https://docmetrics-documentation.gitbook.io/docs",
    linkLabel: "Read guide",
  },
];

// ── PAGE ──────────────────────────────────────────────────────
export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(helpCenterSchema) }}
      />

      {/* ── HERO ── */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
            Help Center
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
            How can we help you?
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl mb-8">
            Find answers to common questions, read our getting started
            guides, or browse the full documentation. If you cannot find
            what you need, our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            
          <a    href="https://docmetrics-documentation.gitbook.io/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Browse Full Documentation
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 font-medium px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-20">

        {/* ── GETTING STARTED ── */}
        <div>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Getting Started
            </p>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              New to DocMetrics?
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              Follow these guides in order and you will have DocMetrics
              fully set up and your first document tracked in under ten
              minutes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {GETTING_STARTED.map((item, index) => (
              
           <a     key={item.title}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-slate-200 rounded-xl p-5 hover:border-sky-200 hover:bg-sky-50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 mb-1.5 group-hover:text-sky-600 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed mb-3">
                      {item.description}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600">
                      {item.linkLabel}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── DOCUMENTATION LINK ── */}
        <div className="border border-slate-200 rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Full Documentation
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Need more detail on any feature?
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md">
              Our full documentation covers every feature of DocMetrics in
              detail — from setting up Spaces to using bulk send to reading
              compliance reports.
            </p>
          </div>
          
        <a    href="https://docmetrics-documentation.gitbook.io/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shrink-0"
          >
            Open Documentation
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* ── FAQ ── */}
        <div>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              FAQ
            </p>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              Browse common questions by topic. Cannot find your answer?{" "}
              <Link
                href="/contact"
                className="text-sky-600 hover:underline font-medium"
              >
                Contact our support team
              </Link>
              .
            </p>
          </div>

          {/*  Only this part is client-side */}
          <HelpFAQ />
        </div>

        {/* ── CONTACT SUPPORT CTA ── */}
        <div className="rounded-2xl bg-sky-600 px-8 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Still need help?
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Our support team typically responds within one business day.
            Describe your issue and we will help you resolve it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm"
            >
              Contact Support
              <ArrowRight className="h-4 w-4" />
            </Link>
            
            <a  href="https://docmetrics-documentation.gitbook.io/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Browse Documentation
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}