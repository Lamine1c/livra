// ────────────────────────────────────────────────────────────────
// SectionCta.tsx — CTA contextuel réutilisable
//
// Traduit la promesse d'une section en action. À insérer en bas du
// return JSX de S4 (OTP), S5 (Pinpoint), S6 (Tracking), S7 (Philosophy).
// S9 FinalCta est un composant distinct — ne pas remplacer.
//
// • Tokens couleur depuis globals.css ; police Inter via next/font.
// • Scroll-in : fade + translateY 8→0 (250ms ease-out), une seule fois,
//   via IntersectionObserver. Respecte prefers-reduced-motion.
// ────────────────────────────────────────────────────────────────
'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SectionCta.module.css';

export interface SectionCtaProps {
  /** Texte du bouton — la promesse de la section. */
  label: string;
  /** Micro-texte de réassurance sous le bouton. */
  subtext: string;
  /** Cible du bouton. Par défaut "#" (câblage ultérieur). */
  href?: string;
  /** Optionnel — exposé en data-section-id pour l'analytics. */
  sectionId?: string;
}

export default function SectionCta({
  label,
  subtext,
  href = '#',
  sectionId,
}: SectionCtaProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    io.observe(el);

    // Garde-fou : révéler si déjà dans le viewport au montage.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) setInView(true);

    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.cta} ${inView ? styles.isIn : ''}`}
      data-section-id={sectionId}
    >
      <a className={styles.btn} href={href}>{label}</a>
      <p className={styles.sub}>{subtext}</p>
    </div>
  );
}
