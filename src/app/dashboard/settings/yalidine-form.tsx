"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface YalidineFormProps {
  apiId: string | null;
  apiToken: string | null;
}

export function YalidineForm({ apiId, apiToken }: YalidineFormProps) {
  const supabase = createClient();
  const [id, setId] = useState(apiId ?? "");
  const [token, setToken] = useState(apiToken ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ yalidine_api_id: id || null, yalidine_api_token: token || null })
      .eq("id", user.id);

    if (dbError) {
      setError("Erreur lors de la sauvegarde.");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={() => window.open("https://yalidine.app", "_blank")}
        className="text-[#10B981] text-[13px] bg-transparent border-0 cursor-pointer p-0 hover:underline"
      >
        Où trouver mes identifiants ?
      </button>

      <Input
        id="yalidine-api-id"
        label="Identifiant Yalidine"
        placeholder="Votre identifiant Yalidine"
        value={id}
        onChange={(e) => setId(e.target.value)}
        autoComplete="off"
      />
      <Input
        id="yalidine-api-token"
        label="Clé secrète Yalidine"
        type="password"
        placeholder="Votre clé secrète Yalidine"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        autoComplete="off"
      />

      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Credentials Yalidine sauvegardés.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement..." : "Sauvegarder"}
      </Button>
    </form>
  );
}
