-- Migration: 013_meta_lead_ads
-- A) Étendre le CHECK constraint de orders.status pour inclure 'pending_confirmation'
-- B) Rendre orders.client_id nullable (leads Meta sans client préalable)
-- C) Ajouter colonnes à orders : source, meta_lead_id
-- D) Créer table public.meta_connections
-- E) Créer table public.meta_page_subscriptions
-- F) Créer table public.meta_lead_logs
-- G) RLS sur chaque table
-- H) Index utiles

-- ─── A) Extend orders.status CHECK ───────────────────────────────────────────
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'pending_confirmation',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'returned'
  ));

-- ─── B) Make orders.client_id nullable ───────────────────────────────────────
ALTER TABLE public.orders ALTER COLUMN client_id DROP NOT NULL;

-- ─── C) Add source + meta_lead_id to orders ──────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS meta_lead_id TEXT UNIQUE;

-- ─── D) meta_connections ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meta_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  meta_user_id     TEXT,
  access_token     TEXT NOT NULL,
  business_id      TEXT,
  connected_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_refresh_at  TIMESTAMPTZ
);

ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;

-- Service role: full access
CREATE POLICY "meta_connections_service_role_all" ON public.meta_connections
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated user: read/update their own row
CREATE POLICY "meta_connections_owner_select" ON public.meta_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meta_connections_owner_update" ON public.meta_connections
  FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meta_connections_owner_delete" ON public.meta_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- ─── E) meta_page_subscriptions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meta_page_subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id           TEXT NOT NULL,
  page_name         TEXT,
  page_access_token TEXT NOT NULL,
  subscribed_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  active            BOOLEAN DEFAULT FALSE NOT NULL,
  UNIQUE (user_id, page_id)
);

ALTER TABLE public.meta_page_subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role: full access
CREATE POLICY "meta_page_subs_service_role_all" ON public.meta_page_subscriptions
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated user: read their own subscriptions
CREATE POLICY "meta_page_subs_owner_select" ON public.meta_page_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ─── F) meta_lead_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meta_lead_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       TEXT NOT NULL,
  page_id       TEXT,
  form_id       TEXT,
  raw_payload   JSONB,
  order_id      UUID REFERENCES public.orders(id),
  status        TEXT NOT NULL CHECK (status IN ('received', 'order_created', 'error')),
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.meta_lead_logs ENABLE ROW LEVEL SECURITY;

-- Service role only — webhook processes these, no user-facing access
CREATE POLICY "meta_lead_logs_service_role_all" ON public.meta_lead_logs
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── H) Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meta_connections_user_id
  ON public.meta_connections (user_id);

CREATE INDEX IF NOT EXISTS idx_meta_page_subs_user_id
  ON public.meta_page_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_meta_page_subs_page_id
  ON public.meta_page_subscriptions (page_id);

CREATE INDEX IF NOT EXISTS idx_meta_page_subs_active
  ON public.meta_page_subscriptions (page_id, active)
  WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_meta_lead_logs_lead_id
  ON public.meta_lead_logs (lead_id);

CREATE INDEX IF NOT EXISTS idx_meta_lead_logs_status
  ON public.meta_lead_logs (lead_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_meta_lead_id
  ON public.orders (meta_lead_id)
  WHERE meta_lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_source
  ON public.orders (source)
  WHERE source IS NOT NULL;
