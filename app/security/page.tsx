import React, { JSX } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function SecurityPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
            Security
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
            How DocMetrics protects your documents and data.
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl">
            You are trusting us with sensitive business documents — proposals,
            contracts, financial models, and confidential deal materials.
            This page explains exactly how we protect them.
          </p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">

          {/* Encryption */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Encryption
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              All data transmitted between your browser and our servers is
              encrypted using TLS — the same standard used by banks and
              financial institutions. This ensures your documents and analytics
              data cannot be intercepted during transmission.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              All documents and user data stored on our servers are encrypted
              at rest using AES-256 encryption. Your files are encrypted before
              being written to storage and remain encrypted until retrieved for
              authorised access.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              Document metadata and analytics data are encrypted throughout
              their entire lifecycle — from upload to storage to retrieval.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Document Privacy */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Document Privacy
            </h2>
            <div className="bg-slate-50 border-l-4 border-sky-400 p-4 rounded mb-5">
              <p className="text-sm font-semibold text-slate-900">
                Your documents are private. We do not read them.
              </p>
            </div>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              DocMetrics does not access, read, or use the content of your
              documents for any purpose other than providing the Service. Your
              documents are processed automatically to generate page counts,
              thumbnails, and PDF rendering — this is technical processing only.
              No human on our team reads your documents.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              The only exceptions are when you explicitly grant us access for
              support purposes, or when we are legally required to produce
              information by a valid court order or law enforcement request.
              In the latter case we will notify you before complying unless
              legally prohibited from doing so.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              All internal access to user data is logged with the reason for
              access and the identity of the person who accessed it. This log
              is auditable.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Access Controls */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Access Controls
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-6">
              DocMetrics is built on the principle that access to sensitive
              documents should always be the minimum necessary and always
              revocable. Every sharing feature in the product reflects this.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Password Protection",
                  description:
                    "Require recipients to enter a password before they can view any document or Space.",
                },
                {
                  title: "Email Verification",
                  description:
                    "Require recipients to verify their email address before accessing a shared link so you always know who is viewing.",
                },
                {
                  title: "Domain Restriction",
                  description:
                    "Restrict access to specific email addresses or company domains so only the right people can open your documents.",
                },
                {
                  title: "Link Expiry",
                  description:
                    "Set an expiry date on any share link so access is automatically revoked after a specified period.",
                },
                {
                  title: "Download Blocking",
                  description:
                    "Prevent recipients from downloading documents while still allowing full viewing access.",
                },
                {
                  title: "Dynamic Watermarking",
                  description:
                    "Embed the viewer's email address visibly on every page to deter unauthorised sharing and provide traceability.",
                },
                {
                  title: "NDA Gating",
                  description:
                    "Require recipients to sign a confidentiality agreement before they can access any documents inside a Space.",
                },
                {
                  title: "Instant Revocation",
                  description:
                    "Revoke access to any document or share link instantly from your dashboard at any time.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-slate-200 rounded-xl p-5"
                >
                  <div className="h-1.5 w-6 rounded-full bg-sky-400 mb-3" />
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

          {/* Authentication */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Account Security
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              User passwords are hashed using industry-standard algorithms
              with per-user salts. We never store passwords in plain text.
              Our authentication system is protected against brute-force
              attacks with rate limiting and account lockout mechanisms.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We support two-factor authentication using time-based one-time
              passwords. We strongly recommend enabling 2FA on your account.
              Sessions are managed with cryptographically secure tokens and
              expire automatically after periods of inactivity. You can revoke
              active sessions at any time from your account settings.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              Our application is designed and regularly reviewed to protect
              against common security vulnerabilities including SQL injection,
              cross-site scripting, and cross-site request forgery.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Data Rooms */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Data Room Security
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Every Space in DocMetrics has its own security layer independent
              of the documents inside it. You control who enters, what they
              see, and what they can do once inside.
            </p>
            <div className="space-y-3">
              {[
                "Role-based access — Admin, Member, and Viewer roles with different permission levels",
                "Folder-level permissions — restrict specific folders to specific people within the same Space",
                "NDA requirement — require a signed confidentiality agreement before anyone enters",
                "Full audit log — every document opened, every page viewed, every file downloaded, timestamped and attributed to a named individual",
                "Q&A isolation — questions asked inside a Space are visible only to the parties you specify",
                "Invite-only access — Spaces are private by default and accessible only to people you explicitly invite",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Payments */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Payment Security
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              DocMetrics does not store credit card numbers, CVV codes, or
              any sensitive payment information on our servers. All payment
              processing is handled by our payment processor which is PCI DSS
              compliant. We receive only a tokenised reference to your payment
              method — never the raw card details.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* GDPR */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              GDPR and Data Protection
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              DocMetrics is designed with GDPR compliance as a core
              requirement rather than an afterthought. We collect the minimum
              data necessary to provide the Service, retain it only as long
              as needed, and support data subject rights including access,
              deletion, and portability.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              For international data transfers we implement appropriate
              safeguards including Standard Contractual Clauses approved by
              the European Commission where required. All third-party
              processors who handle user data on our behalf are required to
              sign data processing agreements.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              In the event of a data breach that affects your personal
              information, we will notify you within 72 hours as required
              by GDPR and provide details about what happened, what data was
              affected, and the steps we are taking to address it.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Data Retention */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Data Retention and Deletion
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Your documents and analytics data are retained for as long as
              your account is active. You can delete individual documents and
              their associated analytics from your dashboard at any time.
              Deletion is permanent and cannot be undone.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              If you close your account, we will delete your documents and
              personal data within 90 days unless we are required to retain
              information for legal or compliance purposes. You can export
              your documents and analytics data at any time before closing
              your account.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              When data is deleted it is permanently removed from our
              production systems using secure deletion methods that prevent
              recovery.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Third parties */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Third-Party Service Providers
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              DocMetrics uses trusted third-party service providers to
              operate parts of the Service including cloud storage, payment
              processing, and email delivery. All providers are carefully
              vetted and are required to sign data processing agreements
              committing them to appropriate security standards.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              We maintain a list of our active subprocessors and notify
              customers of any material changes. You can request the current
              subprocessor list by contacting us at{" "}
              
               <a href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>
              .
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Best practices for users */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              What You Can Do to Protect Your Account
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-5">
              Security is a shared responsibility. While DocMetrics
              implements robust protection at the platform level, these
              practices on your end significantly reduce risk.
            </p>
            <div className="space-y-3">
              {[
                "Enable two-factor authentication on your account — this is the single most effective step you can take",
                "Use a strong unique password for your DocMetrics account and store it in a password manager",
                "Keep your browser and operating system updated to protect against known vulnerabilities",
                "Use password protection and expiry dates on all share links sent to external recipients",
                "Revoke access to documents and Spaces as soon as they are no longer needed",
                "Review your active sessions regularly in account settings and revoke any you do not recognise",
                "Enable email verification on links sent to named individuals so you always know who is viewing",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Responsible disclosure */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Responsible Disclosure
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We welcome reports of potential security vulnerabilities from
              the security research community. If you believe you have
              discovered a security issue in DocMetrics, please report it
              responsibly by emailing{" "}
              
              <a  href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>{" "}
              with a detailed description of the vulnerability and steps to
              reproduce it.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Please do not publicly disclose the vulnerability until we have
              had an opportunity to investigate and address it. We will
              acknowledge your report within 48 hours and provide an initial
              assessment within 5 business days.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              We recognise security researchers who report valid
              vulnerabilities and will acknowledge your contribution on our
              security page with your permission.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Contact */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Contact Our Security Team
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              For security-related enquiries, vulnerability reports, or
              questions about how we protect your data, contact us at{" "}
              
              <a  href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>
              . We aim to respond to all security enquiries within 3
              business days.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              For general privacy questions or data requests please see our{" "}
              <Link
                href="/privacy"
                className="text-sky-600 hover:underline font-medium"
              >
                Privacy Policy
              </Link>
              . For general support please visit our{" "}
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
              Have a security question?
            </h2>
            <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
              We are transparent about how we protect your data and happy
              to answer any questions before you sign up.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              
             <a   href="mailto:support@docmetrics.io"
                className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm"
              >
                Email Security Team
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                Start for free
              </Link>
            </div>
            <p className="text-xs text-white/60 mt-5">No credit card required</p>
          </div>

        </div>
      </div>

      {/* Footer line */}
      <div className="border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-slate-400">
            Last updated: March 21, 2026
          </p>
        </div>
      </div>

    </div>
  )
}