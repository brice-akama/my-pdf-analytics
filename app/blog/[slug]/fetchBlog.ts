// app/blog/[slug]/fetchBlog.ts
import "server-only";
import { cache } from "react";

export interface BlogPost {
  _id?: string;
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  imageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  author?: string;
  category?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "https://docmetrics.io";

// The list endpoint returns { data: [...posts], total } (that is what BlogContent reads).
// We also accept { data: { posts: [...] } } so either shape works.
async function fetchPage(page: number, limit: number) {
  const res = await fetch(`${API}/api/blog?limit=${limit}&page=${page}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Blog list API error ${res.status}`);

  const json = await res.json();
  const d = json?.data;
  const posts: BlogPost[] = Array.isArray(d) ? d : Array.isArray(d?.posts) ? d.posts : [];
  const total: number =
    typeof json?.total === "number" ? json.total : typeof d?.total === "number" ? d.total : posts.length;
  return { posts, total };
}

// One page of posts (used by /blog for the first server-rendered batch).
export const getBlogPage = cache(async (page = 1, limit = 6) => fetchPage(page, limit));

// ALL posts (used by the sitemap and generateStaticParams). Pages through the API
// and de-duplicates by slug, so it is safe even if the API caps `limit`.
export const getBlogPosts = cache(async (): Promise<BlogPost[]> => {
  const bySlug = new Map<string, BlogPost>();
  let total = Infinity;

  for (let page = 1; page <= 30 && bySlug.size < total; page++) {
    const r = await fetchPage(page, 50);
    const before = bySlug.size;
    for (const p of r.posts) if (p?.slug) bySlug.set(p.slug, p);
    total = r.total;
    if (bySlug.size === before) break; // no new posts → stop
  }
  return [...bySlug.values()];
});

// Returns null ONLY for a real 404 so the page can call notFound().
// Other failures throw, so Google gets an error and retries instead of a soft 404.
export const getBlogPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const res = await fetch(`${API}/api/blog?slug=${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Blog API error ${res.status} for slug "${slug}"`);

  const json = await res.json();
  const d = json?.data;
  const post = d?.post ?? (d && !Array.isArray(d) && d.title ? d : null);
  return post ? { ...post, slug } : null;
});

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}