-- Formalise les tables deliveries et delivery_positions créées manuellement.
-- À appliquer via Supabase Studio → SQL Editor (pas supabase db push : données existantes).
-- Si les tables existent déjà, les CREATE TABLE IF NOT EXISTS + ALTER TABLE sont idempotents.

-- ── deliveries ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.deliveries (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id        uuid,
  status           text        NOT NULL DEFAULT 'active',
  last_lat         double precision,
  last_lng         double precision,
  last_position_at timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deliveries_status_check CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Si la table existait sans certaines colonnes, les ajouter idempotentement
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS status           text        NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_lat         double precision,
  ADD COLUMN IF NOT EXISTS last_lng         double precision,
  ADD COLUMN IF NOT EXISTS last_position_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at     timestamptz;

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id  ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON public.deliveries(driver_id);

-- ── delivery_positions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.delivery_positions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid        NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  lat         double precision NOT NULL,
  lng         double precision NOT NULL,
  accuracy_m  double precision,
  speed_mps   double precision,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_positions_delivery_id
  ON public.delivery_positions(delivery_id, created_at DESC);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Writes passent uniquement par /api/driver/position (service role, bypass RLS).
-- Anon peut SELECT pour la page de tracking publique + Realtime browser.

ALTER TABLE public.deliveries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read deliveries"         ON public.deliveries;
DROP POLICY IF EXISTS "Public can read delivery_positions" ON public.delivery_positions;

CREATE POLICY "Public can read deliveries"
  ON public.deliveries FOR SELECT
  USING (true);

CREATE POLICY "Public can read delivery_positions"
  ON public.delivery_positions FOR SELECT
  USING (true);

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Nécessaire pour que moto-perso-tracker.tsx reçoive les UPDATE events.

ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_positions;
