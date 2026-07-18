import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

const base = "https://golivra.app";

// Routes marketing TRADUITES (fr + ar) → chaque route émet sa version fr
// (sans préfixe) et sa version /ar, avec hreflang réciproque + x-default.
const TRANSLATED: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/telecharger", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
];

// Routes FR uniquement (non traduites — magazine/articles, légal).
const FR_ONLY: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/magazine", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
  { path: "/cgu", changeFrequency: "monthly", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const translated: MetadataRoute.Sitemap = TRANSLATED.flatMap(({ path, changeFrequency, priority }) => {
    const frUrl = `${base}${path}`;
    const arUrl = `${base}/ar${path}`;
    const languages = { fr: frUrl, ar: arUrl, "x-default": frUrl };
    return [
      { url: frUrl, lastModified: now, changeFrequency, priority, alternates: { languages } },
      { url: arUrl, lastModified: now, changeFrequency, priority: Math.round(priority * 90) / 100, alternates: { languages } },
    ];
  });

  const frOnly: MetadataRoute.Sitemap = FR_ONLY.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // Articles du magazine (fr uniquement — traduction blog = chantier séparé).
  const articleRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${base}/magazine/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...translated, ...frOnly, ...articleRoutes];
}
