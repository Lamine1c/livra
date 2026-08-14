-- Migration: 030_lead_insights
-- Rétention 90 j des leads Meta non convertis + insight anonyme conservé à vie.
-- Doctrine data (Lamine, 10 août 2026) : garder l'insight, jeter la PII.
--
-- A) Table public.lead_insights — ligne anonyme, NON ré-identifiable (aucun nom,
--    téléphone, client_id, order_id, lead_id/leadgen_id). Les IDs de campagne
--    (page_id/form_id/ad_id) sont des identifiants de campagne, pas de personne.
-- B) RLS service_role uniquement.
-- C) Fonction public.purge_expired_leads(p_dry) — passe UNIQUE par lead, log = pivot,
--    atomique (FOR UPDATE) et idempotente. now() côté DB (fuseau neutralisé).
--
-- ⚠️ NON appliquée par cc (règle 4). Apply + gate dry-run = Lamine, via SQL Editor.

-- ─── A) lead_insights ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_insights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wilaya           TEXT,                       -- NULL pour un lead jamais transformé en order
  page_id          TEXT,                       -- NULL pour le filet (order sans log)
  form_id          TEXT,                       -- NULL pour le filet (order sans log)
  ad_id            TEXT,                       -- lu depuis meta_lead_logs.raw_payload->>'ad_id'
  lead_created_on  DATE,                       -- date de réception (pas de timestamp précis)
  purged_on        DATE,
  outcome          TEXT NOT NULL CHECK (outcome IN ('converted', 'not_converted', 'never_created')),
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.lead_insights ENABLE ROW LEVEL SECURITY;

