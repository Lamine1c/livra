"use client";

import { useState, useEffect, useCallback } from "react";
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

// Lien de nav desktop : <span> grisé non-cliquable si actif, sinon <Link>.
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

// Lien de nav drawer : même logique active que desktop ; sinon <Link> qui ferme le drawer.
function DrawerLink({
  href, label, pathname, open, onClose,
}: { href: string; label: string; pathname: string; open: boolean; onClose: () => void }) {
  if (isActive(href, pathname)) {
    return (
      <span className="hg-drawer__link hg-active" aria-current="page">
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className="hg-drawer__link" onClick={onClose} tabIndex={open ? 0 : -1}>
      {label}
    </Link>
  );
}

export default function HeaderGlobal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // Scroll-lock body + fermeture Escape, montés tant que le drawer est ouvert.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Sécurité app-router : fermer le drawer à tout changement de route.
  useEffect(() => {
    close();
  }, [pathname, close]);

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

        /* Burger → croix (bouton fonctionnel, z-60 au-dessus du drawer = bouton fermer) */
        .hg-burger {
          display: none; flex-direction: column; justify-content: center; gap: 5px;
          width: 26px; height: 18px; padding: 0; background: none; border: 0; cursor: pointer;
          position: relative; z-index: 60;
        }
        .hg-burger span {
          display: block; height: 1.8px; width: 100%; border-radius: 2px; background: var(--ivoire);
          transition: transform .28s ease, opacity .2s ease, width .28s ease; transform-origin: center;
        }
        .hg-burger span:last-child { width: 16px; align-self: flex-start; }
        .hg-burger.is-open span:nth-child(1) { transform: translateY(6.8px) rotate(45deg); }
        .hg-burger.is-open span:nth-child(2) { opacity: 0; }
        .hg-burger.is-open span:nth-child(3) { width: 100%; transform: translateY(-6.8px) rotate(-45deg); }

        /* Drawer mobile : overlay plein écran */
        .hg-drawer {
          position: fixed; inset: 0; z-index: 40;
          background: rgba(8,8,10,0.96);
          -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          opacity: 0; visibility: hidden;
          transition: opacity .28s ease, visibility .28s ease;
        }
        .hg-drawer.is-open { opacity: 1; visibility: visible; }
        .hg-drawer__link {
          font-size: 22px; color: var(--mist); text-decoration: none;
          padding: 14px 24px; min-height: 44px; display: flex; align-items: center;
          transition: color .2s ease;
        }
        .hg-drawer__link:hover { color: var(--ivoire); }
        .hg-drawer__link--login { color: var(--terracotta); font-weight: 600; }

        /* Bascule responsive : burger + drawer dès qu'on perd la nav desktop complète (≤1080px) */
        @media (max-width: 1080px) {
          .hg-links { display: none; }
          .hg-burger { display: flex; }
        }

        /* Accessibilité : pas d'animation si l'utilisateur le demande */
        @media (prefers-reduced-motion: reduce) {
          .hg-burger span, .hg-drawer { transition: none; }
        }
      `}</style>

      <div className="hg-inner">
        <Link href="/" aria-label="LIVRA — Accueil" className="hg-logo">
          <LivraLogoHorizontal height={22} />
        </Link>

        {/* Nav desktop (≥1081px) */}
        <nav className="hg-links" aria-label="Navigation principale">
          {/* Produit = ancre vers la section ProductDemo de la LP — toujours cliquable */}
          <Link href="/#produit" className="hg-link">Produit</Link>
          <PageLink href="/pricing" label="Tarifs" pathname={pathname} />
          <PageLink href="/magazine" label="Magazine" pathname={pathname} />
          <PageLink href="/telecharger" label="Télécharger" pathname={pathname} />
          {/* Se connecter = CTA ghost, toujours cliquable (pas de login web → /telecharger) */}
          <Link href="/telecharger" className="hg-link hg-login">Se connecter</Link>
        </nav>

        {/* Burger (≤1080px) */}
        <button
          type="button"
          className={`hg-burger${open ? " is-open" : ""}`}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="hg-drawer"
          onClick={() => setOpen((v) => !v)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      {/* Drawer mobile : clic sur le fond ferme */}
      <div
        id="hg-drawer"
        className={`hg-drawer${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <Link href="/#produit" className="hg-drawer__link" onClick={close} tabIndex={open ? 0 : -1}>Produit</Link>
        <DrawerLink href="/pricing" label="Tarifs" pathname={pathname} open={open} onClose={close} />
        <DrawerLink href="/magazine" label="Magazine" pathname={pathname} open={open} onClose={close} />
        <DrawerLink href="/telecharger" label="Télécharger" pathname={pathname} open={open} onClose={close} />
        <Link href="/telecharger" className="hg-drawer__link hg-drawer__link--login" onClick={close} tabIndex={open ? 0 : -1}>Se connecter</Link>
      </div>
    </header>
  );
}
