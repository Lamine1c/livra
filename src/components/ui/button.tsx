import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: "#1a1b1f",
    color: "#10B981",
    boxShadow: "-12px -12px 20px #1e1f24, 12px 12px 20px #0c0d11",
  },
  outline: {
    background: "#1a1b1f",
    color: "rgba(245,240,232,0.5)",
    boxShadow: "-12px -12px 20px #1e1f24, 12px 12px 20px #0c0d11",
  },
  secondary: {
    background: "#1a1b1f",
    color: "rgba(245,240,232,0.5)",
    boxShadow: "-12px -12px 20px #1e1f24, 12px 12px 20px #0c0d11",
  },
  destructive: {
    background: "#1a1b1f",
    color: "#F87171",
    boxShadow: "-12px -12px 20px #1e1f24, 12px 12px 20px #0c0d11",
  },
  ghost: {
    background: "transparent",
    color: "rgba(245,240,232,0.5)",
    boxShadow: "none",
  },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
          sizeClasses[size],
          className
        )}
        style={{
          borderRadius: 12,
          border: "none",
          ...variantStyles[variant],
          ...style,
        }}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
export { Button };
