import fs from "fs";
import path from "path";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  ogImage?: string; // image OG dédiée (optionnelle) — sinon /og-image-livra.png
  paragraphs: string[]; // content split by \n\n, trimmed
};

function parseFrontmatter(raw: string): { fm: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { fm: {}, body: raw };
  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(": ");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 2).trim().replace(/^['"]|['"]$/g, "");
    fm[key] = value;
  }
  return { fm, body: match[2].trim() };
}

export function getAllPosts(): BlogPost[] {
  const dir = path.join(process.cwd(), "content/blog");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { fm, body } = parseFrontmatter(raw);
      return {
        slug: fm.slug ?? file.replace(".md", ""),
        title: fm.title ?? "",
        date: fm.date ?? "",
        author: fm.author ?? "Equipe LIVRA",
        excerpt: fm.excerpt ?? "",
        ogImage: fm.ogImage || undefined,
        paragraphs: body
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean)
          // Blocs non-lecteur : commentaires HTML (marqueurs [MÉDIA]/liens à venir
          // conservés en source mais masqués) et séparateurs `---` isolés.
          .filter((p) => !/^<!--[\s\S]*-->$/.test(p))
          .filter((p) => !/^-{3,}$/.test(p)),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): BlogPost | null {
  const all = getAllPosts();
  return all.find((p) => p.slug === slug) ?? null;
}

// Extrait les paires Question/Réponse de la section FAQ d'un article pour
// générer le JSON-LD FAQPage. Une entrée FAQ = un bloc `**Question ?**\nRéponse`
// (Q et R séparées par un seul \n, donc un seul bloc après split \n\n).
export function extractFaq(paragraphs: string[]): { question: string; answer: string }[] {
  const out: { question: string; answer: string }[] = [];
  let inFaq = false;
  for (const block of paragraphs) {
    if (/^##\s+FAQ/i.test(block)) {
      inFaq = true;
      continue;
    }
    if (inFaq && /^##\s/.test(block)) break; // section suivante → fin de la FAQ
    if (!inFaq) continue;
    const m = block.match(/^\*\*(.+?\?)\*\*\s*\n([\s\S]+)$/);
    if (m) out.push({ question: m[1].trim(), answer: m[2].trim() });
  }
  return out;
}
