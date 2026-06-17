import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/site/Footer";
import { getPost, getAllPosts } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Magazine LIVRA`,
    description: post.excerpt,
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function MagazineArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <main className="max-w-2xl mx-auto px-6 pt-24 pb-32">
        {/* Back link */}
        <Link href="/magazine" className="blog-back-link block text-sm mb-12">
          &larr; Magazine
        </Link>

        {/* Article header */}
        <p
          className="text-xs uppercase tracking-wider mb-3"
          style={{
            color: "var(--mist)",
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          }}
        >
          {formatDate(post.date)}
        </p>
        <h1
          className="text-3xl md:text-4xl font-semibold mb-2 leading-tight"
          style={{ color: "var(--ivoire)" }}
        >
          {post.title}
        </h1>
        <p className="text-sm mb-12" style={{ color: "var(--mist)" }}>
          Par {post.author}
        </p>
        <hr style={{ borderColor: "rgba(255,255,255,0.05)" }} />

        {/* Article body */}
        <article className="mt-12">
          {post.paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-base leading-relaxed mb-6"
              style={{ color: "var(--mist)" }}
            >
              {paragraph}
            </p>
          ))}
        </article>
      </main>
      <Footer />
    </>
  );
}
