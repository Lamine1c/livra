// Layout des pages /billing — SACRÉES (hors i18n, liens d'email/paiement).
// Wrapper Onyx identique au marketing (fond sombre + texte ivoire) mais SANS
// HeaderGlobal ni provider i18n : ce sont des pages de confirmation terminales.
export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-onyx text-ivoire min-h-screen flex flex-col"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {children}
    </div>
  );
}
