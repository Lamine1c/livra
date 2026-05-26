import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { getAllPosts, type BlogPost } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog LIVRA — Conseils e-commerce et livraison en Algérie",
  description:
    "Analyses, stratégies et chiffres réels du marché e-commerce algérien, par l'équipe LIVRA.",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
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

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-32">
        <h1
          className="text-4xl font-semibold mb-2"
          style={{ color: "var(--ivoire)" }}
        >
          Blog
        </h1>
        <p className="text-lg mb-16" style={{ color: "var(--mist)" }}>
          Analyses et strat&eacute;gies pour l&apos;e-commerce alg&eacute;rien.
        </p>

        {posts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--mist)" }}>
            Aucun article pour le moment. Revenez bient&ocirc;t.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
