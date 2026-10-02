// components/free-tools.tsx
// Server component. Crawlable <a href> links to the two free tools.
// Used ONLY on the blog index and blog post pages (not in navbar/footer).
import Link from "next/link";

const TOOLS = [
  {
    href: "/proposal-grader",
    title: "Sales Proposal Grader",
    description:
      "Answer 5 questions and get an instant score on your proposal process. Find out where deals are slipping and what to fix first.",
  },
  {
    href: "/silence-checker",
    title: "Deal Silence Checker",
    description:
      "Sent a proposal and heard nothing back? Get a plain-English read on what the silence most likely means and what to do next.",
  },
];

export function FreeTools({ heading = "Free tools for your sales process" }: { heading?: string }) {
  return (
    <section aria-labelledby="free-tools-heading" className="mt-16">
      <h2 id="free-tools-heading" className="text-xl font-semibold text-slate-900 mb-6">
        {heading}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-purple-300 hover:shadow-sm"
          >
            <span className="inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700 mb-3">
              Free tool
            </span>
            <h3 className="text-base font-semibold text-slate-900 mb-2">{tool.title}</h3>
            <p className="text-sm leading-relaxed text-slate-500">{tool.description}</p>
            <span className="mt-4 inline-block text-sm font-medium text-purple-700">
              Try it free →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}