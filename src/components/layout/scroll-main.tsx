"use client";

import { ReactNode, CSSProperties } from "react";

interface ScrollMainProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function ScrollMain({ className, style, children }: ScrollMainProps) {
  return (
    <main
      className={className}
      style={style}
      onScroll={(e) => {
        window.dispatchEvent(
          new CustomEvent("livra:scroll", {
            detail: { scrollTop: e.currentTarget.scrollTop },
          })
        );
      }}
    >
      {children}
    </main>
  );
}
