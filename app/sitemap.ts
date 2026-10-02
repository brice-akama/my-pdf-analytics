// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getBlogPosts, type BlogPost } from "@/app/blog/[slug]/fetchBlog";

const BASE = "https://docmetrics.io";

async function getPosts(): Promise<BlogPost[]> {
  try {
    const posts = await getBlogPosts();
    if (posts.length === 0) console.error("[sitemap] API returned 0 blog posts");
    return posts;
  } catch (e) {
    console.error("[sitemap] blog fetch failed:", e);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();

  const newestPost = posts
    .map((p) => new Date(p.updatedAt ?? p.createdAt ?? 0).getTime() || 0)
    .reduce((a, b) => Math.max(a, b), 0);

  // Update these dates ONLY when the page content really changes.
  const pages: { path: string; date: Date; priority: number }[] = [
    { path: "", date: new Date("2026-10-02"), priority: 1.0 },
    { path: "/blog", date: newestPost ? new Date(newestPost) : new Date("2026-10-02"), priority: 0.9 },
    { path: "/proposal-grader", date: new Date("2026-10-02"), priority: 0.9 },
    { path: "/silence-checker", date: new Date("2026-10-02"), priority: 0.9 },
    { path: "/blog/best-practices", date: new Date("2026-09-01"), priority: 0.7 },
    { path: "/pricing", date: new Date("2026-09-01"), priority: 0.8 },
    { path: "/product/how-it-works", date: new Date("2026-09-01"), priority: 0.8 },
    { path: "/product/security", date: new Date("2026-09-01"), priority: 0.7 },
    { path: "/product/demo", date: new Date("2026-09-01"), priority: 0.7 },
    { path: "/features/analytics", date: new Date("2026-09-01"), priority: 0.8 },
    { path: "/solutions/sales", date: new Date("2026-09-01"), priority: 0.8 },
    { path: "/solutions/enterprise", date: new Date("2026-09-01"), priority: 0.7 },
    { path: "/solutions/fundraising", date: new Date("2026-09-01"), priority: 0.7 },
    { path: "/about", date: new Date("2026-09-01"), priority: 0.5 },
    { path: "/contact", date: new Date("2026-09-01"), priority: 0.5 },
    { path: "/help", date: new Date("2026-09-01"), priority: 0.5 },
    { path: "/security", date: new Date("2026-09-01"), priority: 0.5 },
    { path: "/privacy", date: new Date("2026-05-01"), priority: 0.2 },
    { path: "/terms", date: new Date("2026-05-01"), priority: 0.2 },
    { path: "/cookies", date: new Date("2026-05-01"), priority: 0.2 },
  ];

  return [
    ...pages.map((p) => ({
      url: `${BASE}${p.path}`,
      lastModified: p.date,
      priority: p.priority,
    })),
    ...posts.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? p.createdAt ?? "2026-09-01"),
      priority: 0.7,
    })),
  ];
}