-- 035 — LOT 13 · INGESTION UNIVERSELLE — étape 1 : le schéma commun
--
-- POURQUOI : toute commande, quelle que soit sa porte d'entrée (email catch-all, endpoint
-- générique d'agence, Shopify, Youcan), doit atterrir dans la même table orders SANS doublon.
-- Détail du lot : claude/INGESTION_COMMANDES.md (projet Claude).
--
-- DEUX CHOIX DE DESIGN, TRANCHÉS ICI (Claudy, 30 août 2026) :
--
-- 1) IDEMPOTENCE PAR INDEX UNIQUE PARTIEL, pas par contrainte pleine.
--    UNIQUE(user_id, source, external_order_id) WHERE external_order_id IS NOT NULL
--    → les lignes existantes (external_order_id NULL) ne bloquent RIEN : zéro backfill,
--      zéro risque sur la prod. Les nouvelles portes écrivent TOUJOURS external_order_id.
--    (Les commandes Meta gardent meta_lead_id UNIQUE — mécanisme existant, on n'y touche pas.)
--
-- 2) LA CLÉ API EST STOCKÉE EN HASH (sha256), JAMAIS EN CLAIR.
--    Leçon des tokens Meta en clair (dette 🔴 du handoff) : on ne recrée pas le même trou.
--    La clé n'est montrée qu'UNE fois au vendeur, à la création. Vérification côté serveur :
--    digest(clé_reçue) = api_key_hash. Révocation = revoked_at, régénération = nouvelle ligne.
--
-- ⚠️ NE PAS appliquer via un outil — Lamine l'exécute dans le SQL Editor Supabase.
-- Additive uniquement : ne touche ni au webhook leadgen ni à aucune route existante
-- (compatible fenêtre de review Meta).

-- ─── A) Idempotence sur orders ───────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS external_order_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_user_source_external
  ON public.orders (user_id, source, external_order_id)
  WHERE external_order_id IS NOT NULL;

-- ─── B) inbound_sources — une ligne par robinet connecté ─────────────────────
CREATE TABLE IF NOT EXISTS public.inbound_sources (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind                   TEXT NOT NULL CHECK (kind IN ('email','api','shopify','youcan')),
  -- porte email : le slug est l'identité (boutik-farid-x7k2@orders.golivra.app)
  email_slug             TEXT UNIQUE,
  -- portes api/shopify/youcan : hash sha256 hex de la clé/du secret partagé
  api_key_hash           TEXT,
  -- anti-injection porte email : seul ce domaine expéditeur est accepté (SPF/DKIM vérifiés)
  expected_sender_domain TEXT,
  label                  TEXT,                    -- nom lisible côté vendeur ("Ma boutique Shopify")
  active                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at             TIMESTAMPTZ,
  -- une porte a soit un slug (email), soit une clé (les 3 autres) — jamais ni l'un ni l'autre
  CONSTRAINT inbound_identity CHECK (
    (kind = 'email' AND email_slug IS NOT NULL)
    OR (kind <> 'email' AND api_key_hash IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_inbound_sources_user ON public.inbound_sources (user_id);
CREATE INDEX IF NOT EXISTS idx_inbound_sources_slug
  ON public.inbound_sources (email_slug) WHERE email_slug IS NOT NULL AND active;

-- ─── C) RLS — même doctrine que meta_connections (013) ───────────────────────
ALTER TABLE public.inbound_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbound_sources_service_role_all" ON public.inbound_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "inbound_sources_owner_select" ON public.inbound_sources
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- (écriture UNIQUEMENT via l'API serveur — génération de slug/clé, révocation ;
--  jamais d'INSERT direct depuis le client.)

-- ─── D) Journal de réception — le pendant de meta_lead_logs pour les 4 portes ─
CREATE TABLE IF NOT EXISTS public.inbound_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      UUID REFERENCES public.inbound_sources(id) ON DELETE SET NULL,
  user_id        UUID,
  kind           TEXT NOT NULL,
  external_ref   TEXT,                            -- n° de commande extrait / message-id
  status         TEXT NOT NULL CHECK (status IN ('received','order_created','rejected','error')),
  reject_reason  TEXT,                            -- 'bad_sender','bad_signature','rate_limited','duplicate','parse_failed'
  error_message  TEXT,
  order_id       UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- ⚠️ PAS de payload brut ici : l'email/webhook contient la PII de l'acheteur.
  -- Doctrine : on parse, on crée la commande, on jette. (≠ meta_lead_logs qui garde raw_payload.)
);

CREATE INDEX IF NOT EXISTS idx_inbound_events_source_time
  ON public.inbound_events (source_id, created_at DESC);

ALTER TABLE public.inbound_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inbound_events_service_role_all" ON public.inbound_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
