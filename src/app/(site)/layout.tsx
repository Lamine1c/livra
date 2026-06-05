// Scrollable wrapper for all public site pages.
// The root layout sets body { overflow: hidden } for the app —
// this layout creates a proper scroll context for marketing pages.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-onyx text-ivoire min-h-screen" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {children}
    </div>
  );
}
