import type { MetadataRoute } from "next";


async function getBlogSlugs(): Promise<string[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/blog?limit=100`,
      { cache: "no-store" }
    )
    if (!res.ok) return []
    const data = await res.json()
    const posts = data?.data?.posts || []
    return posts.map((p: { slug: string }) => p.slug).filter(Boolean)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const blogSlugs = await getBlogSlugs()

  const staticPages: MetadataRoute.Sitemap = [
    
    
    {
      url: "https://docmetrics.io",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://docmetrics.io/blog",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://docmetrics.io/pricing",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://docmetrics.io/contact",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
  url: "https://docmetrics.io/product/how-it-works",
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.8,
},
{
  url: "https://docmetrics.io/product/security",
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.8,
},
{
  url: "https://docmetrics.io/product/demo",
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.8,
},
{
  url: "https://docmetrics.io/features/analytics",
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.8,
},
{
  url: "https://docmetrics.io/solutions/sales",
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.8,
},
{
  url: "https://docmetrics.io/solutions/enterprise",
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.8,
},
{
  url: "https://docmetrics.io/solutions/fundraising",
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.8,
},
{
  url: "https://docmetrics.io/blog/best-practices",
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.7,
},

   
    {
      url: "https://docmetrics.io/privacy",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://docmetrics.io/terms",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
  url: "https://docmetrics.io/about",
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.7,
},
{
  url: "https://docmetrics.io/help",
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.7,
},
{
      url: "https://docmetrics.io/security",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: "https://docmetrics.io/cookies", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `https://docmetrics.io/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...blogPages]
}

   