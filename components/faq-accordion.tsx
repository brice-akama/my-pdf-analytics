"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

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

export function FAQAccordion({
  faqs,
  defaultOpen = 0,
}: {
  faqs: { question: string; answer: string }[]
  defaultOpen?: number | null
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <div className="divide-y divide-slate-200 border-t border-slate-200">
      {faqs.map((faq, i) => (
        <FAQItem
          key={i}
          faq={faq}
          isOpen={openIndex === i}
          onToggle={() => toggle(i)}
        />
      ))}
    </div>
  )
}