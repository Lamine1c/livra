import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, style, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-medium md:text-sm md:text-gray-700"
            style={{ color: "rgba(245,240,232,0.5)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full outline-none border-none transition-colors disabled:opacity-50",
            className
          )}
          style={{
            background: "#1a1b1f",
            color: "#F5F0E8",
            fontSize: 16,
            borderRadius: 12,
            padding: "12px 16px",
            boxShadow: error
              ? "inset 4px 4px 8px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.03), inset 0 0 0 1px rgba(248,113,113,0.4)"
              : "inset 4px 4px 8px rgba(0,0,0,0.45), inset -2px -2px 6px rgba(255,255,255,0.03)",
            ...style,
          }}
          {...props}
        />
        {error && (
          <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
export { Input };
