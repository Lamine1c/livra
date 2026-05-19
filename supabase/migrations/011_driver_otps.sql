-- Migration: 011_driver_otps
-- Stockage temporaire des OTP en attente de vérification.
-- Chaque ligne expire après 10 min et est supprimée après usage (single-use).

CREATE TABLE IF NOT EXISTS public.driver_otps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp       TEXT NOT NULL UNIQUE,
  prenom         TEXT NOT NULL,
  wilaya         TEXT NOT NULL,
  couleur_casque TEXT NOT NULL,
  device_id      TEXT NOT NULL,
  otp_hash       TEXT NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Nettoyage automatique des OTP expirés (cron Supabase ou pg_cron si dispo)
-- Pour l'instant : la route verify-otp supprime le record après usage,
-- les records expirés sont ignorés par la query (WHERE expires_at > NOW()).

-- RLS : accès exclusif via service role (API Next.js)
ALTER TABLE public.driver_otps ENABLE ROW LEVEL SECURITY;
-- Aucune policy client — seule la service role key peut lire/écrire
