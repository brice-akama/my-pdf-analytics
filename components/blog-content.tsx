// components/blog-content.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, ArrowRight } from "lucide-react"
import { toast } from "sonner"

interface BlogPost {
  _id: string
  slug: string
  title: string
  imageUrl: string
  content: string
  metaTitle: string
  metaDescription: string
  author: string
  category: string
  createdAt: string
  updatedAt: string
}

export function BlogContent() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 12
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [newsletterLoading, setNewsletterLoading] = useState(false)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/blog")
        if (!res.ok) throw new Error("Failed to fetch blog posts")
        const response = await res.json()
        if (Array.isArray(response.data)) {
          setPosts(response.data)
        } else {
          throw new Error("Unexpected API response format")
        }
      } catch (error: unknown) {
        if (error instanceof Error) setError(error.message)
        else setError("An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const handleNewsletterSubmit = async () => {
    if (!newsletterEmail.trim()) {
      toast.error("Please enter your email address.")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newsletterEmail)) {
      toast.error("Please enter a valid email address.")
      return
    }
    setNewsletterLoading(true)
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("You are subscribed! Check your inbox for a confirmation.")
        setNewsletterEmail("")
      } else if (res.status === 429) {
        toast.error(data.error ?? "Too many attempts. Please try again later.")
      } else if (res.status === 409) {
        toast.error("This email is already subscribed.")
      } else {
        toast.error(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      toast.error("Network error. Please check your connection.")
    } finally {
      setNewsletterLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(posts.length / postsPerPage)

  const featuredPost = currentPosts[0]
  const remainingPosts = currentPosts.slice(1)
  const popularPosts = posts.slice(0, 4)

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading posts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid lg:grid-cols-12 gap-12">

        {/* ── LEFT: Posts ── */}
        <div className="lg:col-span-8 space-y-12">

          {/* Featured post */}
          {featuredPost && (
            <Link href={`/blog/${featuredPost.slug}`} className="group block">
              <article className="border border-slate-200 rounded-2xl overflow-hidden hover:border-sky-200 transition-colors">
                <div className="relative overflow-hidden h-64 sm:h-80">
                  <img
                    src={featuredPost.imageUrl}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-sky-600 px-2.5 py-1 bg-sky-50 rounded-full">
                      {featuredPost.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(featuredPost.createdAt)}
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-3 group-hover:text-sky-600 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-base text-slate-500 leading-relaxed mb-4 line-clamp-2">
                    {featuredPost.metaDescription}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      By{" "}
                      <span className="font-medium text-slate-600">
                        {featuredPost.author}
                      </span>
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 group-hover:text-sky-700 transition-colors">
                      Read article
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* Divider */}
          {remainingPosts.length > 0 && (
            <div className="border-t border-slate-100" />
          )}

          {/* Remaining posts grid */}
          {remainingPosts.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-8">
              {remainingPosts.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <article className="border border-slate-200 rounded-2xl overflow-hidden hover:border-sky-200 transition-colors h-full flex flex-col">
                    <div className="relative overflow-hidden h-44">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-widest text-sky-600 px-2 py-0.5 bg-sky-50 rounded-full">
                          {post.category}
                        </span>
                      </div>
                      <h2 className="text-base font-semibold text-slate-900 leading-snug mb-2 group-hover:text-sky-600 transition-colors line-clamp-2 flex-1">
                        {post.title}
                      </h2>
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">
                        {post.metaDescription}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 group-hover:text-sky-700 transition-colors">
                          Read
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 border-t border-slate-100">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all ${
                    currentPage === idx + 1
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="lg:col-span-4 space-y-8">

          {/* Popular posts */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Popular Posts
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {popularPosts.map((post, index) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-300 mt-1 w-4 flex-shrink-0 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-sky-600 block mb-1">
                      {post.category}
                    </span>
                    <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2 group-hover:text-sky-600 transition-colors">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="border border-slate-200 rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Newsletter
            </p>
            <h3 className="text-base font-semibold text-slate-900 mb-2 leading-snug">
              Get the latest insights in your inbox.
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              New articles on document sharing, analytics, and closing deals
              — delivered weekly.
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

          {/* CTA */}
          <div className="bg-sky-600 rounded-2xl p-6 text-center">
            <h3 className="text-base font-semibold text-white mb-2 leading-snug">
              Ready to try DocMetrics?
            </h3>
            <p className="text-sm text-white/80 leading-relaxed mb-5">
              Upload your first document and see analytics in under two minutes.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-sky-50 transition-colors text-sm"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-white/60 mt-3">No credit card required</p>
          </div>

        </div>
      </div>
    </div>
  )
}