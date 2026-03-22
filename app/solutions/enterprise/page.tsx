"use client"
import { JSX, useState } from "react"
import Link from "next/link"
import { ArrowRight, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const FAQS = [
  {
    question: "Do my clients need to create an account to view documents?",
    answer:
      "No. Anyone you share a link with can open and view the document instantly with no sign-up, no login, and no friction. You track everything on your end while they experience a seamless viewing flow.",
  },
  {
    question: "Can I brand the client portal with my own logo and colors?",
    answer:
      "Yes. Every Space and share link can be customized with your logo, brand color, welcome message, and company name so clients experience your brand rather than DocMetrics.",
  },
  {
    question: "Can I require clients to sign an NDA before viewing anything?",
    answer:
      "Yes. You can attach an NDA to any Space or document. Clients must sign it digitally before they can access any materials. Signatures are timestamped and stored automatically.",
  },
  {
    question: "How do I collect files from clients?",
    answer:
      "You can create a file request inside any Space. Set a title, message, list of expected files, and a due date. Clients receive a secure upload link and their files land directly in the folder you specify.",
  },
  {
    question: "Can clients ask questions about the documents inside their portal?",
    answer:
      "Yes. Every Space has a Q&A tab where clients can ask questions directly inside the portal. You receive a notification and reply from your dashboard. All questions and answers are visible to the relevant parties.",
  },
  {
    question: "Can I control what each client sees inside a shared portal?",
    answer:
      "Yes. You assign roles to each person you invite — Admin, Editor, or Viewer. You can also set folder-level permissions so each person only sees the documents they are meant to see.",
  },
  {
    question: "Can I track whether a client actually read what I sent them?",
    answer:
      "Yes. DocMetrics tracks time spent on every page of every document inside your portal. You see exactly who read what, how long they spent, and whether they came back for a second look.",
  },
  {
    question: "Is there an audit log so I can prove what was shared and when?",
    answer:
      "Yes. Every Space has a full audit log recording every action — every document opened, every page viewed, every file downloaded — with a timestamp and the name of the person who performed it.",
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
        <span className={`text-base font-medium transition-colors duration-150 ${isOpen ? "text-sky-600" : "text-slate-900 group-hover:text-sky-600"}`}>
          {faq.question}
        </span>
        <span className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-full border transition-all duration-200 ${isOpen ? "bg-sky-600 border-sky-600 text-white" : "border-slate-300 text-slate-400 group-hover:border-sky-600 group-hover:text-sky-600"}`}>
          {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>
      <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: isOpen ? 400 : 0 }}>
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
      <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? "lg:grid-flow-dense" : ""}`}>
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
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className={`flex items-center justify-center ${reverse ? "lg:col-start-1 lg:row-start-1" : ""}`}>
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

export default function ClientPortalsPage(): JSX.Element {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
              Client Portals
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
              A secure branded space{" "}
              <span className="text-sky-600">for every client relationship.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              DocMetrics gives you a professional way to share documents, track engagement, collect signatures, and manage client communication — all in one branded space.
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
              src="/assets/illustrations/client-portals-hero.png"
              alt="Client portal overview"
              width={560}
              height={460}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-4">
            Sharing documents with clients should not be this messy.
          </h2>
          <p className="text-base text-slate-500 leading-relaxed">
            You send proposals, contracts, and supporting documents by email. Clients lose them, forward them to the wrong people, or never open them at all. You have no idea what they read or when they are ready to move forward. Every deal involves a chaotic back and forth of attachments, follow-up emails, and missed signatures. There is no single place where everything lives and no visibility into what is actually happening on the client side.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: "Documents scattered across email",
              description: "Proposals, contracts, and briefs live in different email threads. Clients lose them, you resend them, and nothing is organized or trackable.",
            },
            {
              title: "No idea if clients read anything",
              description: "You send a contract and wait. You have no idea if they opened it, which sections they reviewed, or why they have not signed yet.",
            },
            {
              title: "No professional client experience",
              description: "Sending PDFs as email attachments does not reflect the quality of your work. Clients deserve a professional branded experience from the start.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="h-1.5 w-6 rounded-full bg-red-300 mb-5" />
              <p className="text-sm font-semibold text-slate-900 mb-2">{item.title}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURE BLOCKS ── */}

      <FeatureBlock
        step="1"
        label="Spaces"
        title="Create a dedicated portal for every client."
        description="A Space is a secure branded environment where you organize all documents for one client relationship. Invite your client with one link, assign their access level, and everything they need is in one place. You see every interaction across every document inside."
        bullets={[
          "Create a branded space with your logo, colors, and welcome message",
          "Organize documents into folders — proposals, contracts, briefs, deliverables",
          "Invite clients with role-based access so they only see what is relevant",
          "One link gives clients access to everything you have shared with them",
          "Full audit log of every document opened, every page viewed, every download",
        ]}
        imageSrc="/assets/illustrations/step-dataroom.png"
        imageAlt="Client space illustration"
      />

      <FeatureBlock
        step="2"
        label="Document Tracking"
        title="Know exactly what your client read and when."
        description="The moment a client opens a document, DocMetrics notifies you. A page-by-page breakdown shows exactly how long they spent on each section, which pages they skipped, and whether they came back for a second look. You always know where they are in the process."
        bullets={[
          "Instant notification the moment a client opens any document",
          "Per-page reading time so you know which sections held their attention",
          "Return visit detection shows when a client comes back to review something",
          "Live indicator shows when someone is reading a document right now",
          "Track multiple clients on the same document independently",
        ]}
        imageSrc="/assets/illustrations/step-track.png"
        imageAlt="Document tracking illustration"
        reverse
      />

      <FeatureBlock
        step="3"
        label="E-Signatures"
        title="Get contracts signed without leaving the portal."
        description="Send signature requests directly from DocMetrics. Place signature fields, date fields, and text inputs anywhere on any document. Clients sign inside the portal in one seamless flow. You track exactly how long they spent reading before they signed."
        bullets={[
          "Place signature, date, text, checkbox, and attachment fields on any document",
          "Send to one client or multiple signers with a defined signing order",
          "Track time to open, time to sign, and pages viewed before signing",
          "Download a signed PDF once all parties have completed their signatures",
          "Bundle multiple documents into one envelope for complex engagements",
        ]}
        imageSrc="/assets/illustrations/step-sign.png"
        imageAlt="E-signature illustration"
      />

      <FeatureBlock
        step="4"
        label="File Requests"
        title="Collect documents from clients without the back and forth."
        description="Create a file request inside any Space. Specify what you need, set a due date, and send your client a secure upload link. Their files land directly in the folder you specify. No email attachments, no chasing, no confusion about what was received."
        bullets={[
          "Create a file request with a title, message, and list of expected files",
          "Set a due date so clients know when materials are needed",
          "Clients upload through a secure link — no account required",
          "Files land directly in the folder you specify inside the Space",
          "Receive a notification when each file is uploaded",
        ]}
        imageSrc="/assets/illustrations/portal-filerequests.png"
        imageAlt="File requests illustration"
        reverse
      />

      <FeatureBlock
        step="5"
        label="NDA and Security"
        title="Protect confidential materials before clients can view anything."
        description="For sensitive proposals, financial models, or confidential briefs, require clients to sign an NDA before they can access your Space. DocMetrics collects the signature digitally, timestamps it, and stores it automatically. No separate tool required."
        bullets={[
          "Attach an NDA to any Space — clients must sign before entering",
          "Signatures are collected with timestamp and IP address recorded",
          "Password protect individual documents for an extra layer of security",
          "Set expiry dates on links so outdated materials cannot be accessed",
          "Revoke access instantly if a client relationship ends",
        ]}
        imageSrc="/assets/illustrations/step-share.png"
        imageAlt="NDA and security illustration"
      />

      <FeatureBlock
        step="6"
        label="Q&A"
        title="Handle client questions inside the portal, not in your inbox."
        description="Every Space has a Q&A tab where clients can ask questions directly about any document. You receive a notification and reply from your dashboard. All questions and answers stay organized inside the Space so nothing gets lost in email threads."
        bullets={[
          "Clients ask questions directly inside the portal without emailing you",
          "You receive a notification for every new question",
          "Reply from your dashboard — responses appear inside the Space",
          "Filter questions by answered and unanswered",
          "All communication stays in one place alongside the documents it relates to",
        ]}
        imageSrc="/assets/illustrations/portal-qa.png"
        imageAlt="Q&A illustration"
        reverse
      />

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-base text-slate-500">
              Everything you need to know about DocMetrics client portals.{" "}
              <a href="/contact" className="text-sky-600 hover:text-sky-800 font-medium transition-colors">
                Contact us
              </a>{" "}
              if you cannot find what you are looking for.
            </p>
          </div>
          <div className="divide-y divide-slate-200 border-t border-slate-200">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} faq={faq} isOpen={openIndex === i} onToggle={() => toggle(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Give every client a portal they will remember.
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Create your first client Space in under two minutes. Upload your documents, invite your client, and start tracking engagement from day one.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm">
              View pricing
            </Link>
          </div>
          <p className="text-xs text-white/60 mt-5">No credit card required</p>
        </div>
      </div>

    </div>
  )
}