// Scrollable wrapper for all public site pages.
// The root layout sets body { overflow: hidden } for the app —
// this layout creates a proper scroll context for marketing pages.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto bg-onyx text-ivoire" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {children}
    </div>
  );
}
