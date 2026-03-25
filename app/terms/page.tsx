
// app/terms/page.tsx
//  Server Component — removed "use client" (zero interactivity)
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Terms of Service — DocMetrics",
  description:
    "Read the DocMetrics Terms of Service covering account registration, acceptable use, payment terms, data retention, intellectual property, and dispute resolution.",
  alternates: {
    canonical: "https://docmetrics.io/terms",
  },
  openGraph: {
    title: "Terms of Service — DocMetrics",
    description:
      "Read the DocMetrics Terms of Service covering account registration, acceptable use, payment terms, and dispute resolution.",
    url: "https://docmetrics.io/terms",
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
const termsPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "DocMetrics Terms of Service",
  url: "https://docmetrics.io/terms",
  description:
    "Terms of Service for DocMetrics document analytics and management platform.",
  dateModified: "2026-03-21",
  publisher: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
  },
};

// ── PAGE ──────────────────────────────────────────────────────
export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsPageSchema) }}
      />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div>

          {/* Title */}
          <div className="mb-8 pb-6 border-b border-slate-200">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-base text-slate-500">
              Last updated: March 21, 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6 text-slate-700 leading-relaxed">

            <p>
              Please read these Terms of Service carefully before using
              DocMetrics. By accessing or using our service, you agree to be
              bound by these terms. If you disagree with any part of these
              terms, you may not access the service.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account or using DocMetrics ("Service"), you agree
              to be bound by these Terms of Service ("Terms"). These Terms apply
              to all users of the Service, including without limitation users
              who are browsers, vendors, customers, merchants, and contributors
              of content.
            </p>
            <p>
              If you are using the Service on behalf of an organisation, you are
              agreeing to these Terms for that organisation and representing that
              you have the authority to bind that organisation to these Terms. In
              that case, "you" and "your" will refer to that organisation.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              2. Description of Service
            </h2>
            <p>
              DocMetrics provides a document analytics and management platform
              that allows users to upload, store, and share PDF documents
              securely; track document views, downloads, and engagement metrics;
              create data rooms for secure document collaboration; manage
              electronic signature workflows; request and receive files from
              third parties; and generate analytics and insights on document
              performance.
            </p>
            <p>
              We reserve the right to modify, suspend, or discontinue any part
              of the Service at any time, with or without notice. We will not be
              liable to you or any third party for any modification, suspension,
              or discontinuance of the Service.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              3. Account Registration
            </h2>
            <p>
              To use certain features of the Service, you must register for an
              account. When you register, you agree to provide accurate, current,
              and complete information; maintain and promptly update your account
              information; maintain the security of your password and account;
              accept responsibility for all activities that occur under your
              account; and notify us immediately of any unauthorised use of your
              account.
            </p>
            <p>
              You must be at least 18 years old to create an account. We reserve
              the right to refuse service, terminate accounts, or remove content
              at our sole discretion.
            </p>
            <p className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-amber-900">
              <strong>Important:</strong> You are responsible for maintaining
              the confidentiality of your account credentials. DocMetrics will
              not be liable for any loss or damage arising from your failure to
              protect your account information.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              4. Acceptable Use
            </h2>
            <p>
              You agree not to use the Service to violate any applicable laws or
              regulations; infringe upon or violate intellectual property rights
              of others; upload malicious code, viruses, or harmful software;
              harass, abuse, or harm another person or entity; impersonate any
              person or entity; interfere with or disrupt the Service or servers;
              attempt to gain unauthorised access to the Service; use automated
              systems to access the Service without permission; share or
              distribute illegal, obscene, or harmful content; or resell or
              commercially exploit the Service without authorisation.
            </p>
            <p>
              We reserve the right to investigate and take appropriate legal
              action against anyone who violates these provisions, including
              removing content and terminating accounts.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              5. Content and Intellectual Property
            </h2>
            <p>
              You retain all rights to the content you upload to DocMetrics
              ("Your Content"). By uploading content, you grant us a limited
              licence to store, process, and display Your Content as necessary
              to provide the Service; create derivative works such as thumbnails
              or analytics to operate the Service; and share Your Content with
              other users when you explicitly authorise such sharing.
            </p>
            <p>
              The Service and its original content, features, and functionality
              are owned by DocMetrics and are protected by international
              copyright, trademark, patent, trade secret, and other intellectual
              property laws.
            </p>
            <p>
              Any feedback, comments, or suggestions you provide about the
              Service will be owned by DocMetrics. We may use such feedback for
              any purpose without obligation to you.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              6. Payment Terms
            </h2>
            <p>
              Certain features of the Service are available only through paid
              subscriptions. By purchasing a paid plan, you agree to pay all
              applicable fees and taxes. Subscription fees are billed in advance
              on a monthly or annual basis. All fees are non-refundable except
              as required by applicable law. Prices are subject to change with
              30 days notice. Failure to pay may result in suspension or
              termination of your account.
            </p>
            <p>
              You may cancel your subscription at any time. Cancellation will
              take effect at the end of your current billing period. You will
              continue to have access to paid features until the end of your
              billing period.
            </p>
            <p className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-blue-900">
              <strong>Automatic Renewal:</strong> Your subscription will
              automatically renew unless you cancel before the renewal date. You
              authorise us to charge your payment method for renewal fees.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              7. Data and Privacy
            </h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy,
              which is incorporated into these Terms by reference. By using the
              Service you consent to the collection and use of your information
              as described in our Privacy Policy.
            </p>
            <p>
              DocMetrics processes personal data in accordance with applicable
              data protection laws including the General Data Protection
              Regulation (GDPR) where applicable. We implement appropriate
              technical and organisational measures to protect your data against
              unauthorised access, loss, or destruction.
            </p>
            <p>
              We use third party service providers to operate the Service,
              including cloud storage, payment processing, and email delivery.
              These providers are contractually obligated to protect your data
              and may only use it to provide services to DocMetrics.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              8. Data Retention
            </h2>
            <p>
              We retain your data for as long as your account is active or as
              needed to provide the Service. If you terminate your account, we
              will delete your data within 90 days unless we are required to
              retain it by law. We recommend you export or download any
              important data before terminating your account as we cannot
              guarantee recovery after deletion.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              9. Termination
            </h2>
            <p>
              We may terminate or suspend your account and access to the Service
              immediately, without prior notice, for any reason including breach
              of these Terms, fraudulent or illegal activity, extended period of
              inactivity, or request by law enforcement or a government agency.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately
              cease. You may terminate your account at any time through your
              account settings. All provisions of these Terms that should
              reasonably survive termination will survive.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              10. Limitation of Liability
            </h2>
            <p className="font-semibold text-slate-900 uppercase text-sm tracking-wide">
              Please read this section carefully
            </p>
            <p>
              To the maximum extent permitted by applicable law, DocMetrics
              shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, or any loss of profits or
              revenues, whether incurred directly or indirectly, or any loss of
              data, use, goodwill, or other intangible losses.
            </p>
            <p>
              In no event shall DocMetrics aggregate liability exceed the amount
              you paid to DocMetrics in the twelve months preceding the event
              giving rise to liability, or one hundred US dollars ($100),
              whichever is greater.
            </p>
            <p>
              The Service is provided "as is" and "as available" without
              warranties of any kind, either express or implied. DocMetrics
              disclaims all warranties including but not limited to implied
              warranties of merchantability, fitness for a particular purpose,
              and non-infringement.
            </p>
            <p>
              You agree to indemnify, defend, and hold harmless DocMetrics and
              its officers, directors, employees, and agents from any claims,
              liabilities, damages, losses, and expenses arising out of or in
              any way connected with your access to or use of the Service or
              Your Content.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              11. Dispute Resolution
            </h2>
            <p>
              Any disputes arising from these Terms or the Service will first be
              attempted to be resolved through good faith negotiation between the
              parties. If a dispute cannot be resolved informally within 30 days,
              either party may pursue resolution through the courts of competent
              jurisdiction in accordance with applicable law.
            </p>
            <p>
              These Terms shall be governed by and construed in accordance with
              applicable international law and the laws of the jurisdiction in
              which DocMetrics operates, without regard to conflict of law
              provisions.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              12. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. If we make
              material changes, we will notify you by posting the updated Terms
              on this page, updating the last updated date, and sending an email
              to your registered email address.
            </p>
            <p>
              Your continued use of the Service after such modifications
              constitutes your acceptance of the updated Terms. If you do not
              agree to the modified Terms, you must stop using the Service. We
              encourage you to review these Terms periodically.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              13. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms please contact us at{" "}
              <a
                href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>
              . For general support enquiries please visit our{" "}
              <Link
                href="/contact"
                className="text-sky-600 hover:underline font-medium"
              >
                contact page
              </Link>
              .
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              14. Miscellaneous
            </h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the
              remaining provisions will continue in full force and effect. No
              waiver of any term of these Terms shall be deemed a further or
              continuing waiver of such term or any other term. These Terms
              constitute the entire agreement between you and DocMetrics
              regarding the Service and supersede all prior agreements and
              understandings.
            </p>

          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-400">
              Version 1.0 — Last updated: March 21, 2026
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}