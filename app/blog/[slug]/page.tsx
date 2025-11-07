import { getBlogPost } from "./fetchBlog";
import BlogDetails from "./BlogDetails";
import { Metadata } from "next";

// ✅ Type for route params
type Props = {
  params: Promise<{ slug: string }>; // params is now async
};

// ✅ Optional revalidation (you can keep or remove)
export const revalidate = 60;

// ✅ Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 🧠 Unwrap params first
  const resolvedParams = await params;

  if (!resolvedParams?.slug) {
    console.warn("⚠️ generateMetadata called without a slug");
    return {};
  }

  // ✅ Fetch post safely
  const post = await getBlogPost(resolvedParams.slug).catch((err) => {
    console.error("❌ Failed to fetch post in generateMetadata:", err);
    return null;
  });

  if (!post) return {};

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.title;
  const imageUrl = post.imageUrl;
  const ogImageUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/blog/og?title=${encodeURIComponent(
    title
  )}`;
  const image = imageUrl || ogImageUrl;
  const canonicalUrl = `https://www.16zip.com/blog/${resolvedParams.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: image }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL!),
  };
}

// ✅ Page rendering logic
export default async function Page({ params }: Props) {
  const resolvedParams = await params; // 👈 same fix here

  if (!resolvedParams?.slug) {
    console.error("❌ Page rendered without a slug param");
    return <div>Invalid blog URL</div>;
  }

  const post = await getBlogPost(resolvedParams.slug).catch((err) => {
    console.error("❌ Failed to fetch blog post in Page:", err);
    return null;
  });

  if (!post) return <div>Post not found</div>;

  return <BlogDetails post={post} />;
}
