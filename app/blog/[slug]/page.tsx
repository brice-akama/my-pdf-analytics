// app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts, stripHtml } from "./fetchBlog";
import BlogDetails from "./BlogDetails";
import { FreeTools } from "@/components/free-tools";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

// Pre-render every known post at build time (new posts render on first request).
export async function generateStaticParams() {
  try {
    const posts = await getBlogPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { robots: { index: false } };

  const title = post.metaTitle || post.title;
  const description =
    post.metaDescription || stripHtml(post.content).slice(0, 155) || post.title;
  const canonicalUrl = `https://docmetrics.io/blog/${slug}`;
  const image =
    post.imageUrl ||
    `${process.env.NEXT_PUBLIC_API_URL}/api/blog/og?title=${encodeURIComponent(title)}`;

  return {
    // Must be YOUR site, not the API host (the old code pointed this at the API URL).
    metadataBase: new URL("https://docmetrics.io"),
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "DocMetrics",
      type: "article",
      publishedTime: post.createdAt,
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  // Real 404 status instead of "Post not found" with HTTP 200 (a soft 404 Google ignores).
  if (!post) notFound();

  const url = `https://docmetrics.io/blog/${slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.metaTitle || post.title,
    description: post.metaDescription || undefined,
    image: post.imageUrl || undefined,
    datePublished: post.createdAt,
    dateModified: post.createdAt,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "DocMetrics", url: "https://docmetrics.io" },
    publisher: { "@type": "Organization", name: "DocMetrics", url: "https://docmetrics.io" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <BlogDetails post={post} />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-20">
        <FreeTools heading="Put this into practice with our free tools" />
      </div>
    </>
  );
}
