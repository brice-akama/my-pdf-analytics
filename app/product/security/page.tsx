"use client"

import { JSX } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mt-16 mb-8">
      {children}
    </p>
  )
}

function FeatureBlock({
  title,
  description,
  when,
}: {
  title: string
  description: string
  when: string
}) {
  return (
    <div className="mb-10">
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-base text-slate-500 leading-relaxed mb-3">{description}</p>
      <p className="text-sm text-slate-400">
        <span className="font-semibold text-slate-600">When to use it — </span>
        {when}
      </p>
    </div>
  )
}

export default function SecurityControlPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-sky-400 mt-16 mb-8">
          Security & Control
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
          Your document.{" "}
          <span className="text-sky-600">Your rules.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl">
          Every share link and data room you create in DocMetrics comes with a full set of access controls. Decide who can view, what they can do, and for how long — before you send and after.
        </p>
      </div>

      {/* ── Features ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-16">

        <SectionLabel>Share Link Controls</SectionLabel>

        <FeatureBlock
          title="Password protection"
          description="Add a password to any share link before sending. Only people who have the correct password can open the document. You can change the password at any time — even after the link has been sent — and existing access is immediately invalidated."
          when="Sending proposals, contracts, or financial documents to clients where you want a second layer of verification beyond just having the link."
        />

        <FeatureBlock
          title="Email capture"
          description="Require visitors to enter their email address before they can view the document. The email is recorded against their session so every view in your analytics is tied to a real identity — not just an anonymous visitor."
          when="Any time you want to know exactly who opened your document, not just how many times it was opened."
        />

        <FeatureBlock
          title="Domain and email whitelist"
          description="Restrict a share link so only specific email addresses or entire email domains can access it. Anyone trying to open the link with an email outside your approved list is blocked before they see any content."
          when="Sharing investor materials that should only be accessible to people at a specific firm, or internal documents that should stay within your company."
        />

        <FeatureBlock
          title="Expiry date"
          description="Set a date and time after which the link automatically stops working. The document content never changes — only access is removed. You can extend or remove the expiry at any time from your dashboard."
          when="Time-sensitive proposals where pricing changes after a certain date, or previews you only want available for a limited window."
        />

        <FeatureBlock
          title="View limit"
          description="Cap the total number of times a link can be opened. Once the limit is reached the link stops working automatically. This applies across all viewers — not per person."
          when="Exclusive materials you want to control how widely they circulate, or early access previews with a limited audience."
        />

        <FeatureBlock
          title="Block downloads"
          description="Prevent anyone opening the link from saving a copy of the document to their device. They can still read the full document through the DocMetrics viewer — they just cannot take a copy away."
          when="Confidential documents where you want a full audit trail of who read what, without copies circulating outside the platform."
        />

        <FeatureBlock
          title="Block forwarding and printing"
          description="Disable the ability to forward the link or print the document. Combined with download blocking this gives you the strongest possible control over where your content ends up."
          when="Legal documents, unreleased product information, or anything where physical or digital copies outside the platform would be a problem."
        />

        <FeatureBlock
          title="Dynamic watermark"
          description="Overlay the viewer's email address directly onto every page of the document as they read it. The watermark is applied in real time and cannot be removed by the viewer. If the document is photographed or screenshotted, the source is traceable."
          when="Highly sensitive materials where you need a visible deterrent against unauthorized distribution."
        />

        <FeatureBlock
          title="Instant access revocation"
          description="Disable any share link at any time with a single click. Access stops immediately — anyone who tries to open the link after revocation sees a blocked message. You can also re-enable it just as quickly."
          when="A deal falls through, a relationship ends, or you realise a link was shared wider than intended."
        />

        <SectionLabel>NDA Gating</SectionLabel>

        <FeatureBlock
          title="NDA signature before access"
          description="Upload your own NDA document and require visitors to read and sign it before they can view anything in your Space or share link. The signature is timestamped, IP-logged, and stored against the visitor's email. You can download a record of all signatories at any time."
          when="Due diligence data rooms, investor spaces, or any situation where confidentiality must be formally agreed to before documents are visible."
        />

        <SectionLabel>Spaces & Data Room Controls</SectionLabel>

        <FeatureBlock
          title="Role-based access"
          description="When you invite people to a Space you assign them a role — Viewer, Editor, or Admin. Viewers can read and download documents. Editors can upload and rename files. Admins can manage members and settings. Roles can be changed or revoked at any time."
          when="Team collaboration, client portals, or investor data rooms where different people need different levels of access."
        />

        <FeatureBlock
          title="Folder-level permissions"
          description="Inside a Space you can restrict individual folders so only specific people can see them. Someone with access to the Space does not automatically have access to every folder inside it. Each folder has its own permission list."
          when="Data rooms where legal documents should only be visible to lawyers, or financial folders that only the CFO counterpart should access."
        />

        <FeatureBlock
          title="Full audit log"
          description="Every action inside a Space is recorded — who viewed which document, when they opened it, how long they spent, what they downloaded, and when they left. The audit log is exportable as a CSV and entries cannot be deleted."
          when="Compliance requirements, investor due diligence processes, or any situation where you need a traceable record of who accessed what and when."
        />

        <FeatureBlock
          title="File request collection"
          description="Request files from specific people inside a Space. They get a secure upload link and can submit documents directly into your designated folder without needing an account. You see exactly who uploaded what and when."
          when="Collecting signed documents back from clients, gathering due diligence materials from founders, or receiving deliverables from vendors."
        />

      </div>

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20">
         <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Start with full control from day one.
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Every security feature on this page is available on the free plan. No enterprise tier required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
           <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="mailto:support@docmetrics.io" className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm">
              Ask a question
            </a>
          </div>
          <p className="text-xs text-white/60 mt-5">No credit card required</p>
        </div>
      </div>

    </div>
  )
}