import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/site/Footer";
import { getAllPosts, type BlogPost } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Magazine — LIVRA",
  description:
    "Analyses, stratégies et chiffres réels du e-commerce et de la livraison COD en Algérie, par l'équipe LIVRA.",
  alternates: { canonical: "/magazine" },
  openGraph: {
    type: "website",
    title: "Magazine — LIVRA",
    description:
      "Analyses, stratégies et chiffres réels du e-commerce et de la livraison COD en Algérie, par l'équipe LIVRA.",
    url: "/magazine",
    images: [{ url: "/og-image-livra.png", width: 1200, height: 630, alt: "LIVRA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Magazine — LIVRA",
    description:
      "Analyses, stratégies et chiffres réels du e-commerce et de la livraison COD en Algérie, par l'équipe LIVRA.",
    images: ["/og-image-livra.png"],
  },
};

// Formateur de date déterministe : server === client → pas de hydration mismatch.
// toLocaleDateString("fr-FR") dépend de l'ICU et peut différer Node vs navigateur.
const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/magazine/${post.slug}`}
      className="blog-card block rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: "var(--surface)",
        border: "var(--border-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Cover placeholder */}
      <div
        className="h-40 flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, var(--surface) 0%, var(--deep) 100%)",
        }}
      >
        <span
          className="text-4xl font-bold tracking-widest select-none"
          style={{ color: "var(--mist)", opacity: 0.1 }}
        >
          LIVRA
        </span>
      </div>

      {/* Body */}
      <div className="p-6">
        <p
          className="text-xs uppercase tracking-wider mb-3"
          style={{
            color: "var(--mist)",
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          }}
        >
          {formatDate(post.date)}
        </p>
        <h3
          className="text-base font-semibold mb-2 line-clamp-2"
          style={{ color: "var(--ivoire)" }}
        >
          {post.title}
        </h3>
        <p
          className="text-sm leading-relaxed line-clamp-2"
          style={{ color: "var(--mist)" }}
        >
          {post.excerpt}
        </p>
        <p className="text-xs mt-4" style={{ color: "var(--mist)" }}>
          {post.author}
        </p>
      </div>
    </Link>
  );
}

export default function MagazineIndexPage() {
  const posts = getAllPosts();

  return (
    <>
      <style>{`
        .mag-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 980px) {
          .mag-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .mag-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <main style={{ maxWidth: "64rem", margin: "0 auto", padding: "6rem 1.5rem 8rem" }}>
        <h1
          className="text-4xl font-semibold mb-2"
          style={{ color: "var(--ivoire)" }}
        >
          Magazine
        </h1>
        <p className="text-lg mb-16" style={{ color: "var(--mist)" }}>
          Analyses et strat&eacute;gies pour l&apos;e-commerce alg&eacute;rien.
        </p>

        {posts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--mist)" }}>
            Aucun article pour le moment. Revenez bient&ocirc;t.
          </p>
        ) : (
          <div className="mag-grid">
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
