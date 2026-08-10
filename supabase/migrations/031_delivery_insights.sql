-- Migration: 031_delivery_insights
-- Doctrine data (D9, 2 août 2026) : garder l'INSIGHT, jeter la PII. À la clôture de
-- CHAQUE livraison (les 3 canaux : moto perso, transporteur, refus client), on écrit
-- une ligne dérivée ANONYME, conservée à vie. La purge de delivery_positions viendra
-- plus tard (W7) au service de cette table — jamais l'inverse.
--
-- Décision W6 (contre la reco W5 « moto seul ») : les 3 modes, car le pain DZ n°1
-- (retours + refus) vit dans les modes transporteur/refus. Un NULL GPS n'est pas de
-- la dilution, c'est la réalité du mode → discriminé par la colonne `mode`.
--
-- 030 = lead_insights sur feat/retention-leads-90j (invisible depuis main) → ici 031.
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor.

CREATE TABLE IF NOT EXISTS public.delivery_insights (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode           TEXT NOT NULL CHECK (mode IN ('moto_perso', 'transporteur', 'refus_client')),
  wilaya         TEXT,
  commune        TEXT,
  geohash        TEXT,       -- moto_perso uniquement (NULL sinon). Précision grossière
                             -- (voir src/lib/delivery-insight.ts) : anti ré-identification.
  distance_m     INTEGER,    -- moto_perso uniquement : somme des segments GPS de
                             -- delivery_positions ; NULL si aucun point enregistré.
  duree_totale_s INTEGER,    -- création de l'order → clôture. TOUS modes (comparaison
                             -- inter-canaux : délai Yalidine par wilaya = insight premium).
  duree_course_s INTEGER,    -- départ de course → clôture. moto_perso uniquement.
  statut_final   TEXT,       -- delivered | returned | cancelled
  motif_echec    TEXT,       -- NULL si succès ; sinon reason/last_status/refus_whatsapp
  delivered_on   DATE,       -- fuseau Algérie UTC+1 (pas de DST) — calculé côté code.
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUCUN delivery_id / order_id / client_id / driver_id / nom / téléphone : la ligne
-- est anonyme et non ré-identifiable par jointure.

ALTER TABLE public.delivery_insights ENABLE ROW LEVEL SECURITY;

-- service_role uniquement (les 4 accroches écrivent en service/admin client).
CREATE POLICY "delivery_insights_service_role_all" ON public.delivery_insights
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_delivery_insights_mode         ON public.delivery_insights (mode);
CREATE INDEX IF NOT EXISTS idx_delivery_insights_wilaya       ON public.delivery_insights (wilaya);
CREATE INDEX IF NOT EXISTS idx_delivery_insights_delivered_on ON public.delivery_insights (delivered_on);
