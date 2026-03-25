"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

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

export function HelpFAQ() {
  const [activeCategory, setActiveCategory] = useState("account")
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <div>
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
  )
}