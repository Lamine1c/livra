"use client";

import { useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  return { message, showToast };
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div
      aria-live="polite"
      className={`fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[70] flex items-center gap-2.5 rounded-[10px] bg-[#10B981] px-3.5 py-2.5 shadow-lg transition-all duration-300 ease-out ${
        message
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
      <p className="text-[13px] font-medium text-white leading-none">
        {message ?? " "}
      </p>
    </div>
  );
}
