// app/privacy/page.tsx
// ✅ Server Component — removed "use client" (zero interactivity)
// ✅ Legal pages should be indexable but with low priority
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ── METADATA ──────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Privacy Policy — How DocMetrics Handles Your Data",
  description:
    "DocMetrics is committed to protecting your privacy. Read our full privacy policy covering data collection, usage, GDPR compliance, your rights, and how to contact us.",
  alternates: {
    canonical: "https://docmetrics.io/privacy",
  },
  openGraph: {
    title: "Privacy Policy — DocMetrics",
    description:
      "Read the DocMetrics privacy policy covering data collection, GDPR compliance, your rights, and how to contact our privacy team.",
    url: "https://docmetrics.io/privacy",
    siteName: "DocMetrics",
    type: "website",
    locale: "en_US",
  },
  // Legal pages should be indexed but not followed aggressively
  robots: {
    index: true,
    follow: false,
  },
};

// ── JSON-LD ───────────────────────────────────────────────────
const privacyPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "DocMetrics Privacy Policy",
  url: "https://docmetrics.io/privacy",
  description:
    "DocMetrics privacy policy covering data collection, usage, GDPR compliance, and user rights.",
  dateModified: "2026-03-21",
  publisher: {
    "@type": "Organization",
    name: "DocMetrics",
    url: "https://docmetrics.io",
  },
};

