import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
  ];
}


   