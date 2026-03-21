
"use client"
import { JSX, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const CATEGORIES = [
  { id: "sharing", label: "Sharing Documents" },
  { id: "analytics", label: "Analytics" },
  { id: "spaces", label: "Spaces" },
  { id: "signatures", label: "Signatures" },
  { id: "security", label: "Security" },
  { id: "bulk", label: "Bulk Sending" },
]

type Practice = {
  title: string
  description: string
  do: string[]
  dont: string[]
}

type PracticesMap = {
  [key: string]: Practice[]
}

const PRACTICES: PracticesMap = {
  sharing: [
    {
      title: "Create a separate link for every recipient",
      description:
        "When you share one link with multiple people you lose the ability to know who opened what. Creating a unique link per recipient gives you individual tracking data so you know exactly which person read your document, how long they spent, and when to follow up.",
      do: [
        "Generate a new share link for each recipient directly from the document page",
        "Label each link with the recipient name so you can identify it in your analytics",
        "Set an expiry date on every link so access does not remain open indefinitely",
        "Use email verification on links sent to clients or investors for accurate identification",
      ],
      dont: [
        "Send the same link to an entire email list and expect individual tracking to work",
        "Share links publicly on social media or websites if you need to know who is viewing",
        "Leave links active after a deal closes or a contract is signed",
      ],
    },
    {
      title: "Write a message that tells the recipient exactly what to do",
      description:
        "The message you add to a share link is the first thing recipients read. A vague message leads to low open rates and no action. A specific message with a clear next step leads to faster responses and more signed contracts.",
      do: [
        "State what the document is and why you are sending it in the first sentence",
        "Tell the recipient exactly what action you need — review and reply, sign by Friday, upload the requested files",
        "Keep the message to two or three sentences so it is read in full",
        "Include your name and a direct way to reach you if they have questions",
      ],
      dont: [
        "Send documents with no message at all",
        "Write a long message that buries the call to action at the bottom",
        "Use the same generic message for every document you send",
      ],
    },
    {
      title: "Set the right expiry for every document type",
      description:
        "Not all documents should stay accessible forever. A proposal that was not accepted should not be viewable six months later. A contract that was signed does not need an active link. Setting expiry dates protects your information and keeps your link list clean.",
      do: [
        "Set 7 to 14 day expiry on proposals and pitch decks",
        "Set 30 day expiry on documents that require a decision or signature",
        "Use no expiry only for evergreen materials like product guides or public resources",
        "Revoke access manually the moment a deal closes or a relationship ends",
      ],
      dont: [
        "Leave sensitive financial documents accessible with no expiry date",
        "Forget to revoke access for former clients or prospects who did not convert",
        "Set expiry so short that recipients cannot reasonably review the document",
      ],
    },
  ],
  analytics: [
    {
      title: "Check the page breakdown before every follow-up call",
      description:
        "The page-by-page analytics in DocMetrics tell you more about a prospect's state of mind than any email response will. Before you pick up the phone or write a follow-up, spend sixty seconds reviewing which pages they spent the most time on. That data tells you exactly what to lead with.",
      do: [
        "Open the document analytics and check which pages had the highest reading time before calling",
        "If they spent most time on pricing, lead the call with a direct conversation about budget",
        "If they spent most time on case studies, open with ROI and results from similar clients",
        "Note which pages were skipped entirely — these are objections waiting to happen",
      ],
      dont: [
        "Follow up with a generic message that ignores what the analytics are telling you",
        "Assume that a long total reading time means the prospect is ready to buy without checking which pages drove it",
        "Wait more than 24 hours after a high engagement session to follow up",
      ],
    },
    {
      title: "Use return visits as your strongest buying signal",
      description:
        "A prospect who opens your document once is curious. A prospect who opens it three times in two days is serious. Return visits are the clearest signal that someone is actively evaluating your offer. DocMetrics shows you every return visit with a timestamp so you never miss this moment.",
      do: [
        "Set up email notifications so you are alerted to every new view in real time",
        "Treat any prospect with three or more visits as a priority follow-up within the same day",
        "Check whether return visits are happening on the same pages or new ones — same pages signal objections, new pages signal deeper evaluation",
        "Reference the timing naturally in your follow-up — reaching out while the document is fresh increases response rates significantly",
      ],
      dont: [
        "Ignore return visit notifications because you already followed up once",
        "Wait until the end of the week to batch your follow-ups — timing is everything",
        "Treat a single 10 second open the same as a 15 minute deep read",
      ],
    },
    {
      title: "Compare engagement across links to find your best performing content",
      description:
        "If you send the same proposal to ten different prospects and some links get high engagement while others get low engagement, the difference is worth understanding. DocMetrics lets you compare link performance so you can identify what is working and apply it everywhere.",
      do: [
        "Review your document analytics monthly and look for patterns in which pages consistently lose attention",
        "Compare engagement between different versions of a proposal to identify which structure performs better",
        "Use high drop-off pages as a signal to shorten or restructure that section of your document",
        "Track your average time per page over time and set a personal benchmark to improve against",
      ],
      dont: [
        "Make structural changes to a document based on one low performing share",
        "Ignore the pages at the end of your document — consistently low engagement there means most people are not finishing",
        "Confuse total views with engagement quality — ten views averaging 30 seconds is worse than two views averaging 8 minutes",
      ],
    },
  ],
  spaces: [
    {
      title: "Create one Space per client or deal — not one Space for everything",
      description:
        "A Space works best when it represents a single relationship or a single deal. Putting all your clients inside one Space creates confusion and makes tracking meaningless. One Space per client means clean analytics, organized folders, and a professional experience for each person you work with.",
      do: [
        "Create a new Space the moment you begin working with a new client or opening a new deal",
        "Name the Space after the client or deal so it is immediately identifiable in your dashboard",
        "Set up the folder structure before you invite anyone — financial, legal, proposals, deliverables",
        "Customize the branding with your logo and brand color so every client sees your identity",
      ],
      dont: [
        "Dump all your documents into one Space and invite multiple unrelated clients",
        "Invite clients before the Space is organized — first impressions matter",
        "Use the default Space name and skip branding customization",
      ],
    },
    {
      title: "Use role-based access to control what each person sees",
      description:
        "Not everyone you invite to a Space needs to see everything inside it. A legal advisor needs the contracts folder. A financial partner needs the financials. An operations contact needs the project briefs. DocMetrics lets you assign folder-level permissions so each person sees exactly what is relevant to them.",
      do: [
        "Review who needs access to what before inviting anyone",
        "Assign Viewer role to most external contacts by default — upgrade permissions only when needed",
        "Use folder-level permissions to restrict sensitive financial or legal documents to specific people",
        "Revoke access immediately when someone's involvement in a deal ends",
      ],
      dont: [
        "Give everyone Admin access because it is easier than thinking through permissions",
        "Invite external parties to a Space that contains documents from other unrelated clients",
        "Forget to remove access for advisors or consultants once their work is complete",
      ],
    },
    {
      title: "Require an NDA before anyone enters a Space with sensitive materials",
      description:
        "If your Space contains financial projections, legal documents, proprietary processes, or confidential deal terms, requiring an NDA before entry is not optional — it is standard practice. DocMetrics collects the signature digitally and timestamps it so you have a record without any additional tools.",
      do: [
        "Upload your NDA as a PDF and attach it to any Space containing confidential materials before inviting anyone",
        "Use your own NDA drafted by a legal professional rather than a generic template",
        "Check your NDA signatures dashboard regularly to confirm all active parties have signed",
        "Download signed NDA certificates and store them with your deal records",
      ],
      dont: [
        "Share sensitive financial models or proprietary information in a Space without NDA gating",
        "Use an NDA template found online for high-value deals without having it reviewed",
        "Forget to check whether all invited parties have actually signed before sharing new sensitive documents",
      ],
    },
  ],
  signatures: [
    {
      title: "Place signature fields after the pages that matter most",
      description:
        "Where you place the signature field affects whether people sign. If you drop a signature field on page one before the recipient has read anything, they will not sign it. Place signature fields after the key sections — after the terms, after the pricing, after the scope of work — so the recipient signs with full understanding.",
      do: [
        "Read through your document from the recipient's perspective before placing any fields",
        "Place the signature field immediately after the final terms or key conditions",
        "Add a date field next to every signature field so the signed date is captured automatically",
        "Use the text field for any information you need the signer to fill in — name, title, company",
      ],
      dont: [
        "Place signature fields on the first page before the recipient has read the document",
        "Add so many fields that the signing experience feels like filling out a form",
        "Forget to add a date field — unsigned dates create compliance issues",
      ],
    },
    {
      title: "Use sequential signing order when one signature depends on another",
      description:
        "If you are sending a contract that requires your client to sign before it goes to their manager for counter-signature, sequential order is not optional — it is the correct workflow. DocMetrics notifies each signer only after the previous person has completed their signature so the order is always respected.",
      do: [
        "Enable sequential signing any time one signature logically follows another",
        "List signers in the order that reflects your actual approval process",
        "Add a message to each recipient explaining who signs before them and what they are signing",
        "Set a due date on sequential requests so the chain does not stall indefinitely",
      ],
      dont: [
        "Use any order signing for legal documents where the signing sequence matters for validity",
        "Set unrealistically short due dates on sequential requests",
        "Forget to notify the first signer promptly so the chain does not stall at the beginning",
      ],
    },
    {
      title: "Check the signing analytics before sending a reminder",
      description:
        "Before you send a reminder to someone who has not signed yet, check the signature analytics. DocMetrics shows you whether they opened the request, which pages they read, and how far through the document they got. This tells you whether the issue is that they have not opened it or that they read it and are hesitating.",
      do: [
        "Open the signatures tab and check the recipient row before sending any reminder",
        "If they opened the document but did not sign, reach out directly and ask if they have questions",
        "If they never opened it, a simple reminder email is the right move",
        "Use the time-to-open and time-to-sign data to identify recipients who need a call rather than an email",
      ],
      dont: [
        "Send a generic reminder to everyone who has not signed without checking whether they opened the request",
        "Send multiple reminders in one day — one well-timed reminder is more effective than three rushed ones",
        "Ignore a recipient who opened the document multiple times but still has not signed",
      ],
    },
  ],
  security: [
    {
      title: "Use email verification on every link sent to a named individual",
      description:
        "Email verification requires the recipient to confirm their email address before they can view the document. This ensures the person viewing is who you think it is, and gives DocMetrics an accurate name to attach to every page view in your analytics. Without it you are tracking anonymous sessions.",
      do: [
        "Enable email verification on any link sent directly to a named client, investor, or prospect",
        "Use domain restriction instead when sending to an entire company — restrict to their domain so only employees can access",
        "Leave email verification off for public marketing materials where anonymous access is acceptable",
        "Review your visitor list after a document is opened to confirm the emails match who you expected",
      ],
      dont: [
        "Send a contract or confidential proposal without any form of recipient verification",
        "Rely on the recipient's word about who they are without verification on sensitive documents",
        "Enable email verification on public resources where you want frictionless access",
      ],
    },
    {
      title: "Enable dynamic watermarking on confidential documents",
      description:
        "A dynamic watermark embeds the viewer's email address visibly on every page of the document as they read it. This creates a strong deterrent and provides traceability if confidential information is leaked. For financial models, legal documents, and proprietary processes, watermarking should be standard.",
      do: [
        "Enable dynamic watermarking on any document containing financial projections, legal terms, or proprietary information",
        "Use watermarking alongside download blocking so the document can be read but not saved",
        "Inform recipients in your share message that the document is watermarked — transparency builds trust",
        "Keep watermarking off for marketing materials and public resources where it adds friction without benefit",
      ],
      dont: [
        "Rely on watermarking alone as your only security measure for highly sensitive documents",
        "Watermark documents that recipients are meant to download and use — the watermark will appear in their working copy",
        "Use a static watermark that does not identify the specific viewer — it provides no traceability",
      ],
    },
    {
      title: "Audit your active links regularly and revoke anything no longer needed",
      description:
        "Over time your DocMetrics account accumulates share links that are no longer relevant — proposals that were not accepted, contracts signed months ago, documents from clients you no longer work with. Leaving these links active is an unnecessary security risk. A monthly audit takes ten minutes and keeps your account clean.",
      do: [
        "Set a recurring reminder to review your active links once a month",
        "Revoke any link attached to a deal that closed, a client relationship that ended, or a superseded document",
        "Check the compliance page regularly for documents with expired or expiring links that need attention",
        "Download an audit log export periodically for record keeping on high-value deals",
      ],
      dont: [
        "Leave links active indefinitely because you forgot to revoke them after a deal ended",
        "Assume that because nobody has viewed a link recently it is safe to leave it open",
        "Skip the audit because it feels like admin — one leaked confidential document costs more than the time it takes",
      ],
    },
  ],
  bulk: [
    {
      title: "Validate and preview your CSV before sending to hundreds of recipients",
      description:
        "Bulk send is powerful but mistakes at scale are expensive. Sending a personalised proposal to 200 people with the wrong name in the greeting or a broken email address is a problem that cannot be undone. DocMetrics validates your CSV and lets you preview the document for individual recipients before anything is sent.",
      do: [
        "Download the sample CSV template from the bulk send page and use it as your starting structure",
        "Check every row for missing names and invalid email formats before uploading",
        "Use the recipient preview to select three or four different recipients and verify the document looks correct for each",
        "Send a test batch of five recipients first before sending to your full list",
      ],
      dont: [
        "Upload a CSV and send immediately without previewing at least a sample of recipients",
        "Use the same email address for multiple rows — duplicate emails produce duplicate sends",
        "Include special characters or line breaks in name fields that can break the personalisation rendering",
      ],
    },
    {
      title: "Segment your recipient list so you can follow up meaningfully",
      description:
        "After a bulk send, the engagement data becomes most useful when you act on it in segments rather than treating everyone the same. DocMetrics tracks each recipient individually so you can identify who read deeply, who bounced, and who never opened at all. Each group needs a different follow-up.",
      do: [
        "After 48 to 72 hours, review the engagement scores for your entire recipient list",
        "Write a specific follow-up for high engagement recipients that references the document directly",
        "Send a simple reminder to recipients who never opened — do not assume disinterest, emails are sometimes missed",
        "Remove recipients with consistently low engagement from future sends rather than continuing to contact them",
      ],
      dont: [
        "Send the same follow-up message to every recipient regardless of whether they opened the document",
        "Follow up the same day you sent the bulk — give recipients 48 hours before reaching out",
        "Ignore the recipients with the highest engagement scores because you are busy with other leads",
      ],
    },
    {
      title: "Use CC recipients on bulk sends for deals that require oversight",
      description:
        "When you are bulk sending contracts, offer letters, or compliance documents, there is often someone who needs to be notified when each recipient signs. DocMetrics lets you add CC recipients to a bulk send so the right people are automatically notified at each milestone without you having to manually forward anything.",
      do: [
        "Add your manager or legal contact as a CC recipient on any bulk send involving contracts or legally binding documents",
        "Set CC notifications to trigger on completion if the oversight person only needs to know when everything is done",
        "Confirm with your CC recipients that they want to receive these notifications before adding them",
        "Review the CC recipient list before every bulk send to ensure it reflects current team structure",
      ],
      dont: [
        "Add CC recipients who are not directly involved in the deal — unnecessary notifications reduce signal to noise ratio",
        "Forget to update CC recipients when team members change roles or leave the organisation",
        "Use CC recipients as a substitute for proper access permissions inside a Space",
      ],
    },
  ],
}

export default function BestPracticesPage(): JSX.Element {
  const [activeCategory, setActiveCategory] = useState("sharing")

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
            Best Practices
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
            Get more out of{" "}
            <span className="text-sky-600">every document you share.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
            Practical guidance on how to use DocMetrics effectively — from
            setting up your first share link to running a bulk send campaign
            to thousands of recipients.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-6 text-base rounded-xl shadow-md hover:shadow-lg transition-all gap-2"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-slate-400 mt-3">No credit card required</p>
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div className="border-t border-slate-100 bg-slate-50 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRACTICES ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          {PRACTICES[activeCategory]?.map((practice, index) => (
            <div
              key={index}
              className="grid lg:grid-cols-12 gap-8 pb-16 border-b border-slate-100 last:border-0 last:pb-0"
            >
              {/* Left — title and description */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Practice {index + 1}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 leading-snug mb-4">
                  {practice.title}
                </h2>
                <p className="text-base text-slate-500 leading-relaxed">
                  {practice.description}
                </p>
              </div>

              {/* Right — do and dont */}
              <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">

                {/* Do */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="h-5 w-5 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-sky-600" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
                      Do this
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {practice.do.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dont */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-red-500">
                      Avoid this
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {practice.dont.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-red-300 mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Ready to put this into practice?
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Everything covered in this guide is available inside DocMetrics
            today. Upload your first document and start applying these
            practices in under two minutes.
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
              href="/docs"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Read the documentation
            </Link>
          </div>
          <p className="text-xs text-white/60 mt-5">No credit card required</p>
        </div>
      </div>

    </div>
  )
}