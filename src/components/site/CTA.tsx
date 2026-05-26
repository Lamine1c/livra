import Link from "next/link";

interface CTAProps {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function CTA({ label, href, onClick, className = "" }: CTAProps) {
  const baseStyle: React.CSSProperties = {
    boxShadow: "var(--shadow-btn-primary)",
    display: "inline-block",
    minHeight: "52px",
    lineHeight: "1",
  };

  const baseClass =
    "bg-terracotta text-ivoire font-semibold rounded-[28px] px-8 py-4 " +
    "hover:brightness-110 transition-all duration-200 ease-out " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta " +
    className;

  if (href) {
    return (
      <Link
        href={href}
        className={baseClass}
        style={baseStyle}
        aria-label={label}
      >
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={baseClass}
      style={baseStyle}
      aria-label={label}
    >
      {label}
    </button>
  );
}
