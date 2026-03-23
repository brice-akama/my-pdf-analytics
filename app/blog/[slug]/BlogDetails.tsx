'use client'
import parse from 'html-react-parser'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  ArrowLeft,
  ArrowRight,
  Share2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from "sonner";

interface BlogPost {
  title: string
  content: string
  createdAt: string
  imageUrl?: string
  author?: string
  category?: string
  metaDescription?: string
}

export default function BlogDetails({ post }: { post: BlogPost }) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState("")
const [newsletterLoading, setNewsletterLoading] = useState(false)

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading post...</p>
        </div>
      </div>
    )
  }

  const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)


  const handleNewsletterSubmit = async () => {
  if (!newsletterEmail.trim()) {
    toast.error("Please enter your email address.");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newsletterEmail)) {
    toast.error("Please enter a valid email address.");
    return;
  }

  setNewsletterLoading(true);
  try {
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newsletterEmail }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("You are subscribed! Check your inbox for a confirmation.");
      setNewsletterEmail("");
    } else if (res.status === 429) {
      toast.error(data.error ?? "Too many attempts. Please try again later.");
    } else if (res.status === 409) {
      toast.error("This email is already subscribed.");
    } else {
      toast.error(data.error ?? "Something went wrong. Please try again.");
    }
  } catch {
    toast.error("Network error. Please check your connection.");
  } finally {
    setNewsletterLoading(false);
  }
};

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = post.title
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }
    if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    }
  }

  const AnchorTag = 'a' as const

const parseOptions = {
  replace: (domNode: any) => {
    if (domNode.type === 'tag' && domNode.name === 'img') {
      return (
        <img
          src={domNode.attribs.src}
          alt={domNode.attribs.alt || ''}
          className="w-full h-auto rounded-xl my-8"
        />
      )
    }
    if (domNode.type === 'tag' && domNode.name === 'a') {
      const href = domNode.attribs?.href || '#'
      const text = domNode.children?.[0]?.data ?? ''
      return (
        <AnchorTag
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:underline font-medium"
        >
          {text}
        </AnchorTag>
      )
    }
  },
}

  const htmlContent = /<\/?[a-z][\s\S]*>/i.test(post.content)
    ? post.content
    : post.content
        .split(/\n{2,}|\r{2,}/)
        .map((p) => `<p>${p.trim()}</p>`)
        .join('')

  return (
    <div className="min-h-screen bg-white">

      {/* ── BREADCRUMB ── */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-2 text-sm text-slate-400">
              <Link href="/" className="hover:text-slate-700 transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-slate-700 transition-colors">
                Blog
              </Link>
              <span>/</span>
              <span className="text-slate-600 truncate max-w-xs">
                {post.title}
              </span>
            </nav>
            <Link
              href="/blog"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Blog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-12 pb-10">

          <div className="flex items-center gap-3 mb-5">
            {post.category && (
              <span className="text-xs font-semibold uppercase tracking-widest text-sky-600 px-2.5 py-1 bg-sky-50 rounded-full">
                {post.category}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {readingTime} min read
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
            {post.title}
          </h1>

          {post.metaDescription && (
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-6 max-w-2xl">
              {post.metaDescription}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-slate-600">
                  {(post.author || 'A')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {post.author || 'DocMetrics Team'}
                </p>
                <p className="text-xs text-slate-400">Author</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 mr-1">Share</span>
              {[
                { platform: 'facebook', icon: Facebook, label: 'Facebook' },
                { platform: 'twitter', icon: Twitter, label: 'Twitter' },
                { platform: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
                { platform: 'copy', icon: Link2, label: copySuccess ? 'Copied' : 'Copy' },
              ].map(({ platform, icon: Icon, label }) => (
                <button
                  key={platform}
                  onClick={() => handleShare(platform)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>

          {showShareMenu && (
            <div className="sm:hidden flex flex-wrap gap-2 mt-4">
              {[
                { platform: 'facebook', icon: Facebook, label: 'Facebook' },
                { platform: 'twitter', icon: Twitter, label: 'Twitter' },
                { platform: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
                { platform: 'copy', icon: Link2, label: copySuccess ? 'Copied' : 'Copy link' },
              ].map(({ platform, icon: Icon, label }) => (
                <button
                  key={platform}
                  onClick={() => handleShare(platform)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FEATURED IMAGE ── */}
      {post.imageUrl && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10">
          <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden border border-slate-200">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-12">

          {/* ── ARTICLE ── */}
          <article className="lg:col-span-8">
            <div className="prose prose-slate max-w-none blog-content ...">
              {parse(htmlContent, parseOptions)}
            </div>

            {/* ── TAGS ── */}
            <div className="mt-10 pt-8 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-400">Tags:</span>
             
            </div>

            {/* ── AUTHOR BIO ── */}
            <div className="mt-10 border border-slate-200 rounded-2xl p-6 flex items-start gap-5">
              <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-slate-600">
                  {(post.author || 'A')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {post.author || 'DocMetrics Team'}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Writing about document sharing, analytics, and how teams use
                  DocMetrics to track engagement and close deals faster.
                </p>
              </div>
            </div>

            {/* ── BACK TO BLOG ── */}
            <div className="mt-10 pt-8 border-t border-slate-100">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to all articles
              </Link>
            </div>
          </article>

          {/* ── SIDEBAR ── */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-8 space-y-6">

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Navigation
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  <Link
                    href="/blog"
                    className="flex items-center gap-2 px-5 py-3.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
                    Back to all articles
                  </Link>
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-5 py-3.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    Go to homepage
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-5 py-3.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    Try DocMetrics free
                  </Link>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Newsletter
                </p>
                <h3 className="text-base font-semibold text-slate-900 mb-2 leading-snug">
                  Get the latest insights in your inbox.
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  New articles on document sharing, analytics, and closing
                  deals — delivered weekly.
                </p>
                <div className="space-y-2">
  <input
    type="email"
    value={newsletterEmail}
    onChange={(e) => setNewsletterEmail(e.target.value)}
    placeholder="your@email.com"
    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
  />
  <button
    onClick={handleNewsletterSubmit}
    disabled={newsletterLoading}
    className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
  >
    {newsletterLoading ? (
      <>
        <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        Subscribing...
      </>
    ) : (
      "Subscribe"
    )}
  </button>
</div>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  No spam. Unsubscribe anytime.
                </p>
              </div>

              <div className="bg-sky-600 rounded-2xl p-6 text-center">
                <h3 className="text-base font-semibold text-white mb-2 leading-snug">
                  Ready to try DocMetrics?
                </h3>
                <p className="text-sm text-white/80 leading-relaxed mb-5">
                  Upload your first document and see analytics in under two
                  minutes.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-sky-50 transition-colors text-sm"
                >
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-xs text-white/60 mt-3">
                  No credit card required
                </p>
              </div>

            </div>
          </aside>

        </div>
      </div>

    </div>
  )
}