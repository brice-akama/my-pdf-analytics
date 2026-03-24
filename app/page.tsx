import type { Metadata } from "next";
import { AnimatedFeaturesSection } from "@/components/animated-features-section";
import { HeroSection } from "@/components/hero-section";
import { SocialProofSection } from "@/components/social-proof-section";
import { FeatureBentoSection } from "@/components/feature-bento-section";
import { VideoShowcaseSection } from "@/components/video-showcase-section";
import { FAQSection } from "@/components/faq-section";

// ── HOMEPAGE METADATA ─────────────────────────────────────────
export const metadata: Metadata = {
  title: "Stop Guessing. Know Exactly When Deals Move",
  description:
    "Document sharing with analytics — see who opened, read, and spent time on your docs. Track every view and follow up at the perfect moment.",
  alternates: {
    canonical: "https://docmetrics.io",
  },
  openGraph: {
    title: "DocMetrics — Know Exactly When Deals Move",
    description:
      "Document sharing with analytics — see who opened, read, and spent time on your docs. Track every view and follow up at the perfect moment.",
    url: "https://docmetrics.io",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",       // you will create this — see note below
        width: 1200,
        height: 630,
        alt: "DocMetrics — Document Analytics for Sales Teams",
      },
    ],
  },
};

// ── JSON-LD: Organization ─────────────────────────────────────
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DocMetrics",
  url: "https://docmetrics.io",
  logo: "https://docmetrics.io/logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@docmetrics.io",
    contactType: "customer support",
  },
};

// ── JSON-LD: SoftwareApplication ──────────────────────────────
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocMetrics",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Document sharing with analytics — see who opened, read, and spent time on your docs. Track every view and follow up at the perfect moment.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free trial available — no credit card required",
  },
};

// ── JSON-LD: FAQPage ──────────────────────────────────────────
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is this different from DocuSign or PandaDoc?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DocuSign and PandaDoc handle signatures. We handle everything that happens before the signature — who read your document, which pages they spent time on, and whether they actually understood it. We do signatures too, but the intelligence layer is what sets us apart.",
      },
    },
    {
      "@type": "Question",
      name: "Do my recipients need to create an account to view documents?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Anyone you share a link with can open and view the document instantly — no sign-up, no login, no friction. You track everything on your end while they experience a seamless viewing flow.",
      },
    },
    {
      "@type": "Question",
      name: "How do I know when someone opens my document?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The moment a recipient opens your document you receive a real-time notification by email, in-app, and in Slack if connected. Your dashboard updates instantly showing who opened it, which pages they read, how long they spent on each page, and exactly where they stopped.",
      },
    },
    {
      "@type": "Question",
      name: "Can I control who has access to my documents?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every share link can be password protected, restricted to specific emails or domains, set to expire after a date or number of views, and configured to block downloads or forwarding.",
      },
    },
    {
      "@type": "Question",
      name: "Can I collect e-signatures and track reading at the same time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every signature request tracks page-by-page reading time, video walkthrough completion, and page clarity reactions — so you know exactly how much the signer understood before they signed or declined.",
      },
    },
    {
      "@type": "Question",
      name: "Is my document data secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All documents are encrypted in transit and at rest. Share links support NDA gating, so recipients must sign a confidentiality agreement before they can view anything. You retain full ownership of everything you upload and can revoke access at any time.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use this for investor fundraising?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Share your pitch deck and see which slides held attention, who spent the most time on financials, and whether they forwarded it to a partner. The deal intent question at the end tells you exactly where each investor stands.",
      },
    },
    {
      "@type": "Question",
      name: "Does it work with Google Drive or OneDrive?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can import documents directly from Google Drive and OneDrive into your documents or spaces without downloading and re-uploading.",
      },
    },
  ],
};

// ── PAGE ──────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      {/* Page Content */}
      <div className="bg-gradient-to-br from-white via-indigo-50 to-indigo-100 -mt-16 pt-16">
        <HeroSection />
      </div>
      <SocialProofSection />
      <AnimatedFeaturesSection />
      <FeatureBentoSection />
      <VideoShowcaseSection />
      <FAQSection />
    </>
  );
}
