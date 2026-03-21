"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useState } from "react"

const COOKIE_TYPES = [
  {
    name: "Essential Cookies",
    required: true,
    description:
      "These cookies are necessary for DocMetrics to function. They enable core functionality such as security, authentication, session management, and accessibility. The Service cannot function properly without these cookies and they cannot be disabled.",
    examples: [
      {
        name: "session_token",
        purpose: "Keeps you logged in during your session",
        duration: "Session",
      },
      {
        name: "csrf_token",
        purpose: "Protects against cross-site request forgery attacks",
        duration: "Session",
      },
      {
        name: "auth_state",
        purpose: "Maintains your authentication state across page loads",
        duration: "30 days",
      },
    ],
  },
  {
    name: "Functional Cookies",
    required: false,
    description:
      "These cookies remember your preferences and settings to enhance your experience. They are not strictly necessary but improve how the Service works for you personally.",
    examples: [
      {
        name: "ui_preferences",
        purpose: "Remembers your display preferences such as sidebar state and theme",
        duration: "1 year",
      },
      {
        name: "language",
        purpose: "Remembers your language preference",
        duration: "1 year",
      },
      {
        name: "last_workspace",
        purpose: "Remembers which workspace you last had open",
        duration: "30 days",
      },
    ],
  },
  {
    name: "Analytics Cookies",
    required: false,
    description:
      "These cookies help us understand how the Service is used so we can improve it. They collect information about which pages are visited, which features are used, and how long users spend on different parts of the product. All data collected by analytics cookies is aggregated and anonymous.",
    examples: [
      {
        name: "_analytics_id",
        purpose: "Assigns an anonymous identifier to track usage patterns",
        duration: "1 year",
      },
      {
        name: "_session_id",
        purpose: "Groups page views into sessions for analytics purposes",
        duration: "Session",
      },
    ],
  },
]

