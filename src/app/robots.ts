import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/ = endpoints serveur ; /billing/ = flux paiement/activation privés.
      disallow: ["/api/", "/billing/"],
    },
    sitemap: "https://golivra.app/sitemap.xml",
  };
}
