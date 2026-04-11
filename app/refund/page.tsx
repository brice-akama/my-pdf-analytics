// app/refund/page.tsx
//  Server Component — no interactivity needed
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Refund Policy — DocMetrics",
  description:
    "DocMetrics refund policy. Learn about our 14-day refund guarantee, how to request a refund, and our subscription cancellation process.",
  alternates: {
    canonical: "https://docmetrics.io/refund",
  },
  openGraph: {
    title: "Refund Policy — DocMetrics",
    description:
      "DocMetrics refund policy covering our 14-day refund guarantee, cancellation terms, and how to contact our support team.",
    url: "https://docmetrics.io/refund",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: false,
  },
};

// ── JSON-LD ───────────────────────────────────────────────────
const refundPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "DocMetrics Refund Policy",
  url: "https://docmetrics.io/refund",
  description:
    "DocMetrics refund policy covering our 14-day refund guarantee, subscription cancellations, and how to request a refund.",
  dateModified: "2026-03-21",
  publisher: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
  },
};

// ── PAGE ──────────────────────────────────────────────────────
export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(refundPageSchema) }}
      />

      {/* ── HERO ── */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-4">
            Refund Policy
          </h1>
          <p className="text-base text-slate-500">
            Last updated: March 21, 2026
          </p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-10 text-slate-700 leading-relaxed">

          <p className="text-base text-slate-600 leading-relaxed">
            At DocMetrics, we stand behind the quality of our platform. If you
            are not satisfied with your subscription, we want to make it right.
            This Refund Policy explains your options and how to request a
            refund. By using DocMetrics, you agree to the terms outlined below.
          </p>

          {/* 1 — Free Trial */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              1. Free Trial
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              DocMetrics offers a free plan that allows you to explore core
              features with no credit card required. We strongly encourage you
              to use the free plan to evaluate DocMetrics before upgrading to a
              paid subscription.
            </p>
            <div className="bg-slate-50 border-l-4 border-sky-400 p-4 rounded">
              <p className="text-sm text-slate-700">
                <strong>No risk:</strong> You can use DocMetrics for free
                indefinitely. Upgrade only when you are confident the platform
                meets your needs.
              </p>
            </div>
          </div>

          {/* 2 — 14-Day Refund Guarantee */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              2. 14-Day Refund Guarantee
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              If you upgrade to a paid plan and are not satisfied, you may
              request a full refund within <strong>14 days</strong> of your
              initial payment. No questions asked.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: "Who is eligible",
                  description:
                    "Any new paid subscriber who requests a refund within 14 days of their first payment on that plan.",
                },
                {
                  title: "What is covered",
                  description:
                    "The initial subscription payment for the plan you upgraded to. The 14-day window starts from the date of that payment.",
                },
                {
                  title: "What is not covered",
                  description:
                    "Renewal payments after the first billing cycle, payments made outside the 14-day window, and accounts found to be in violation of our Terms of Service.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <p className="text-sm font-semibold text-slate-900 mb-1">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3 — How to Request */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              3. How to Request a Refund
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              To request a refund, contact our support team at{" "}
              <a
                href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>{" "}
              within 14 days of your payment. Please include the following in
              your email:
            </p>
            <div className="space-y-3">
              {[
                "The email address associated with your DocMetrics account",
                "The date of your payment",
                "A brief reason for your refund request (optional but helpful)",
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-base text-slate-600 leading-relaxed mt-4">
              We will process your refund within <strong>5 business days</strong>{" "}
              of receiving your request. Refunds are returned to the original
              payment method used at checkout.
            </p>
            <div className="bg-slate-50 border-l-4 border-sky-400 p-4 rounded mt-4">
              <p className="text-sm text-slate-700">
                <strong>Processing time:</strong> Once approved, refunds
                typically appear on your statement within 5 to 10 business
                days depending on your bank or payment provider.
              </p>
            </div>
          </div>

          {/* 4 — Subscription Cancellations */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              4. Subscription Cancellations
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              You may cancel your DocMetrics subscription at any time directly
              from your account settings. There are no cancellation fees and no
              long-term commitments.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: "When cancellation takes effect",
                  description:
                    "Cancellations take effect at the end of your current billing period. You will retain full access to your plan until that date.",
                },
                {
                  title: "After cancellation",
                  description:
                    "Your account will revert to the free plan. Your documents and data will remain accessible. No data is deleted automatically on cancellation.",
                },
                {
                  title: "Renewal charges",
                  description:
                    "If you cancel before your renewal date, you will not be charged for the next billing cycle. We recommend cancelling at least 24 hours before your renewal date to avoid being charged.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <p className="text-sm font-semibold text-slate-900 mb-1">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 5 — Exceptions */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              5. Exceptions
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We reserve the right to decline refund requests in the following
              circumstances:
            </p>
            <div className="space-y-3">
              {[
                "The refund request is made more than 14 days after the payment date.",
                "The account has been found to violate our Terms of Service or Acceptable Use Policy.",
                "The request is for a renewal payment where the subscription was not cancelled before the renewal date.",
                "Refunds have already been issued for a previous subscription period on the same account.",
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 border-l-4 border-amber-400 p-4 rounded mt-4">
              <p className="text-sm text-slate-700">
                <strong>Special circumstances:</strong> We review all refund
                requests individually. If you have an exceptional situation not
                covered by this policy, please contact us and we will do our
                best to find a fair resolution.
              </p>
            </div>
          </div>

          {/* 6 — Annual Plans */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              6. Annual Plans
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Annual subscriptions are eligible for a full refund within the
              14-day window from the date of purchase. After 14 days, annual
              plans are non-refundable but you may cancel at any time to
              prevent future renewal charges.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              If you switch from an annual plan to a monthly plan, the
              difference in price is not refundable. We recommend contacting
              our support team before making plan changes if you have questions
              about billing.
            </p>
          </div>

          {/* 7 — Contact */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              7. Contact Us
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              If you have any questions about this Refund Policy or need help
              with a refund request, please contact us at{" "}
              <a
                href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>
              . We aim to respond to all billing enquiries within 1 business
              day.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              For general support enquiries please visit our{" "}
              <Link
                href="/contact"
                className="text-sky-600 hover:underline font-medium"
              >
                contact page
              </Link>
              .
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl bg-sky-600 px-8 py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
              Need help with a refund?
            </h2>
            <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
              Our support team is here to help. Reach out and we will respond
              within 1 business day.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="mailto:support@docmetrics.io"
                className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm"
              >
                Contact Support
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                Visit Help Centre
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Footer line */}
      <div className="border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-slate-400">
            Version 1.0 — Last updated: March 21, 2026
          </p>
        </div>
      </div>

    </div>
  );
}