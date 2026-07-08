-- Migration: 025_billing_subscription
-- À appliquer manuellement via Supabase Studio (SQL Editor), comme les autres.
-- Abonnement vendeur (Chargily Pay v2) : statut, échéance, id client Chargily,
-- + table d'idempotence des webhooks (un checkout payé = un seul crédit de 30 jours).

-- ─────────────────────────────────────────────
-- vendors_waitlist : colonnes billing
-- ─────────────────────────────────────────────
ALTER TABLE public.vendors_waitlist
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial';

ALTER TABLE public.vendors_waitlist
  ADD COLUMN IF NOT EXISTS paid_until timestamptz;

ALTER TABLE public.vendors_waitlist
  ADD COLUMN IF NOT EXISTS chargily_customer_id text;

-- ─────────────────────────────────────────────
-- billing_events : idempotence webhook
-- PK = id du checkout Chargily déjà traité. L'INSERT échoue (23505) si le
-- webhook a déjà été traité → on répond 200 sans re-créditer.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.billing_events (
  checkout_id  text        PRIMARY KEY,
  event_type   text        NOT NULL,
  vendor_id    uuid,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- RLS : accès exclusif via service role (API Next.js), comme vendors_waitlist
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
-- Aucune policy anon/authenticated — seule la service_role key peut lire/écrire
