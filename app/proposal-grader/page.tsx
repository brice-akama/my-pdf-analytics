import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SalesProposalGrader from "./SalesProposalGrader";

export const metadata: Metadata = {
  title: "Sales Proposal Grader — Score Your Proposal Process in 2 Minutes",
  description:
    "Answer 5 questions and get an instant score on your sales proposal process. Find out where deals are slipping through the cracks and what to fix first.",
  alternates: {
    canonical: "https://docmetrics.io/proposal-grader",
  },
  openGraph: {
    title: "Sales Proposal Grader — How Strong Is Your Process?",
    description:
      "5 questions. Instant score. Find out why proposals go silent and what to do about it.",
    url: "https://docmetrics.io/proposal-grader",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-grader.png",
        width: 1200,
        height: 630,
        alt: "Sales Proposal Grader by DocMetrics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sales Proposal Grader — Score Your Process in 2 Minutes",
    description:
      "5 questions. Instant score. Find out why proposals go silent and what to do about it.",
    images: ["/og-grader.png"],
  },
  keywords: [
    "sales proposal grader",
    "proposal process assessment",
    "sales proposal score",
    "how to improve sales proposals",
    "proposal follow up",
    "document engagement tracking",
    "sales process audit",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  name: "Sales Proposal Grader",
  description:
    "A 5-question assessment that scores your sales proposal process and identifies exactly where deals are slipping through.",
  url: "https://docmetrics.io/proposal-grader",
  provider: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
  },
  educationalUse: "Self-assessment",
  typicalAgeRange: "18-",
  about: {
    "@type": "Thing",
    name: "Sales proposals and document engagement",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        }
      >
        <SalesProposalGrader />
      </Suspense>
    </>
  );
}