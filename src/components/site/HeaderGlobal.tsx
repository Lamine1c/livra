"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LivraLogoHorizontal from "@/components/brand/LivraLogoHorizontal";

// Active-state : un lien de page est "actif" (grisé + non-cliquable) quand la
// route courante matche son href. Magazine couvre /magazine ET /magazine/[slug].
function isActive(href: string, pathname: string): boolean {
  if (href === "/magazine") {
    return pathname === "/magazine" || pathname.startsWith("/magazine/");
  }
  return pathname === href;
}

function PageLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  if (isActive(href, pathname)) {
    return (
      <span className="hg-link hg-active" aria-current="page">
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className="hg-link">
      {label}
    </Link>
  );
}

export default function HeaderGlobal() {
  const pathname = usePathname();

  return (
    <header className="hg">
      <style>{`
        .hg {
          position: sticky; top: 0; z-index: 50;
          background: rgba(14,14,16,0.85);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--hair);
        }
        .hg-inner {
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; padding: 0 clamp(22px, 5vw, 40px);
        }
        .hg-logo { display: inline-flex; align-items: center; flex-shrink: 0; }
        .hg-links { display: flex; align-items: center; gap: 36px; }
        .hg-link {
          color: var(--mist); text-decoration: none; font-size: 14px; line-height: 1;
          transition: color .3s ease, opacity .3s ease;
        }
        .hg-link:hover { color: var(--ivoire); }
        .hg-login { color: var(--ivoire); font-weight: 500; }
        .hg-active { color: var(--mist); opacity: 0.4; pointer-events: none; cursor: default; }
        .hg-burger { display: none; flex-direction: column; gap: 5px; width: 24px; cursor: pointer; }
        .hg-burger span { height: 1.6px; border-radius: 2px; background: var(--mist); }
        .hg-burger span:last-child { width: 15px; }

        /* Tablette ≤1080px : on masque les liens de page, on garde "Se connecter" */
        @media (max-width: 1080px) {
          .hg-links .hg-link:not(.hg-login) { display: none; }
        }
        /* Mobile ≤720px : nav cachée, burger affiché (décoratif — parité LP) */
        @media (max-width: 720px) {
          .hg-links { display: none; }
          .hg-burger { display: flex; }
        }
      `}</style>

      <div className="hg-inner">
        <Link href="/" aria-label="LIVRA — Accueil" className="hg-logo">
          <LivraLogoHorizontal height={22} />
        </Link>

        <nav className="hg-links" aria-label="Navigation principale">
          {/* Produit = ancre vers la section ProductDemo de la LP — toujours cliquable */}
          <Link href="/#produit" className="hg-link">Produit</Link>
          <PageLink href="/pricing" label="Tarifs" pathname={pathname} />
          <PageLink href="/magazine" label="Magazine" pathname={pathname} />
          <PageLink href="/telecharger" label="Télécharger" pathname={pathname} />
          {/* Se connecter = CTA ghost, toujours cliquable (pas de login web → /telecharger) */}
          <Link href="/telecharger" className="hg-link hg-login">Se connecter</Link>
        </nav>

        <div className="hg-burger" aria-label="Menu">
          <span></span><span></span><span></span>
        </div>
      </div>
    </header>
  );
}
