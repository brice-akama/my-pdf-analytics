'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowRight, TrendingUp } from 'lucide-react';

interface BlogPost {
  _id: string;
  slug: string;
  title: string;
  imageUrl: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  author: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/blog`);
        if (!res.ok) throw new Error('Failed to fetch blog posts');

        const response = await res.json();

        if (Array.isArray(response.data)) {
          setPosts(response.data);
        } else {
          throw new Error('Unexpected API response format');
        }
      } catch (error: unknown) {
        if (error instanceof Error) setError(error.message);
        else setError('An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const popularPosts = posts.slice(0, 3);

  // Split posts: first 2 for top row, rest for 3-column grid
  const topRowPosts = currentPosts.slice(0, 2);
  const gridPosts = currentPosts.slice(2);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl font-semibold">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              Insights & Resources
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed"
            >
              Expert advice, product updates, and industry insights to help you succeed
            </motion.p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* First Row: 2 Posts + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* First 2 Posts - Takes 2 columns */}
          <div className="lg:col-span-2">
            <motion.div 
              className="grid gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatePresence mode="wait">
                {topRowPosts.length > 0 ? (
                  topRowPosts.map((post, index) => (
                    <motion.article
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100"
                    >
                      <Link href={`/blog/${post.slug}`} className="block">
                        <div className="grid md:grid-cols-5 gap-6">
                          {/* Image */}
                          <div className="md:col-span-2 relative overflow-hidden h-64 md:h-auto">
                            <motion.img
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.5 }}
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>

                          {/* Content */}
                          <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                                  {post.category}
                                </span>
                                <div className="flex items-center text-gray-500 text-sm">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {formatDate(post.createdAt)}
                                </div>
                              </div>

                              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
                                {post.title}
                              </h2>

                              <p className="text-gray-600 text-base leading-relaxed mb-4 line-clamp-3">
                                {post.metaDescription}
                              </p>

                              <p className="text-sm text-gray-500">
                                By <span className="font-medium text-gray-700">{post.author}</span>
                              </p>
                            </div>

                            <div className="mt-6">
                              <div className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                                Read Article
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-200" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))
                ) : null}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Sidebar - Most Popular */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-xl sticky top-8"
            >
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
                <h3 className="text-2xl font-bold text-white">Most Popular</h3>
              </div>

              <div className="space-y-6">
                {popularPosts.map((post, index) => (
                  <Link 
                    key={post._id} 
                    href={`/blog/${post.slug}`}
                    className="block group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all duration-300 border border-white/20"
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-blue-200 uppercase font-semibold tracking-wide">
                            {post.category}
                          </span>
                          <h4 className="text-white font-semibold text-sm mt-1 line-clamp-2 group-hover:text-blue-100 transition-colors">
                            {post.title}
                          </h4>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Remaining Posts - 3 Column Grid */}
        {gridPosts.length > 0 && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {gridPosts.map((post, index) => (
              <motion.article
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  {/* Image */}
                  <div className="relative overflow-hidden h-48">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col h-64">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                          {post.category}
                        </span>
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200 leading-tight line-clamp-2">
                        {post.title}
                      </h2>

                      <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-3">
                        {post.metaDescription}
                      </p>
                    </div>

                    <div className="border-t pt-4 mt-auto">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-500 text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(post.createdAt)}
                        </div>
                        <div className="inline-flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700 transition-colors">
                          Read
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Previous
            </motion.button>
            
            {[...Array(totalPages)].map((_, idx) => (
              <motion.button
                key={idx + 1}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => paginate(idx + 1)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  currentPage === idx + 1
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {idx + 1}
              </motion.button>
            ))}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Next
            </motion.button>
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Subscribe to The Weekly Index for exclusive content
            </h2>
            <p className="text-blue-200 text-lg mb-8">
              Get the latest insights delivered straight to your inbox
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Subscribe Now
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}