import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function Section({ children, className = "", id }: SectionProps) {
  return (
    <section
      id={id}
      className={`py-24 md:py-32 px-6 max-w-5xl mx-auto ${className}`}
    >
      {children}
    </section>
  );
}
