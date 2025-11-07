'use client';
import parse from 'html-react-parser';
import Image from 'next/image';
import Head from 'next/head';
import Link from 'next/link';
import { Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin, Link2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface BlogPost {
  title: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  author?: string;
  category?: string;
  metaDescription?: string;
}

export default function BlogDetails({ post }: { post: BlogPost }) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading blog post...</p>
        </div>
      </div>
    );
  }

  // Calculate reading time (average 200 words per minute)
  const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  // Structured Data (JSON-LD) for the blog post
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.imageUrl || '',
    datePublished: post.createdAt,
    dateModified: post.createdAt,
    author: {
      '@type': 'Person',
      name: post.author || 'Author Name',
    },
    description: post.metaDescription || post.content.slice(0, 150),
    articleBody: post.content,
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post.title;

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <>
      {/* Add structured data using next/head */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Back Button & Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <nav className="flex items-center space-x-2 text-sm text-gray-600" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  Home
                </Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-blue-600 transition-colors">
                  Blog
                </Link>
                <span>/</span>
                <span className="text-gray-400 truncate max-w-xs">{post.title}</span>
              </nav>
              
              <Link 
                href="/blog" 
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Blog</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            {/* Category Badge */}
            {post.category && (
              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold uppercase tracking-wide">
                  {post.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-blue-100">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="font-medium">{post.author || 'Author Name'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>
                  {new Date(post.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12">
            {/* Sidebar - Share Buttons (Desktop) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="text-sm font-semibold text-gray-500 mb-4">Share</div>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-lg hover:shadow-xl"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl"
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl relative"
                  aria-label="Copy link"
                >
                  <Link2 className="w-5 h-5" />
                  {copySuccess && (
                    <span className="absolute -right-16 top-1/2 -translate-y-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Article Content */}
            <article className="lg:col-span-8">
              {/* Featured Image */}
              {post.imageUrl && (
                <div className="relative w-full h-[300px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl mb-12 -mt-24 border-8 border-white">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    layout="fill"
                    objectFit="cover"
                    unoptimized
                    className="hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}

              {/* Mobile Share Button */}
              <div className="lg:hidden mb-8">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="font-medium">Share Article</span>
                </button>
                
                {showShareMenu && (
                  <div className="flex gap-3 mt-4 flex-wrap">
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      <span className="text-sm">Facebook</span>
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="text-sm">Twitter</span>
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="text-sm">LinkedIn</span>
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
                    >
                      <Link2 className="w-4 h-4" />
                      <span className="text-sm">{copySuccess ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Article Body */}
              <div className="prose prose-lg max-w-none 
                prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-12
                prose-h2:text-3xl prose-h2:mb-5 prose-h2:mt-10 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-3
                prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8
                prose-h4:text-xl prose-h4:mb-3 prose-h4:mt-6
                prose-p:text-gray-700 prose-p:leading-8 prose-p:mb-6 prose-p:text-lg
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline prose-a:font-medium prose-a:transition-colors
                prose-strong:text-gray-900 prose-strong:font-bold
                prose-em:text-gray-800 prose-em:italic
                prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:overflow-x-auto
                prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:bg-blue-50 prose-blockquote:py-4 prose-blockquote:rounded-r-lg
                prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6 prose-ul:space-y-2
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-6 prose-ol:space-y-2
                prose-li:text-gray-700 prose-li:leading-7
                prose-img:rounded-2xl prose-img:shadow-2xl prose-img:my-8 prose-img:mx-auto
                prose-hr:border-gray-200 prose-hr:my-12
                prose-table:border prose-table:border-gray-200 prose-table:rounded-lg prose-table:overflow-hidden
                prose-th:bg-gray-100 prose-th:font-semibold prose-th:text-left prose-th:p-3
                prose-td:p-3 prose-td:border-t prose-td:border-gray-200
              ">
                {parse(
                  /<\/?[a-z][\s\S]*>/i.test(post.content)
                    ? post.content
                    : post.content
                        .split(/\n{2,}|\r{2,}/)
                        .map(p => `<p>${p.trim()}</p>`)
                        .join(''),
                  {
                    replace: (domNode: any) => {
                      if (domNode.name === 'img') {
                        return (
                          <img
                            src={domNode.attribs.src}
                            alt={domNode.attribs.alt || ''}
                            className="max-w-full w-full h-auto rounded-2xl shadow-2xl my-8 mx-auto"
                          />
                        );
                      }
                      if (domNode.name === 'a') {
                        return (
                          <a
                            href={domNode.attribs.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                          >
                            {domNode.children[0]?.data}
                          </a>
                        );
                      }
                    },
                  }
                )}
              </div>

              {/* Tags Section (if you have tags) */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-semibold text-gray-500">Tags:</span>
                  {/* Add your tags here */}
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
                    {post.category || 'Technology'}
                  </span>
                </div>
              </div>

              {/* Author Bio Section */}
              <div className="mt-12 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {(post.author || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      About {post.author || 'the Author'}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      A passionate writer sharing insights and expertise on topics that matter. 
                      Follow for more in-depth articles and industry analysis.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Right Sidebar - Table of Contents or Related Posts */}
            <aside className="lg:col-span-3">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-600 rounded"></span>
                    Quick Navigation
                  </h3>
                  <div className="space-y-3 text-sm">
                    <Link href="/blog" className="block text-gray-600 hover:text-blue-600 transition-colors">
                      ← Back to all articles
                    </Link>
                    <Link href="/" className="block text-gray-600 hover:text-blue-600 transition-colors">
                      Go to homepage
                    </Link>
                  </div>
                </div>

                {/* Newsletter Signup */}
                <div className="mt-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                  <h3 className="text-xl font-bold mb-3">Stay Updated</h3>
                  <p className="text-blue-100 text-sm mb-4">
                    Get the latest insights delivered to your inbox
                  </p>
                  <button className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="bg-gradient-to-r from-gray-900 to-blue-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to explore more insights?
            </h2>
            <p className="text-blue-200 text-lg mb-8">
              Discover more articles, tips, and resources on our blog
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              View All Articles
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}