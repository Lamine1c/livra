import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/site/Footer";
import { getPost, getAllPosts, extractFaq } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

const SITE = "https://golivra.app";
const DEFAULT_OG = "/og-image-livra.png";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const url = `/magazine/${slug}`;
  const image = post.ogImage ?? DEFAULT_OG;

  return {
    title: `${post.title} — Magazine LIVRA`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url,
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  };
}

// Formateur de date déterministe : server === client → pas de hydration mismatch.
const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Rendu inline : **gras**, *italique*, [texte](lien) ─────────────
// Le contenu vient de nos propres .md (pas d'input utilisateur) — pas de HTML
// injecté, on construit des nœuds React (jamais dangerouslySetInnerHTML ici).
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(<strong key={k++}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      nodes.push(<em key={k++}>{m[2]}</em>);
    } else {
      nodes.push(
        <Link key={k++} href={m[4]} className="blog-inline-link" style={{ color: "var(--terracotta)" }}>
          {m[3]}
        </Link>
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ─── Rendu bloc : titres H2/H3, citation, liste numérotée, paragraphe ──
function renderBlock(block: string, i: number): React.ReactNode {
  const b = block.trim();

  if (b.startsWith("## ")) {
    return (
      <h2 key={i} className="text-2xl font-semibold mt-12 mb-4 leading-tight" style={{ color: "var(--ivoire)" }}>
        {renderInline(b.slice(3))}
      </h2>
    );
  }
  if (b.startsWith("### ")) {
    return (
      <h3 key={i} className="text-lg font-semibold mt-8 mb-3" style={{ color: "var(--ivoire)" }}>
        {renderInline(b.slice(4))}
      </h3>
    );
  }
  if (b.startsWith("> ")) {
    return (
      <blockquote
        key={i}
        className="my-8 pl-4 text-lg italic"
        style={{ borderLeft: "3px solid var(--terracotta)", color: "var(--ivoire)" }}
      >
        {renderInline(b.slice(2))}
      </blockquote>
    );
  }

  const lines = b.split("\n");

  // Liste numérotée : toutes les lignes commencent par "N. ".
  if (lines.length > 1 && lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
    return (
      <ol key={i} className="list-decimal pl-6 mb-6 space-y-2 text-base leading-relaxed" style={{ color: "var(--mist)" }}>
        {lines.map((l, j) => (
          <li key={j}>{renderInline(l.trim().replace(/^\d+\.\s/, ""))}</li>
        ))}
      </ol>
    );
  }

  // Bloc multi-lignes (ex. FAQ "**Q ?**\nRéponse") → sauts de ligne conservés.
  if (lines.length > 1) {
    return (
      <p key={i} className="text-base leading-relaxed mb-6" style={{ color: "var(--mist)" }}>
        {lines.map((l, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(l)}
          </Fragment>
        ))}
      </p>
    );
  }

  return (
    <p key={i} className="text-base leading-relaxed mb-6" style={{ color: "var(--mist)" }}>
      {renderInline(b)}
    </p>
  );
}

export default async function MagazineArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const canonical = `${SITE}/magazine/${slug}`;
  const image = `${SITE}${post.ogImage ?? DEFAULT_OG}`;

  // JSON-LD Article (schema.org) — auteur + éditeur = Organization LIVRA.
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    image,
    author: { "@type": "Organization", name: "LIVRA", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "LIVRA",
      logo: { "@type": "ImageObject", url: `${SITE}/android-chrome-512x512.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    url: canonical,
  };

  // JSON-LD FAQPage — dérivé de la section FAQ visible de l'article.
  const faq = extractFaq(post.paragraphs);
  const faqLd =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <main style={{ maxWidth: "42rem", margin: "0 auto", padding: "6rem 1.5rem 8rem" }}>
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
          {post.paragraphs.map((paragraph, i) => renderBlock(paragraph, i))}
        </article>
      </main>
      <Footer />
    </>
  );
}
