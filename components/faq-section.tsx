"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

const FAQS = [
  {
    question: "How is this different from DocuSign or PandaDoc?",
answer: "DocuSign and PandaDoc focus on sending documents and collecting signatures. DocMetrics helps you understand what happens before the signature by showing document engagement, repeat visits, page-level activity, stakeholder involvement, and other measurable signals that help sales teams make better follow-up decisions.We do signatures too, but the intelligence layer is what sets us apart. You know exactly why someone signed, stalled, or declined.",
  },
  {
    question: "Do my recipients need to create an account to view documents?",
    answer:
      "No. Anyone you share a link with can open and view the document instantly — no sign-up, no login, no friction. You track everything on your end while they experience a seamless viewing flow.",
  },
  {
    question: "How do I know when someone opens my document?",
    answer:
      "When a recipient opens your document, you'll receive a real-time notification. Your dashboard shows when the document was viewed, which pages were visited, how long each page was viewed, and other engagement activity so you can decide the right next step.",
  },
  {
    question: "What is a Space or Data Room?",
    answer:
      "A Space is a secure branded environment where you organize multiple documents for one deal, client, or investor relationship. Visitors access everything through one link and you see every interaction across all documents inside — which files were opened, by whom, and for how long.",
  },
  {
    question: "Can I control who has access to my documents?",
    answer:
      "Yes. Every share link can be password protected, restricted to specific emails or domains, set to expire after a date or number of views, and configured to block downloads or forwarding. For Spaces, you assign role-based permissions so each person only sees what they are meant to see.",
  },
  {
    question: "What is the video walkthrough feature?",
    answer:
      "You can record a short video explanation for any page in your document — like a 45-second clip saying 'this clause just means X in plain English.' Prospects and signers see a floating bubble as they read and can watch your explanation without leaving the document. You then see exactly who watched, how much they completed, and whether they replayed it.",
  },
  {
    question: "Can I use this for investor fundraising?",
    answer:
      "Yes. Share your pitch deck and see which slides held attention, who spent the most time on financials, and whether they forwarded it to a partner. You can also ask investors a short feedback question at the end of the document to understand whether they're interested, need more information, or are still evaluating the opportunity.",
  },
  {
    question: "Does it work with Google Drive or OneDrive?",
    answer:
      "Yes. You can import documents directly from Google Drive and OneDrive into your documents or spaces without downloading and re-uploading. Changes you make to the original do not affect the tracked version.",
  },
  {
    question: "Can I collect e-signatures and track reading at the same time?",
    answer:
      "Yes. You can see how the signer engaged with the document before signing—including reading activity, page-level engagement, video walkthrough completion, and clarity feedback where available.If someone declines, you can see which page they were on and how long they spent before making that decision.",
  },
  {
    question: "Is my document data secure?",
    answer:
      "All documents are encrypted in transit and at rest. Share links support NDA gating, so recipients must sign a confidentiality agreement before they can view anything. You retain full ownership of everything you upload and can revoke access at any time.",
  },
]

function FAQItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: typeof FAQS[0]
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-6 py-5 text-left group"
      >
        <span className={`text-base font-medium transition-colors duration-150 ${isOpen ? "text-[#0284c7]" : "text-slate-900 group-hover:text-[#0284c7]"}`}>
          {faq.question}
        </span>
        <span className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-full border transition-all duration-200 ${
          isOpen
            ? "bg-[#0ea5e9] border-[#0ea5e9] text-white"
            : "border-slate-300 text-slate-400 group-hover:border-[#0ea5e9] group-hover:text-[#0ea5e9]"
        }`}>
          {isOpen
            ? <Minus className="h-3.5 w-3.5" />
            : <Plus  className="h-3.5 w-3.5" />
          }
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

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

        <div className="mb-12 text-center">
           
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-base text-slate-500">
            Everything you need to know about DocMetrics. Can't find the answer you're looking for?{" "}
            <a href="/contact" className="text-[#0284c7] hover:text-[#0369a1] font-medium transition-colors">
              Contact us
            </a>.
          </p>
        </div>

        <div className="divide-y divide-slate-200 border-t border-slate-200">
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
    </section>
  )
}