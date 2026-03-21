"use client"

import Link from "next/link"
import { ArrowRight, Plus, Minus } from "lucide-react"
import { useState } from "react"

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
]

 const FAQS: { [key: string]: Array<{ question: string; answer: string }> } = {

  account: [
    {
      question: "How do I change my email address?",
      answer:
        "Go to Settings, click the Profile tab, and update your email address. You will receive a verification email to confirm the change before it takes effect.",
    },
    {
      question: "How do I enable two-factor authentication?",
      answer:
        "Go to Settings and click the Security tab. Click Enable Two-Factor Authentication and follow the steps to connect your authenticator app. We strongly recommend enabling this on all accounts.",
    },
    {
      question: "How do I cancel my subscription?",
      answer:
        "Go to Settings and click the Billing tab. Click Cancel Subscription and confirm. Your subscription will remain active until the end of your current billing period and you will not be charged again.",
    },
    {
      question: "Can I invite team members to my account?",
      answer:
        "Yes. Go to Settings and click the Team tab. Enter your team member's email address and assign them a role. They will receive an invitation email. Free accounts support up to 3 team members.",
    },
  ],
  documents: [
    {
      question: "What file types does DocMetrics support?",
      answer:
        "DocMetrics currently supports PDF files. This covers the majority of business documents including proposals, contracts, pitch decks, reports, and financial models.",
    },
    {
      question: "Is there a file size limit?",
      answer:
        "The maximum file size depends on your plan. Free accounts support files up to 10MB. Starter accounts support up to 100MB. Pro and Business accounts support up to 500MB per file.",
    },
    {
      question: "Can I replace a document without losing my analytics?",
      answer:
        "Yes. Use the Version History feature to upload a new version of any document. Your previous analytics are preserved and attached to the older version. The new version starts collecting fresh analytics immediately.",
    },
    {
      question: "How do I delete a document?",
      answer:
        "Open the document and click the three-dot menu in the top right. Click Delete. Deleting a document also deactivates all share links associated with it. This action cannot be undone.",
    },
  ],
  sharing: [
    {
      question: "How many share links can I create per document?",
      answer:
        "There is no limit on the number of share links you can create for a single document. Each link tracks engagement independently so you can create a separate link for every recipient if needed.",
    },
    {
      question: "Can I see who opened my document if I did not require email verification?",
      answer:
        "Without email verification you will see anonymous visit data — device type, location, and reading time — but not the name or email of the viewer. Enable email verification on any link to identify viewers individually.",
    },
    {
      question: "How do I disable a share link?",
      answer:
        "Open the document and go to the Activity tab. Find the share link you want to disable and toggle it off. The link will immediately stop working for anyone who tries to open it.",
    },
    {
      question: "Can I set a view limit on a share link?",
      answer:
        "Yes. When creating a share link, set the maximum number of views allowed. Once that limit is reached the link automatically deactivates. This is useful for sending to a specific number of recipients.",
    },
  ],
  signatures: [
    {
      question: "Are DocMetrics e-signatures legally binding?",
      answer:
        "Yes. DocMetrics e-signatures comply with major electronic signature laws including eIDAS in the European Union and ESIGN in the United States. Each signed document includes a certificate with timestamps, IP addresses, and a full audit trail.",
    },
    {
      question: "Can I send a document to multiple people for signature?",
      answer:
        "Yes. Add multiple recipients when setting up a signature request. You can set them to sign in any order or in a specific sequential order where each person is notified only after the previous person signs.",
    },
    {
      question: "How do I download a signed document?",
      answer:
        "Once all recipients have signed, go to the document's Signatures tab. A Download Signed PDF button will appear. The signed PDF includes all signatures and a certificate of completion.",
    },
    {
      question: "What happens if a recipient declines to sign?",
      answer:
        "You will receive a notification immediately. The Signatures tab will show the decline status and any reason the recipient provided. You can then reach out directly or send a revised document.",
    },
  ],
  spaces: [
    {
      question: "What is a Space?",
      answer:
        "A Space is a secure branded data room for one client, deal, or project. You organize documents into folders, invite people with role-based access, and track every interaction across every document inside. Think of it as a professional portal for each client relationship.",
    },
    {
      question: "Can I require an NDA before someone enters my Space?",
      answer:
        "Yes. Upload your NDA as a PDF when setting up or editing a Space and enable NDA gating. Anyone you invite must sign the NDA digitally before they can access any documents inside. Signatures are timestamped and stored automatically.",
    },
    {
      question: "How many Spaces can I create?",
      answer:
        "Free and Starter accounts can create up to 3 Spaces. Pro accounts can create unlimited Spaces. Business accounts can create unlimited Spaces with advanced data room features.",
    },
    {
      question: "Can different people inside a Space see different documents?",
      answer:
        "Yes. Use folder-level permissions to control which folders each person can access. A legal advisor can see the contracts folder while a financial partner sees only the financials folder — all inside the same Space.",
    },
  ],
}

const FAQ_CATEGORIES = [
  { id: "account", label: "Account and Billing" },
  { id: "documents", label: "Documents" },
  { id: "sharing", label: "Sharing and Links" },
  { id: "signatures", label: "E-Signatures" },
  { id: "spaces", label: "Spaces and Data Rooms" },
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

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState("account")
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <div className="min-h-screen bg-white">

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
    <a
      key={item.title}
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group border border-slate-200 rounded-xl p-5 hover:border-sky-200 hover:bg-sky-50 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
          
          <a  href="https://docmetrics-documentation.gitbook.io/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm flex-shrink-0"
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

          {/* Category tabs */}
          <div className="border-b border-slate-200 mb-8">
            <div className="flex items-center gap-1 overflow-x-auto pb-0 scrollbar-none">
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id)
                    setOpenIndex(null)
                  }}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeCategory === cat.id
                      ? "border-sky-600 text-sky-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ items */}
          <div className="divide-y divide-slate-200 border-t border-slate-200">
            {FAQS[activeCategory]?.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>
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
            
           <a   href="https://docmetrics-documentation.gitbook.io/docs"
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
  )
}