"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Plus, Minus } from "lucide-react"

const FAQS = [
  {
    question: "How quickly will you respond to my message?",
    answer:
      "We respond to all support enquiries within one business day. For billing and account issues we aim to respond within a few hours during business hours.",
  },
  {
    question: "I found a bug — how do I report it?",
    answer:
      "Use the contact form and select Bug Report as the subject. Describe what you were doing when the bug occurred, what you expected to happen, and what actually happened. Screenshots are very helpful.",
  },
  {
    question: "I have a feature request — where do I send it?",
    answer:
      "Use the contact form and select Feature Request. We read every request and use them to prioritise our roadmap. The more detail you provide about your use case the more helpful it is.",
  },
  {
    question: "I need help with my account or billing — who do I contact?",
    answer:
      "Email billing@docmetrics.io directly or use the contact form and select Billing as the subject. Include your account email so we can look up your account quickly.",
  },
  {
    question: "I am a journalist or researcher — who should I contact?",
    answer:
      "Email hello@docmetrics.io with details about your publication and what you are working on. We are happy to speak with journalists and researchers covering document analytics or SaaS.",
  },
]

function FAQItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: { question: string; answer: string }
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-6 py-5 text-left group"
      >
        <span
          className={`text-base font-medium transition-colors duration-150 ${
            isOpen
              ? "text-[#0284c7]"
              : "text-slate-900 group-hover:text-[#0284c7]"
          }`}
        >
          {faq.question}
        </span>
        <span
          className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-full border transition-all duration-200 ${
            isOpen
              ? "bg-[#0ea5e9] border-[#0ea5e9] text-white"
              : "border-slate-300 text-slate-400 group-hover:border-[#0ea5e9] group-hover:text-[#0ea5e9]"
          }`}
        >
          {isOpen ? (
            <Minus className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? 400 : 0 }}
      >
        <p className="pb-5 text-sm sm:text-base text-slate-500 leading-relaxed max-w-2xl">
          {faq.answer}
        </p>
      </div>
    </div>
  )
}

export default function ContactPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setError("Please fill in all fields before sending.")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setSubmitted(true)
        setFormData({ name: "", email: "", subject: "", message: "" })
      } else {
        setError(
          "Something went wrong sending your message. Please try again or email us directly."
        )
      }
    } catch {
      setError(
        "Something went wrong sending your message. Please try again or email us directly."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
            Contact
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
            We would love to hear from you.
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl">
            Whether you have a question about the product, need help with
            your account, or want to share feedback — send us a message
            and we will get back to you within one business day.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-12 gap-12">

          {/* ── LEFT: Form ── */}
          <div className="lg:col-span-7">

            {submitted ? (
              <div className="border border-slate-200 rounded-2xl p-10 text-center">
                <div className="h-14 w-14 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-5">
                  <svg
                    className="h-7 w-7 text-sky-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Message sent
                </h3>
                <p className="text-base text-slate-500 leading-relaxed mb-6">
                  Thank you for reaching out. We will get back to you at{" "}
                  <span className="font-medium text-slate-700">
                    {formData.email || "your email address"}
                  </span>{" "}
                  within one business day.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  Send another message
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Jane Smith"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="jane@company.com"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="General Question">General Question</option>
                    <option value="Technical Support">
                      Technical Support
                    </option>
                    <option value="Billing">Billing</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Security">Security</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Describe your question or issue in as much detail as possible..."
                    rows={6}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 leading-relaxed">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  By sending this message you agree to our{" "}
                  <Link
                    href="/privacy"
                    className="text-sky-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            )}
          </div>

          {/* ── RIGHT: Contact info + hours ── */}
          <div className="lg:col-span-5 space-y-6">

            {/* Response time */}
            <div className="border border-slate-200 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Response Times
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: "General Support",
                    time: "Within 1 business day",
                    dot: "bg-green-400",
                  },
                  {
                    label: "Technical Issues",
                    time: "Within 1 business day",
                    dot: "bg-green-400",
                  },
                  {
                    label: "Billing Questions",
                    time: "Within a few hours",
                    dot: "bg-sky-400",
                  },
                  {
                    label: "Security Reports",
                    time: "Within 48 hours",
                    dot: "bg-amber-400",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-2 w-2 rounded-full flex-shrink-0 ${item.dot}`}
                      />
                      <span className="text-sm text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Email addresses */}
            <div className="border border-slate-200 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Direct Email
              </p>
              <div className="space-y-4">
                {[
                  {
                    department: "General Support",
                    email: "support@docmetrics.io",
                    description: "Questions, help, and account issues",
                  },
                  {
                    department: "Billing",
                    email: "billing@docmetrics.io",
                    description: "Subscriptions, invoices, and payments",
                  },
                  {
                    department: "Security",
                    email: "security@docmetrics.io",
                    description: "Vulnerability reports and security concerns",
                  },
                  {
                    department: "Privacy",
                    email: "privacy@docmetrics.io",
                    description: "Data requests and privacy questions",
                  },
                  {
                    department: "General",
                    email: "hello@docmetrics.io",
                    description: "Partnerships and press enquiries",
                  },
                ].map((item) => (
                  <div key={item.department}>
                    <p className="text-xs font-semibold text-slate-500 mb-0.5">
                      {item.department}
                    </p>
                    
                  <a    href={`mailto:${item.email}`}
                      className="text-sm font-medium text-sky-600 hover:underline"
                    >
                      {item.email}
                    </a>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Help center link */}
            <div className="border border-slate-200 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Self-Service
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Many questions can be answered instantly in our Help Center
                or full documentation without waiting for a reply.
              </p>
              <div className="space-y-2">
                <Link
                  href="/help"
                  className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    Help Center
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                </Link>
                
              <a    href="https://docmetrics-documentation.gitbook.io/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    Full Documentation
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mt-20">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Before You Write
            </p>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Common questions
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              Check if your question is already answered here before
              sending a message.
            </p>
          </div>
          <div className="divide-y divide-slate-200 border-t border-slate-200 max-w-3xl">
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}