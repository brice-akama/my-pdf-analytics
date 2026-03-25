// app/cookies/components/CookieAccordion.tsx
"use client"

import { useState } from "react"

const COOKIE_TYPES = [
  {
    name: "Essential Cookies",
    required: true,
    description:
      "These cookies are necessary for DocMetrics to function. They enable core functionality such as security, authentication, session management, and accessibility. The Service cannot function properly without these cookies and they cannot be disabled.",
    examples: [
      { name: "session_token", purpose: "Keeps you logged in during your session", duration: "Session" },
      { name: "csrf_token", purpose: "Protects against cross-site request forgery attacks", duration: "Session" },
      { name: "auth_state", purpose: "Maintains your authentication state across page loads", duration: "30 days" },
    ],
  },
  {
    name: "Functional Cookies",
    required: false,
    description:
      "These cookies remember your preferences and settings to enhance your experience. They are not strictly necessary but improve how the Service works for you personally.",
    examples: [
      { name: "ui_preferences", purpose: "Remembers your display preferences such as sidebar state and theme", duration: "1 year" },
      { name: "language", purpose: "Remembers your language preference", duration: "1 year" },
      { name: "last_workspace", purpose: "Remembers which workspace you last had open", duration: "30 days" },
    ],
  },
  {
    name: "Analytics Cookies",
    required: false,
    description:
      "These cookies help us understand how the Service is used so we can improve it. They collect information about which pages are visited, which features are used, and how long users spend on different parts of the product. All data collected by analytics cookies is aggregated and anonymous.",
    examples: [
      { name: "_analytics_id", purpose: "Assigns an anonymous identifier to track usage patterns", duration: "1 year" },
      { name: "_session_id", purpose: "Groups page views into sessions for analytics purposes", duration: "Session" },
    ],
  },
]

export function CookieAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <div className="space-y-4">
      {COOKIE_TYPES.map((type, index) => (
        <div key={type.name} className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle(index)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-6 rounded-full bg-sky-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-900">{type.name}</span>
              {type.required ? (
                <span className="text-xs font-semibold text-sky-600 px-2 py-0.5 bg-sky-50 rounded-full">Always Active</span>
              ) : (
                <span className="text-xs font-medium text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">Optional</span>
              )}
            </div>
            <svg
              className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${openIndex === index ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openIndex === index && (
            <div className="px-5 pb-5 border-t border-slate-100">
              <p className="text-sm text-slate-500 leading-relaxed mt-4 mb-5">{type.description}</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
                  <div className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Cookie</div>
                  <div className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Purpose</div>
                  <div className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Duration</div>
                </div>
                {type.examples.map((example, i) => (
                  <div key={example.name} className={`grid grid-cols-3 ${i !== type.examples.length - 1 ? "border-b border-slate-100" : ""}`}>
                    <div className="px-4 py-3">
                      <code className="text-xs font-mono text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">{example.name}</code>
                    </div>
                    <div className="px-4 py-3 text-xs text-slate-500 leading-relaxed">{example.purpose}</div>
                    <div className="px-4 py-3 text-xs text-slate-500">{example.duration}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}