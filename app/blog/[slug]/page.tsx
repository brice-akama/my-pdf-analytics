import { getBlogPost } from './fetchBlog';
import BlogDetails from './BlogDetails';
import { Metadata } from 'next';

type Props = {
  params: { slug: string };
  searchParams?: { lang?: string };
};

// TEMP: Comment out static path generation to prevent build errors
/*
export async function generateStaticParams() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog`);
  const data = await res.json();

  return Array.isArray(data)
    ? data.map((post: any) => ({ slug: post.slug }))
    : [];
}
*/

// Tell Next.js to use runtime rendering instead of static generation
export const dynamic = "force-dynamic";

// Metadata generation
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const lang = searchParams?.lang || 'en';
  const post = await getBlogPost(params.slug, lang);

  if (!post) return {};

  const translated = post.translations?.[lang];
  const title = translated?.metaTitle || post.metaTitle || post.title;
  const description =
    translated?.metaDescription || post.metaDescription || post.title;
  const imageUrl = post.imageUrl;
  const ogImageUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/blog/og?title=${encodeURIComponent(title)}`;
  const image = imageUrl || ogImageUrl;
  const canonicalUrl = `https://www.16zip.com/blog/${params.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: image }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
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

export const revalidate = 60;

// Page rendering
export default async function Page({ params, searchParams }: Props) {
  const lang = searchParams?.lang || 'en';
  const post = await getBlogPost(params.slug, lang);

  if (!post) return <div>Post not found</div>;

  return <BlogDetails post={post} />;
}