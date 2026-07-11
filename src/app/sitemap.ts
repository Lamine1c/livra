import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://golivra.app";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/telecharger`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/magazine`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/cgu`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Articles du magazine listés dynamiquement (ex-/blog → /magazine/[slug]).
  const articleRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${base}/magazine/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
