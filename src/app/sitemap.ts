import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://golivra.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/cgu`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/blog/bienvenue-sur-le-blog-livra`, lastModified: new Date("2026-05-26"), changeFrequency: "monthly", priority: 0.6 },
  ];
}
