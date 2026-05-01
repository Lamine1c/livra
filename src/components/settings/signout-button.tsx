"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignoutButton() {
  const router = useRouter();

  const handleSignout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignout}
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: 12,
        border: "1px solid rgba(239,68,68,0.2)",
        background: "transparent",
        color: "rgba(239,68,68,0.7)",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      Se déconnecter
    </button>
  );
}