export default function CookiesPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-4">
            Cookie Policy
          </h1>
          <p className="text-base text-slate-500">
            Last updated: March 21, 2026
          </p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">

          {/* Intro */}
          <div>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              DocMetrics uses cookies and similar technologies to operate and
              improve the Service. This Cookie Policy explains what cookies
              are, which ones we use, why we use them, and how you can control
              them.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              By continuing to use DocMetrics after seeing this notice, you
              consent to our use of cookies as described in this policy.
              Essential cookies are always active as the Service cannot
              function without them.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* What are cookies */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              What Are Cookies
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Cookies are small text files that are placed on your device
              when you visit a website or use a web application. They are
              widely used to make services work efficiently, remember your
              preferences, and provide information to the owners of the site.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Cookies can be session cookies which are deleted when you close
              your browser, or persistent cookies which remain on your device
              for a set period or until you delete them manually.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              We also use similar technologies such as local storage and
              session storage which function like cookies but are stored
              differently on your device. This policy covers all of these
              technologies collectively.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Cookie types */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Cookies We Use
            </h2>
            <div className="space-y-4">
              {COOKIE_TYPES.map((type, index) => (
                <div
                  key={type.name}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Header */}
                  <button
                    onClick={() => toggle(index)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-6 rounded-full bg-sky-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-slate-900">
                        {type.name}
                      </span>
                      {type.required && (
                        <span className="text-xs font-semibold text-sky-600 px-2 py-0.5 bg-sky-50 rounded-full">
                          Always Active
                        </span>
                      )}
                      {!type.required && (
                        <span className="text-xs font-medium text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">
                          Optional
                        </span>
                      )}
                    </div>
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Body */}
                  {openIndex === index && (
                    <div className="px-5 pb-5 border-t border-slate-100">
                      <p className="text-sm text-slate-500 leading-relaxed mt-4 mb-5">
                        {type.description}
                      </p>

                      {/* Examples table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
                          <div className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Cookie
                          </div>
                          <div className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Purpose
                          </div>
                          <div className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Duration
                          </div>
                        </div>
                        {type.examples.map((example, i) => (
                          <div
                            key={example.name}
                            className={`grid grid-cols-3 ${
                              i !== type.examples.length - 1
                                ? "border-b border-slate-100"
                                : ""
                            }`}
                          >
                            <div className="px-4 py-3">
                              <code className="text-xs font-mono text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                                {example.name}
                              </code>
                            </div>
                            <div className="px-4 py-3 text-xs text-slate-500 leading-relaxed">
                              {example.purpose}
                            </div>
                            <div className="px-4 py-3 text-xs text-slate-500">
                              {example.duration}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Third party cookies */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Third-Party Cookies
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Some cookies on DocMetrics are set by third-party service
              providers we use to operate the Service. These providers may
              set their own cookies on your device when you use DocMetrics.
              We only work with providers who have a legitimate need to set
              cookies and who are committed to protecting your privacy.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              Third-party cookies are governed by the privacy policies of
              those third parties. We do not control what those parties do
              with the information their cookies collect beyond what is
              covered by our data processing agreements with them.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* How to control */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              How to Control Cookies
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-5">
              You have several options for controlling how cookies are used
              on your device.
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Browser Settings",
                  description:
                    "Most browsers allow you to refuse or delete cookies through their settings. The process varies by browser — look for the privacy or security section in your browser's settings menu. Note that blocking all cookies will prevent DocMetrics from working correctly as essential cookies are required for authentication and security.",
                },
                {
                  title: "Account Settings",
                  description:
                    "You can manage your preferences for non-essential cookies directly in your DocMetrics account settings under Privacy. This allows you to opt out of functional and analytics cookies without affecting essential functionality.",
                },
                {
                  title: "Opt-Out of Analytics",
                  description:
                    "If you want to prevent analytics cookies from tracking your usage of the Service, you can disable analytics cookies in your account settings. This will not affect your ability to use any feature of DocMetrics.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-slate-200 rounded-xl p-5"
                >
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-slate-50 border-l-4 border-amber-400 p-4 rounded">
              <p className="text-sm text-slate-700">
                <strong>Important:</strong> Essential cookies cannot be
                disabled as they are required for the Service to function.
                Disabling them through your browser settings will prevent
                you from logging in and using DocMetrics.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Document tracking cookies */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Cookies in Shared Documents
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              When someone opens a document shared through DocMetrics, we
              use cookies and similar technologies to track engagement data
              on behalf of the sender. This includes tracking which pages
              were viewed, how long the viewer spent on each page, and
              whether the viewer returned to the document.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              This tracking is a core part of the Service and is what
              enables DocMetrics users to see analytics about their shared
              documents. If you have received a document link from a
              DocMetrics user, your engagement with that document is being
              tracked and the results are visible to the person who sent
              you the link.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              If you have questions about this tracking or wish to request
              deletion of your engagement data, please contact the person
              who sent you the document link directly, or contact us at{" "}
              
              <a  href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>
              .
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Changes */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Changes to This Policy
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              We may update this Cookie Policy from time to time to reflect
              changes in the cookies we use or for other operational, legal,
              or regulatory reasons. We will notify you of any material
              changes by updating the last updated date at the top of this
              page and where appropriate by sending you an email notification.
            </p>
            <p className="text-base text-slate-600 leading-relaxed">
              We encourage you to review this policy periodically to stay
              informed about how we use cookies.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Contact */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Contact Us
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              If you have any questions about our use of cookies please
              contact us at{" "}
              
              <a  href="mailto:support@docmetrics.io"
                className="text-sky-600 hover:underline font-medium"
              >
                support@docmetrics.io
              </a>
              . For broader privacy questions please see our{" "}
              <Link
                href="/privacy"
                className="text-sky-600 hover:underline font-medium"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl bg-sky-600 px-8 py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
              Questions about cookies or privacy?
            </h2>
            <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
              We are transparent about every technology we use. Reach out
              and we will respond within 3 business days.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              
           <a     href="mailto:support@docmetrics.io"
                className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm"
              >
                Contact Privacy Team
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                Read Privacy Policy
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
  )
}