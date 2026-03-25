// app/sitemap-page/page.tsx  (or wherever your footer links to)
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Sitemap — DocMetrics",
  description: "All pages on DocMetrics — product, solutions, resources, and legal.",
  alternates: { canonical: "https://docmetrics.io/sitemap-page" },
  robots: { index: false }, // sitemap pages don't need to rank
}

const sections = [
  {
    title: "Product",
    links: [
      { label: "How It Works", href: "/product/how-it-works" },
      { label: "Document Analytics", href: "/features/analytics" },
      { label: "Security & Control", href: "/product/security" },
      { label: "See It In Action", href: "/product/demo" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Sales Teams", href: "/solutions/sales" },
      { label: "Fundraising", href: "/solutions/fundraising" },
      { label: "Client Portals", href: "/solutions/enterprise" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Security", href: "/security" },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-20">

        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-4">
          Sitemap
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight mb-12">
          All pages on DocMetrics
        </h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                {section.title}
              </p>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}