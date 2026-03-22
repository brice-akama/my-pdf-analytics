"use client"
import { JSX, useState } from "react"
import Link from "next/link"
import { ArrowRight, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const FAQS = [
  {
    question: "Will investors know they are being tracked?",
    answer:
      "Investors receive a completely normal document viewing experience. There is no software to install and no indication that their engagement is being measured. They simply open and read your pitch deck as they normally would.",
  },
  {
    question: "Can I track the same deck sent to multiple investors?",
    answer:
      "Yes. Each investor gets their own unique link so DocMetrics tracks each person individually. You see exactly who opened what, when they opened it, how long they spent on each page, and whether they forwarded it to a partner.",
  },
  {
    question: "How do I protect confidential financial information?",
    answer:
      "Every share link supports password protection, email verification, domain restrictions, expiry dates, and download blocking. For due diligence materials you can require investors to sign an NDA before they can access anything inside your data room.",
  },
  {
    question: "What is a Space and how does it help with fundraising?",
    answer:
      "A Space is a secure branded data room where you organize all your deal documents in one place — financials, legal, pitch materials, and cap table. Investors access everything through one link and you see every interaction across every document inside.",
  },
  {
    question: "Can I see which slides investors spend the most time on?",
    answer:
      "Yes. DocMetrics tracks time spent on every page of your pitch deck. If an investor spends four minutes on your financials but skips the team slide, you know exactly what to address on your follow-up call.",
  },
  {
    question: "What happens when an investor forwards my deck to a partner?",
    answer:
      "DocMetrics detects when your document is accessed by someone beyond the original recipient and notifies you. You can see the full chain of sharing and revoke access at any time if needed.",
  },
  {
    question: "Can I use DocMetrics for both the pitch deck and due diligence?",
    answer:
      "Yes. Share your pitch deck as a tracked link for initial outreach. When investors move to due diligence, create a Space with role-based access, folder structure, NDA gating, and a full audit log of every document view.",
  },
  {
    question: "How is the investor engagement score calculated?",
    answer:
      "The score is calculated from visit count, total reading time, pages viewed, whether the document was downloaded, and whether it was forwarded to additional viewers. Higher scores indicate stronger interest and should be prioritized for follow-up.",
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

function FeatureBlock({
  step,
  label,
  title,
  description,
  bullets,
  imageSrc,
  imageAlt,
  reverse,
}: {
  step: string
  label: string
  title: string
  description: string
  bullets: string[]
  imageSrc: string
  imageAlt: string
  reverse?: boolean
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div
        className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
          reverse ? "lg:grid-flow-dense" : ""
        }`}
      >
        <div className={reverse ? "lg:col-start-2" : ""}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {step}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {label}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-4">
            {title}
          </h2>
          <p className="text-base text-slate-500 leading-relaxed mb-6">
            {description}
          </p>
          <ul className="space-y-3">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div
          className={`flex items-center justify-center ${
            reverse ? "lg:col-start-1 lg:row-start-1" : ""
          }`}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={520}
            height={420}
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  )
}

export default function FundraisingPage(): JSX.Element {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
              For Fundraising
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
              Know exactly which investors{" "}
              <span className="text-sky-600">are serious about your deal.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              DocMetrics gives founders and finance professionals real-time
              visibility into how investors engage with pitch decks, financial
              models, and due diligence materials. Stop guessing. Start closing.
            </p>
            <Button
              size="lg"
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-6 text-base rounded-xl shadow-md hover:shadow-lg transition-all"
              asChild
            >
              <Link href="/signup">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-slate-400 mt-3">No credit card required</p>
          </div>
          <div className="flex items-center justify-center">
            <Image
              src="/assets/illustrations/fundraising-hero.png"
              alt="DocMetrics fundraising overview"
              width={560}
              height={460}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <div className="">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-2xl mb-12">
            
            
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-4">
              You send the pitch deck. Then silence.
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              You spend weeks perfecting your pitch deck, financial model, and
              data room. You send it to investors and then have no idea what
              happens next. Did they open it? Which slides held their attention?
              Is now the right time to follow up or will you come across as
              desperate? Meanwhile your runway keeps burning and your competitor
              just closed their round.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "No visibility after sending",
                description:
                  "Once you share your deck you lose all visibility. You have no idea if the investor even opened it, let alone which slides they spent time on.",
              },
              {
                title: "Wrong follow-up timing",
                description:
                  "Following up too early feels desperate. Waiting too long means the investor has moved on to the next deal that was better timed.",
              },
              {
                title: "No signal of genuine interest",
                description:
                  "You cannot tell which investors are seriously evaluating your deal and which ones gave you a polite yes but never intend to invest.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-slate-200 rounded-xl p-6"
              >
                <div className="h-1.5 w-6 rounded-full bg-red-300 mb-5" />
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  {item.title}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURE BLOCKS ── */}

      <FeatureBlock
        step="1"
        label="Investor Tracking"
        title="Know the instant an investor opens your pitch deck."
        description="The moment an investor opens your document, DocMetrics sends you a notification. You see their name, when they opened it, how many times they returned, and whether they forwarded it to a partner. Follow up while you are literally top of mind."
        bullets={[
          "Instant notification the moment your pitch deck is opened",
          "See the investor's name, location, device, and time of visit",
          "Track every return visit — multiple opens signal serious interest",
          "Know when your deck gets forwarded to a partner or investment committee",
          "Live indicator shows when someone is reading your document right now",
        ]}
        imageSrc="/assets/illustrations/sales-alerts.png"
        imageAlt="Investor tracking illustration"
      />

      <FeatureBlock
        step="2"
        label="Slide Analytics"
        title="See which slides investors actually care about."
        description="DocMetrics tracks time spent on every page of your pitch deck. If an investor spends five minutes on your financials but skips the team slide, you know exactly what concerns to address before your next meeting. Use this data to prepare smarter conversations."
        bullets={[
          "Per-page bar chart showing exact reading time for every investor",
          "See which slides were skipped and which were revisited multiple times",
          "Identify the sections that drive investment decisions",
          "Compare engagement patterns across different investors",
          "Continuously refine your deck based on real engagement data",
        ]}
        imageSrc="/assets/illustrations/step-track.png"
        imageAlt="Slide analytics illustration"
        reverse
      />

      <FeatureBlock
        step="3"
        label="Engagement Scoring"
        title="Prioritize the investors most likely to write a check."
        description="DocMetrics automatically scores every investor based on their engagement — time spent reading, number of visits, pages reviewed, and whether they shared the deck with others. The most engaged investors rise to the top so you always know where to focus your limited time."
        bullets={[
          "Automatic engagement score calculated from visits, time, and actions",
          "Hot, warm, and cold classification so you prioritize the right investors",
          "See the full engagement history for every investor in one view",
          "Stop chasing investors who opened page one and never came back",
          "Focus every follow-up call where buying intent is genuinely high",
        ]}
        imageSrc="/assets/illustrations/sales-scoring.png"
        imageAlt="Engagement scoring illustration"
      />

      <FeatureBlock
        step="4"
        label="Secure Sharing"
        title="Full control over who accesses your confidential materials."
        description="Your pitch deck contains sensitive financial projections, strategic plans, and proprietary information. DocMetrics gives you complete control over every document you share. Password protect, require email verification, restrict to specific domains, set expiry dates, and block downloads — all before you send."
        bullets={[
          "Require email verification before any investor can view your deck",
          "Password protect financial models and confidential documents",
          "Restrict access to specific email addresses or firm domains",
          "Set expiry dates so outdated materials cannot be accessed",
          "Block downloads while still allowing full document viewing",
        ]}
        imageSrc="/assets/illustrations/step-share.png"
        imageAlt="Secure sharing illustration"
        reverse
      />

      <FeatureBlock
        step="5"
        label="Data Rooms"
        title="Organize your entire deal in one secure branded space."
        description="When investors move to due diligence, create a Space — a secure branded data room with folders for financials, legal, pitch materials, and cap table. Invite investors with role-based access, require an NDA before entry, and track every document view across your entire deal room."
        bullets={[
          "Create a branded space with organized folders for every document category",
          "Invite investors with role-based access — some see everything, others see only what they need",
          "Require investors to sign an NDA before they can access any materials",
          "Full audit log — every document opened, every page viewed, every download, timestamped",
          "Q&A tab where investors ask questions and you respond inside the space",
        ]}
        imageSrc="/assets/illustrations/step-dataroom.png"
        imageAlt="Data room illustration"
      />

      <FeatureBlock
        step="6"
        label="NDA and Agreements"
        title="Gate your most sensitive materials behind a signed agreement."
        description="For confidential information memorandums, financial models, and legal documents, DocMetrics lets you require investors to sign an NDA before they can view anything. The signature is collected digitally, timestamped, and stored automatically — no separate tool required."
        bullets={[
          "Upload your NDA as a PDF and attach it to any Space or document",
          "Investors must sign before they can access any materials inside",
          "Signatures are collected digitally with timestamp and IP address recorded",
          "View all signed agreements and download certificates from your dashboard",
          "Revoke access at any time if the deal falls through",
        ]}
        imageSrc="/assets/illustrations/step-sign.png"
        imageAlt="NDA and agreements illustration"
        reverse
      />

      {/* ── FAQ ── */}
      <section className=" py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
             
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-base text-slate-500">
              Everything you need to know about using DocMetrics for fundraising.{" "}
              <a
                href="/contact"
                className="text-[#0284c7] hover:text-[#0369a1] font-medium transition-colors"
              >
                Contact us
              </a>{" "}
              if you cannot find what you are looking for.
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

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Start tracking your pitch deck today.
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Upload your pitch deck and see real investor engagement data in
            under two minutes. Know who is serious before you spend another hour
            on a follow-up call.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              View pricing
            </Link>
          </div>
          <p className="text-xs text-white/60 mt-5">No credit card required</p>
        </div>
      </div>

    </div>
  )
}