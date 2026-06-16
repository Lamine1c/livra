-- Migration: 015_vendors_waitlist
-- Table d'attente vendeurs + OTP email pour le flow d'inscription founders.

-- ─────────────────────────────────────────────
-- Table: vendors_waitlist
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendors_waitlist (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        NOT NULL,
  full_name      TEXT,
  business_name  TEXT,
  wilaya         TEXT,
  password_hash  TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'verified', 'active')),
  founder_index  INT         UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at    TIMESTAMPTZ,
  activated_at   TIMESTAMPTZ,
  CONSTRAINT vendors_waitlist_email_unique UNIQUE (email)
);

-- RLS : accès exclusif via service role (API Next.js)
ALTER TABLE public.vendors_waitlist ENABLE ROW LEVEL SECURITY;
-- Aucune policy anon/authenticated — seule la service_role key peut lire/écrire

-- ─────────────────────────────────────────────
-- Table: otp_codes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts   INT         NOT NULL DEFAULT 0,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_codes_email_expires_idx
  ON public.otp_codes (email, expires_at);

-- RLS : accès exclusif via service role (API Next.js)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
-- Aucune policy anon/authenticated — seule la service_role key peut lire/écrire

-- ─────────────────────────────────────────────
-- RPC publique: get_founders_count()
-- Retourne le nombre de founders actifs (status='active' + founder_index IS NOT NULL)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_founders_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM public.vendors_waitlist
  WHERE status = 'active'
    AND founder_index IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_founders_count() TO anon, authenticated;
