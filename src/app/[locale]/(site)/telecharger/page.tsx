import { useTranslations } from "next-intl";
import Footer from "@/components/site/Footer";

const CARD_SHADOW = "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 16px rgba(0,0,0,0.4)";

// ── Store logos ───────────────────────────────────────────────────────────────

function AppleLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c-.02-2.07 1.69-3.06 1.77-3.11-.96-1.41-2.46-1.6-2.99-1.62-1.27-.13-2.49.75-3.13.75-.65 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.38 2.05-1.44 2.5-.37 6.2 1.04 8.23.69.99 1.51 2.1 2.58 2.06 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.6.67 2.7.65 1.11-.02 1.82-1.01 2.5-2.01.79-1.15 1.11-2.27 1.13-2.33-.02-.01-2.17-.83-2.19-3.29zM15 6.13c.57-.69.96-1.65.85-2.61-.83.03-1.83.55-2.42 1.24-.53.61-.99 1.59-.87 2.53.93.07 1.87-.47 2.44-1.16z" />
    </svg>
  );
}

function PlayLogo({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3.6 2.3c-.25.26-.4.66-.4 1.18v17.04c0 .52.15.92.41 1.17l.06.05L13.2 12.1v-.2L3.66 2.25l-.06.05z" opacity="0.75" />
      <path fill="currentColor" d="M16.4 15.3l-3.2-3.2v-.2l3.2-3.2.07.04 3.79 2.15c1.08.61 1.08 1.62 0 2.24l-3.79 2.15-.07.04z" />
      <path fill="currentColor" d="M16.47 15.26L13.2 12 3.6 21.7c.36.38.94.42 1.6.05l11.27-6.49z" opacity="0.9" />
      <path fill="currentColor" d="M16.47 8.74L5.2 2.25c-.66-.38-1.24-.33-1.6.05L13.2 12l3.27-3.26z" opacity="0.6" />
    </svg>
  );
}

// ── Trust icons ───────────────────────────────────────────────────────────────

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