-- ─── B) RLS — service_role uniquement (V1, pas d'accès user) ──────────────────
CREATE POLICY "lead_insights_service_role_all" ON public.lead_insights
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index d'analyse (campagne + destin)
CREATE INDEX IF NOT EXISTS idx_lead_insights_outcome ON public.lead_insights (outcome);
CREATE INDEX IF NOT EXISTS idx_lead_insights_campaign ON public.lead_insights (page_id, form_id);

-- ─── C) Fonction de purge — passe unique par lead, log = pivot ────────────────
-- Ordre imposé par les FK (meta_lead_logs.order_id → orders, orders.client_id →
-- clients, toutes deux sans ON DELETE) : insight → delete log → delete order →
-- delete client. Tout dans UNE transaction ; chaque log/order verrouillé FOR
-- UPDATE ⇒ une confirmation vendeur concurrente ne peut pas produire un insight
-- incohérent. p_dry=true : classe et compte, n'écrit/ne supprime RIEN.
CREATE OR REPLACE FUNCTION public.purge_expired_leads(p_dry BOOLEAN DEFAULT FALSE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff             TIMESTAMPTZ := NOW() - INTERVAL '90 days';
  v_log                RECORD;
  v_order              RECORD;
  v_wilaya             TEXT;
  v_ad_id              TEXT;
  n_converted          INT := 0;
  n_not_converted      INT := 0;
  n_never_created      INT := 0;
  n_skipped_recent     INT := 0;
  n_orphan_log         INT := 0;
  n_filet              INT := 0;
BEGIN
  -- ── Passe 1 : itère sur les logs > 90 j (le log est le pivot) ──
  FOR v_log IN
    SELECT id, page_id, form_id, order_id, raw_payload, created_at
    FROM public.meta_lead_logs
    WHERE created_at < v_cutoff
    ORDER BY created_at
    FOR UPDATE
  LOOP
    v_ad_id := v_log.raw_payload->>'ad_id';

    -- (1) Aucun order lié (received / error) → never_created, wilaya NULL
    IF v_log.order_id IS NULL THEN
      IF NOT p_dry THEN
        INSERT INTO public.lead_insights
          (wilaya, page_id, form_id, ad_id, lead_created_on, purged_on, outcome)
        VALUES
          (NULL, v_log.page_id, v_log.form_id, v_ad_id, v_log.created_at::date, NOW()::date, 'never_created');
        DELETE FROM public.meta_lead_logs WHERE id = v_log.id;
      END IF;
      n_never_created := n_never_created + 1;
      CONTINUE;
    END IF;

    -- Verrou sur l'order lié
    SELECT id, status, client_id, created_at
      INTO v_order
      FROM public.orders
      WHERE id = v_log.order_id
      FOR UPDATE;

    -- (2) Ref pendante (impossible sous la FK) → on jette le log orphelin, pas d'insight
    IF NOT FOUND THEN
      IF NOT p_dry THEN
        DELETE FROM public.meta_lead_logs WHERE id = v_log.id;
      END IF;
      n_orphan_log := n_orphan_log + 1;
      CONTINUE;
    END IF;

    IF v_order.status = 'pending_confirmation' THEN
      -- (3edge) order encore jeune (< 90 j) → on saute, il repassera
      IF v_order.created_at >= v_cutoff THEN
        n_skipped_recent := n_skipped_recent + 1;
        CONTINUE;
      END IF;

      -- (3) non converti → insight not_converted (wilaya via client)
      SELECT wilaya INTO v_wilaya FROM public.clients WHERE id = v_order.client_id;
      IF NOT p_dry THEN
        INSERT INTO public.lead_insights
          (wilaya, page_id, form_id, ad_id, lead_created_on, purged_on, outcome)
        VALUES
          (v_wilaya, v_log.page_id, v_log.form_id, v_ad_id, v_log.created_at::date, NOW()::date, 'not_converted');
        DELETE FROM public.meta_lead_logs WHERE id = v_log.id;          -- libère la FK
        DELETE FROM public.orders WHERE id = v_order.id AND status = 'pending_confirmation';
        DELETE FROM public.clients c
          WHERE c.id = v_order.client_id
            AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.client_id = c.id);
      END IF;
      n_not_converted := n_not_converted + 1;

    ELSE
      -- (4) converti : le vendeur a agi (confirmé/expédié/livré/annulé). On NE
      --     touche NI l'order NI le client — on ne purge que le log technique.
      SELECT wilaya INTO v_wilaya FROM public.clients WHERE id = v_order.client_id;
      IF NOT p_dry THEN
        INSERT INTO public.lead_insights
          (wilaya, page_id, form_id, ad_id, lead_created_on, purged_on, outcome)
        VALUES
          (v_wilaya, v_log.page_id, v_log.form_id, v_ad_id, v_log.created_at::date, NOW()::date, 'converted');
        DELETE FROM public.meta_lead_logs WHERE id = v_log.id;
      END IF;
      n_converted := n_converted + 1;
    END IF;
  END LOOP;

  -- ── Passe 2 : filet — orders meta non convertis > 90 j SANS log (théoriquement
  --    impossible). Best-effort, sans champs campagne (page_id/form_id NULL). ──
  FOR v_order IN
    SELECT o.id, o.client_id, o.created_at
    FROM public.orders o
    WHERE o.source = 'meta_lead_ads'
      AND o.status = 'pending_confirmation'
      AND o.created_at < v_cutoff
      AND NOT EXISTS (SELECT 1 FROM public.meta_lead_logs l WHERE l.order_id = o.id)
    FOR UPDATE
  LOOP
    SELECT wilaya INTO v_wilaya FROM public.clients WHERE id = v_order.client_id;
    IF NOT p_dry THEN
      INSERT INTO public.lead_insights
        (wilaya, page_id, form_id, ad_id, lead_created_on, purged_on, outcome)
      VALUES
        (v_wilaya, NULL, NULL, NULL, v_order.created_at::date, NOW()::date, 'not_converted');
      DELETE FROM public.orders WHERE id = v_order.id AND status = 'pending_confirmation';
      DELETE FROM public.clients c
        WHERE c.id = v_order.client_id
          AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.client_id = c.id);
    END IF;
    n_filet := n_filet + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'dry',                 p_dry,
    'cutoff',              v_cutoff,
    'converted',           n_converted,
    'not_converted',       n_not_converted,
    'never_created',       n_never_created,
    'skipped_recent',      n_skipped_recent,
    'orphan_log',          n_orphan_log,
    'filet_not_converted', n_filet
  );
END;
$$;

-- La fonction n'est appelable QUE par le service_role (cron), jamais anon/authenticated.
REVOKE ALL ON FUNCTION public.purge_expired_leads(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_leads(BOOLEAN) TO service_role;
