"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
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

// Sélecteur de langue FR | العربية — bascule en préservant le chemin courant.
// `variant` : "nav" (desktop) ou "drawer" (mobile). Le libellé « Français » /
// « العربية » reste tel quel dans les deux langues (glossaire inviolable).
function LangSwitch({ variant }: { variant: "nav" | "drawer" }) {
  const t = useTranslations("Header");
  const locale = useLocale();
  const pathname = usePathname(); // chemin SANS préfixe locale (@/i18n/navigation)
  const router = useRouter();

  const switchTo = (target: "fr" | "ar") => {
    if (target === locale) return;
    router.replace(pathname, { locale: target });
  };

  return (
    <div className={`hg-lang hg-lang--${variant}`} role="group" aria-label={t("langue")}>
      <button
        type="button"
        className={`hg-lang__opt${locale === "fr" ? " is-active" : ""}`}
        aria-pressed={locale === "fr"}
        onClick={() => switchTo("fr")}
      >
        {t("langFr")}
      </button>
      <span className="hg-lang__sep" aria-hidden="true" />
      <button
        type="button"
        className={`hg-lang__opt${locale === "ar" ? " is-active" : ""}`}
        aria-pressed={locale === "ar"}
        onClick={() => switchTo("ar")}
      >
        {t("langAr")}
      </button>
    </div>
  );
}

export default function HeaderGlobal() {
  const t = useTranslations("Header");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // garde SSR pour le portal
  const close = useCallback(() => setOpen(false), []);

  // Le portal n'existe qu'après le mount client (document indisponible en SSR).
  // eslint-disable-next-line react-hooks/set-state-in-effect -- pattern standard de garde SSR pour createPortal.
  useEffect(() => setMounted(true), []);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation volontaire avec un système externe (navigation app-router).
    close();
  }, [pathname, close]);

  // Drawer rendu hors du <header> via portal vers <body> (cf. CSS .hg-drawer).
  const drawer = (
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
      <Link href="/#produit" className="hg-drawer__link" onClick={close} tabIndex={open ? 0 : -1}>{t("produit")}</Link>
      <DrawerLink href="/pricing" label={t("tarifs")} pathname={pathname} open={open} onClose={close} />
      <DrawerLink href="/magazine" label={t("magazine")} pathname={pathname} open={open} onClose={close} />
      <DrawerLink href="/telecharger" label={t("telecharger")} pathname={pathname} open={open} onClose={close} />
      <Link href="/telecharger" className="hg-drawer__link hg-drawer__link--login" onClick={close} tabIndex={open ? 0 : -1}>{t("seConnecter")}</Link>
      <LangSwitch variant="drawer" />
    </div>
  );

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

        /* Sélecteur de langue FR | العربية — couleurs cohérentes avec la nav (mist/ivoire) */
        .hg-lang { display: inline-flex; align-items: center; gap: 8px; }
        .hg-lang__opt {
          background: none; border: 0; padding: 0; cursor: pointer; font-family: inherit;
          color: var(--mist); font-size: 14px; line-height: 1;
          transition: color .3s ease, opacity .3s ease;
        }
        .hg-lang__opt:hover { color: var(--ivoire); }
        .hg-lang__opt.is-active { color: var(--ivoire); font-weight: 500; opacity: 1; cursor: default; }
        .hg-lang__sep { width: 1px; height: 12px; background: var(--hair); }
        /* Variante drawer : plus grande, alignée sur les liens du drawer */
        .hg-lang--drawer { gap: 14px; margin-top: 10px; }
        .hg-lang--drawer .hg-lang__opt { font-size: 18px; padding: 8px 4px; min-height: 36px; }
        .hg-lang--drawer .hg-lang__sep { height: 16px; }

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

        /* Drawer mobile : overlay plein écran.
           ⚠ Rendu en PORTAL vers <body> (cf. JSX) : le <header> a backdrop-filter, qui crée un
           containing block pour position:fixed. Hors du header → inset:0 retombe sur le viewport. */
        .hg-drawer {
          position: fixed; inset: 0; z-index: 45; /* < header(50) : logo + croix restent au-dessus */
          background: #0E0E10; /* opaque, fallback hexa en dur */
          background: var(--onyx, #0E0E10);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          /* pousse les items sous le header (+ safe-area notch iOS) */
          padding-top: max(72px, env(safe-area-inset-top));
          padding-bottom: max(24px, env(safe-area-inset-bottom));
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
        /* Desktop-safety : le drawer ne doit jamais capturer les clics au-dessus du breakpoint */
        @media (min-width: 1081px) {
          .hg-drawer { display: none; }
        }

        /* Accessibilité : pas d'animation si l'utilisateur le demande */
        @media (prefers-reduced-motion: reduce) {
          .hg-burger span, .hg-drawer { transition: none; }
        }
      `}</style>

      <div className="hg-inner">
        <Link href="/" aria-label={t("logoAria")} className="hg-logo">
          <LivraLogoHorizontal height={22} />
        </Link>

        {/* Nav desktop (≥1081px) */}
        <nav className="hg-links" aria-label="Navigation principale">
          {/* Produit = ancre vers la section ProductDemo de la LP — toujours cliquable */}
          <Link href="/#produit" className="hg-link">{t("produit")}</Link>
          <PageLink href="/pricing" label={t("tarifs")} pathname={pathname} />
          <PageLink href="/magazine" label={t("magazine")} pathname={pathname} />
          <PageLink href="/telecharger" label={t("telecharger")} pathname={pathname} />
          {/* Se connecter = CTA ghost, toujours cliquable (pas de login web → /telecharger) */}
          <Link href="/telecharger" className="hg-link hg-login">{t("seConnecter")}</Link>
          {/* Sélecteur de langue FR | العربية */}
          <LangSwitch variant="nav" />
        </nav>

        {/* Burger (≤1080px) */}
        <button
          type="button"
          className={`hg-burger${open ? " is-open" : ""}`}
          aria-label={open ? t("fermerMenu") : t("ouvrirMenu")}
          aria-expanded={open}
          aria-controls="hg-drawer"
          onClick={() => setOpen((v) => !v)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      {/* Portal : sort le drawer du containing-block créé par backdrop-filter sur le <header> */}
      {mounted && createPortal(drawer, document.body)}
    </header>
  );
}