// Drapeau Algérie (ancrage DZ) — SVG inline couleur, pas d'emoji (rendu inconsistant cross-browser).
// Seule icône non-monochrome de la trust line : vert/blanc + croissant & étoile rouges.
const DzFlagIcon = ({ label }: { label: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" role="img" aria-label={label}>
    <defs>
      <clipPath id="dz-flag">
        <rect x="0" y="0" width="24" height="24" rx="3" />
      </clipPath>
    </defs>
    <g clipPath="url(#dz-flag)">
      <rect x="0" y="0" width="12" height="24" fill="#006233" />
      <rect x="12" y="0" width="12" height="24" fill="#FFFFFF" />
      {/* Croissant : disque rouge moins disque décalé (fill-rule even-odd) → ouvre vers la droite */}
      <path
        fillRule="evenodd"
        d="M11.5 6.8a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 1 0 0-10.4ZM13.2 7.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 1 1 0-8.4Z"
        fill="#D21034"
      />
      {/* Étoile 5 branches, nichée dans l'ouverture du croissant */}
      <path
        d="M15.3 9.4 15.92 11.15 17.77 11.2 15.92 12.32 16.83 14.1 15.3 13.05 13.77 14.1 14.3 12.32 12.83 11.2 14.68 11.15Z"
        fill="#D21034"
      />
    </g>
  </svg>
);

// ── Store card ────────────────────────────────────────────────────────────────

interface StoreCardProps {
  storeName: string;
  href: string;
  subLabel: string;
  btnIcon: React.ReactNode;
}

function StoreCard({ storeName, href, subLabel, btnIcon }: StoreCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="dl-store-card"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        background: "rgba(38,40,50,0.55)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px",
        padding: "40px",
        boxShadow: CARD_SHADOW,
        textDecoration: "none",
        cursor: "pointer",
        transition: "background .25s ease, border-color .25s ease, transform .25s ease",
      }}
    >
      <div style={{ color: "#F5F0E8", marginBottom: "16px", lineHeight: 0 }}>
        {btnIcon}
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.01em", color: "#F5F0E8" }}>
        {storeName}
      </div>
      <div style={{ marginTop: "8px", fontSize: "14px", color: "#8A8A8E" }}>
        {subLabel}
      </div>
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TelechargerPage() {
  const t = useTranslations("Telecharger");
  const TRUST: { icon: React.ReactNode; label: string }[] = [
    { icon: <LockIcon />, label: t("trustDonnees") },
    { icon: <ShieldIcon />, label: t("trustBouclier") },
    { icon: <MapPinIcon />, label: t("trustPosition") },
    { icon: <CheckCircleIcon />, label: t("trustEngagement") },
    { icon: <DzFlagIcon label={t("flagAria")} />, label: t("trustBledi") },
  ];
  return (
    <>
      <style>{`
        .dl-stores{display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:840px;margin:0 auto;padding:0 24px;}
        @media(max-width:980px){.dl-stores{grid-template-columns:1fr;max-width:440px;}}
        .dl-store-card:hover{background:rgba(217,119,87,0.08)!important;border-color:rgba(217,119,87,0.40)!important;transform:translateY(-4px);}
      `}</style>

      <main style={{ background: "#0E0E10", position: "relative", isolation: "isolate", overflow: "hidden", paddingBottom: "clamp(60px,8vw,100px)" }}>
        {/* Ivoire ambient glow */}
        <div aria-hidden="true" style={{
          position: "absolute", top: "-8%", left: "50%", transform: "translateX(-50%)",
          width: "min(1000px,140vw)", height: "620px",
          background: "radial-gradient(ellipse 50% 50% at 50% 35%, rgba(245,240,232,0.05) 0%, rgba(245,240,232,0.015) 40%, transparent 66%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* ── Hero ── */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "760px", margin: "0 auto", padding: "clamp(48px,7vw,88px) 24px clamp(44px,5vw,64px)" }}>
          <p style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontSize: "12.5px", fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8A8A8E", marginBottom: "22px" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D97757", boxShadow: "0 0 12px 1px rgba(217,119,87,0.7)", flexShrink: 0 }} />
            {t("eyebrow")}
          </p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(48px,7vw,72px)", lineHeight: "1.0", letterSpacing: "-0.04em", color: "#F5F0E8" }}>
            {t("h1")}
          </h1>
          <p style={{ margin: "22px auto 0", maxWidth: "44ch", fontSize: "clamp(15px,1.4vw,18px)", lineHeight: "1.55", color: "#8A8A8E" }}>
            {t("heroSub")}
          </p>
        </div>

        {/* ── Store cards ── */}
        <div className="dl-stores" style={{ position: "relative", zIndex: 1 }}>
          <StoreCard
            storeName="App Store"
            href="https://apps.apple.com/app/livra/id_PLACEHOLDER"
            subLabel={t("appleSub")}
            btnIcon={<AppleLogo size={32} />}
          />
          <StoreCard
            storeName="Google Play"
            href="https://play.google.com/store/apps/details?id=app.golivra.mobile"
            subLabel={t("playSub")}
            btnIcon={<PlayLogo size={32} />}
          />
        </div>

        {/* ── Already registered note ── */}
        <p style={{
          position: "relative", zIndex: 1,
          textAlign: "center",
          margin: "clamp(20px,2.5vw,28px) auto 0",
          maxWidth: "420px",
          padding: "0 24px",
          fontSize: "13px",
          color: "#8A8A8E",
        }}>
          {t("dejaInscrit")}
        </p>

        {/* ── Trust ── */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "clamp(20px,3vw,48px)", flexWrap: "wrap",
          margin: "clamp(44px,5vw,64px) auto 0", maxWidth: "800px",
          padding: "0 24px",
        }}>
          {TRUST.map((t, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "9px", fontSize: "13px", color: "var(--mist)", whiteSpace: "nowrap" }}>
              {t.icon}
              {t.label}
            </span>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