// ── PAGE ──────────────────────────────────────────────────────
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyPageSchema) }}
      />

      {/* ── HERO ── */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-4">
            Privacy Policy
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
            DocMetrics ("we", "us", or "our") respects your privacy and is
            committed to protecting your personal data. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our service. Please read this policy
            carefully. By using DocMetrics, you agree to the collection and
            use of information in accordance with this policy.
          </p>

          {/* 1 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              1. Information We Collect
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We collect information that you provide directly to us when you
              create an account or use the Service, including your name, email
              address, company name, and job title; profile information such
              as a profile photo and contact preferences; payment information
              which is processed securely by our third-party payment processor
              and never stored directly by us; PDF documents and related
              metadata you upload to the platform; and messages, feedback, and
              support requests you send us.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              When you use the Service we also automatically collect usage
              data including pages viewed, features used, time spent, and
              click patterns; device information including IP address, browser
              type, operating system, and device identifiers; approximate
              location data based on your IP address; session data,
              preferences, and authentication tokens via cookies; and document
              engagement metrics including views, downloads, and time spent
              per page.
            </p>
            <div className="bg-slate-50 border-l-4 border-sky-400 p-4 rounded">
              <p className="text-sm text-slate-700">
                <strong>Document Privacy:</strong> The documents you upload
                are encrypted and private. We do not access, read, or use
                your document content for any purpose other than providing
                the Service. Your documents belong to you.
              </p>
            </div>
          </div>

          {/* 2 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We use the information we collect to provide and operate the
              Service — creating and managing your account, processing and
              storing your documents, enabling document sharing and
              collaboration, generating analytics and insights, and providing
              customer support.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We also use your information to improve the Service by analysing
              usage patterns, developing new features, fixing bugs, and
              optimising performance; to communicate with you including
              sending service announcements, responding to enquiries, sending
              marketing communications with your consent, and notifying you
              about document activity; and for security and fraud prevention
              including detecting and preventing fraudulent activity,
              monitoring for suspicious behaviour, enforcing our Terms of
              Service, and complying with legal obligations.
            </p>
          </div>

          {/* 3 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              3. Document Tracking and Recipient Data
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              DocMetrics enables users ("senders") to share documents with
              third parties ("recipients") and track how those recipients
              engage with shared content. When a recipient accesses a
              document shared through DocMetrics, we collect engagement data
              on behalf of the sender including the time the document was
              opened, the device and approximate location of the viewer, time
              spent on each page, and whether the document was downloaded.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Where a sender requires email verification before a recipient
              can view a document, the recipient's email address is collected
              and associated with their engagement data. This data is made
              available to the sender through their DocMetrics dashboard.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Senders who use DocMetrics to share documents with their own
              clients, prospects, or contacts are responsible for ensuring
              they have the appropriate legal basis for sharing those
              individuals' engagement data. DocMetrics acts as a data
              processor on behalf of the sender in this context.
            </p>
            <div className="bg-slate-50 border-l-4 border-sky-400 p-4 rounded">
              <p className="text-sm text-slate-700">
                <strong>For recipients:</strong> If you have received a
                document link from a DocMetrics user and have questions about
                how your data is being used, please contact the person or
                organisation that sent you the link. You may also contact us
                at{" "}
                
                <a  href="mailto:support@docmetrics.io"
                  className="text-sky-600 hover:underline font-medium"
                >
                  support@docmetrics.io
                </a>{" "}
                and we will assist where we are able to.
              </p>
            </div>
          </div>

          {/* 4 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              4. How We Share Your Information
            </h2>
            <div className="bg-slate-50 border-l-4 border-sky-400 p-4 rounded mb-4">
              <p className="text-sm font-semibold text-slate-900">
                We do not sell your personal information to third parties.
              </p>
            </div>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We share your information with your consent when you explicitly
              share documents with other users or third parties and we share
              the information necessary to facilitate that sharing.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We share information with trusted third-party service providers
              who help us operate our business including cloud hosting
              providers, payment processors, email service providers, and
              security services. These providers are contractually obligated
              to protect your data and may only use it to provide services
              to DocMetrics.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We may disclose your information if required to do so by law or
              in response to valid legal requests from authorities. We may
              also disclose information to protect the rights, property, or
              safety of DocMetrics, our users, or others, or to prevent fraud
              or illegal activity.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              If DocMetrics is involved in a merger, acquisition, or sale of
              assets, your information may be transferred. We will notify you
              before your information becomes subject to a different privacy
              policy.
            </p>
          </div>

          {/* 5 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              5. Data Security
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your
              information including TLS encryption for all data in transit,
              encryption at rest for stored documents and personal data,
              multi-factor authentication support, role-based access control,
              regular access audits, and automated backups.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              While we implement robust security measures, no method of
              transmission over the internet or electronic storage is 100
              percent secure. We cannot guarantee absolute security of your
              information.
            </p>
            <div className="bg-slate-50 border-l-4 border-amber-400 p-4 rounded">
              <p className="text-sm text-slate-700">
                <strong>Data Breach Notification:</strong> In the event of a
                data breach that affects your personal information, we will
                notify you within 72 hours via email and provide details
                about what happened, what data was affected, and the steps
                we are taking to address it.
              </p>
            </div>
          </div>

          {/* 6 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              6. Data Retention
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We retain your personal data for as long as your account is
              active or as needed to provide the Service. If you terminate
              your account, we will delete your personal data within 90 days
              unless we are required to retain it by applicable law.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              Document engagement data generated by recipients viewing your
              shared documents is retained for the duration of your account.
              You can delete individual documents and their associated
              analytics from your dashboard at any time. We recommend
              exporting any data you wish to keep before closing your account
              as deletion is permanent and cannot be undone.
            </p>
          </div>

          {/* 7 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              7. Your Privacy Rights
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Depending on your location and applicable law, you may have the
              following rights regarding your personal information:
            </p>
            <div className="space-y-3">
              {[
                {
                  right: "Right to Access",
                  description:
                    "You can request a copy of the personal data we hold about you. We will provide this in a structured, commonly used format within 30 days.",
                },
                {
                  right: "Right to Rectification",
                  description:
                    "You can request correction of inaccurate or incomplete personal data. You can also update most information directly in your account settings.",
                },
                {
                  right: "Right to Deletion",
                  description:
                    "You can request deletion of your personal data. We will delete your data unless we have a legal obligation to retain it. Deletion is permanent and cannot be undone.",
                },
                {
                  right: "Right to Data Portability",
                  description:
                    "You can request your data in a machine-readable format. We provide export functionality in your account settings.",
                },
                {
                  right: "Right to Object",
                  description:
                    "You can object to processing of your personal data for direct marketing purposes. You can opt out of marketing emails at any time using the unsubscribe link in any email we send.",
                },
                {
                  right: "Right to Restrict Processing",
                  description:
                    "You can request restriction of processing in certain circumstances such as while we verify the accuracy of your data.",
                },
              ].map((item) => (
                <div
                  key={item.right}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <p className="text-sm font-semibold text-slate-900 mb-1">
                    {item.right}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-4">
              To exercise any of these rights contact us at{" "}
              
              <a  href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>{" "}
              or use the data controls in your account settings. We will
              respond to your request within 30 days and may need to verify
              your identity before processing it.
            </p>
          </div>

          {/* 8 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              8. Cookies and Tracking Technologies
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to operate and
              improve the Service. We use essential cookies that are necessary
              for the Service to function including security, authentication,
              and session management — these cannot be disabled. We use
              functional cookies that remember your preferences such as
              language and display settings. We use analytics cookies to
              understand how the Service is used so we can improve it.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              You can control non-essential cookies through your browser
              settings. Disabling certain cookies may affect your ability to
              use some features of the Service. Essential cookies cannot be
              disabled as they are required for the Service to function.
            </p>
          </div>

          {/* 9 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              9. International Data Transfers
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              DocMetrics operates globally and your data may be transferred
              to and stored in countries outside your own. When we transfer
              personal data internationally we ensure appropriate safeguards
              are in place in accordance with applicable data protection law
              including using Standard Contractual Clauses approved by the
              European Commission where required and ensuring all third-party
              processors sign data processing agreements.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              All data transfers use encryption in transit and at rest
              regardless of where the data is processed or stored.
            </p>
          </div>

          {/* 10 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              10. GDPR Compliance
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              For users in the European Economic Area, DocMetrics processes
              personal data under the following legal bases: performance of a
              contract when processing is necessary to provide the Service you
              have signed up for; legitimate interests for improving our
              Service, preventing fraud, and ensuring security; consent for
              marketing communications and non-essential cookies; and legal
              obligation where processing is required by applicable law.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              If you are located in the EEA and have concerns about how we
              process your personal data, you have the right to lodge a
              complaint with your local data protection authority.
            </p>
          </div>

          {/* 11 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              11. Children's Privacy
            </h2>
            <div className="bg-slate-50 border-l-4 border-red-400 p-4 rounded mb-4">
              <p className="text-sm font-semibold text-slate-900">
                Our Service is not intended for anyone under the age of 18.
              </p>
            </div>
            <p className="text-base text-slate-600 leading-relaxed">
              We do not knowingly collect personal information from anyone
              under 18 years of age. If you believe a child has provided
              personal information to us, please contact us immediately at{" "}
              
              <a  href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>{" "}
              and we will delete that information as quickly as possible.
            </p>
          </div>

          {/* 12 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              12. Changes to This Policy
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, or legal requirements. For
              material changes we will notify you at least 30 days in advance
              via email and display a prominent notice in the Service. For
              minor changes we will update the last updated date at the top
              of this policy.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              Your continued use of the Service after changes are posted
              constitutes your acceptance of the updated policy. We encourage
              you to review this policy periodically.
            </p>
          </div>

          {/* 13 */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              13. Contact Us
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us at{" "}
              
              <a  href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>
              . We aim to respond to all privacy enquiries within 3 business
              days. For complex requests such as data access or deletion we
              will respond within 30 days as required by applicable law.
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
              Have questions about your data?
            </h2>
            <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
              We are committed to being transparent about how we handle your
              information. Reach out and we will respond within 3 business
              days.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              
              <a
                href="mailto:support@docmetrics.io"
                className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm"
              >
                Email Privacy Team
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                Contact us
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