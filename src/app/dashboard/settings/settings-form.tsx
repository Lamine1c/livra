"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Profile } from "@/types";

interface SettingsFormProps {
  profile: Profile | null;
  userEmail: string;
}

export function SettingsForm({ profile, userEmail }: SettingsFormProps) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [storeName, setStoreName] = useState(profile?.store_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      email: userEmail,
      full_name: fullName,
      store_name: storeName,
      phone,
      updated_at: new Date().toISOString(),
    });

    setSuccess(true);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Email" type="email" value={userEmail} disabled />
      <Input
        label="Nom complet"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <Input
        label="Nom de la boutique"
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
      />
      <Input
        label="Téléphone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+213 6XX XXX XXX"
      />
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Profil mis à jour avec succès.
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
