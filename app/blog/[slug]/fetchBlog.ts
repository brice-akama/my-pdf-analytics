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
  translations?: {
    [lang: string]: {
      title: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
    };
  };
}

type Props = {
  params: { slug: string };
  searchParams: { lang?: string };
};

export async function generateMetadata(
  { params, searchParams }: Props
): Promise<Metadata> {
  const lang = searchParams.lang || 'en';

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/blog?slug=${params.slug}&lang=${lang}`,
    { cache: 'no-store' }
  );

  if (!res.ok) return {};

  const data = await res.json();
  const post: BlogPost = data.data;

  if (!post) return {};

  const translated = post.translations?.[lang];
  const title = translated?.metaTitle || post.metaTitle || post.title;
  const description =
    translated?.metaDescription || post.metaDescription || post.title;
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

export async function getBlogPost(slug: string, lang: string = 'en') {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/blog?slug=${slug}&lang=${lang}`,
    { cache: 'no-store' }
  );

  if (!res.ok) throw new Error('Failed to fetch blog post');
  const data = await res.json();
  return data.data;
}