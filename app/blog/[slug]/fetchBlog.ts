// app/blog/[slug]/fetchBlog.ts
import 'server-only';
import { Metadata } from 'next';

interface BlogPost {
  title: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
}

// Generate metadata for this post
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/blog?slug=${params.slug}`,
    { cache: 'no-store' }
  );

  if (!res.ok) return {};

  const data = await res.json();
  const post: BlogPost = data.data;

  if (!post) return {};

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.title;
  const imageUrl = post.imageUrl;
  const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}/blog/${params.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: fullUrl,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL!),
  };
}

export async function getBlogPost(slug: string) {
  console.log("Fetching post with slug:", slug);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/blog?slug=${slug}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch blog post");
  }

  const data = await res.json();

  // ✅ unwrap the actual post from the response
  const post = data?.data?.post;

  if (!post) {
    console.error("❌ No post found in API response:", data);
    return null;
  }

  return post; // ✅ return the post directly, not the wrapper object
}
