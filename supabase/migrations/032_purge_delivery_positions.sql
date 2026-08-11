-- Migration: 032_purge_delivery_positions
-- Tient la promesse de la politique : « Position GPS purgée automatiquement 30 jours
-- après la livraison. » L'insight de la course est déjà écrit à la clôture (W6,
-- delivery_insights) → purger delivery_positions ne perd aucune donnée d'analyse.
--
-- Colonne de clôture FIABLE (vérifiée au grep) : deliveries.completed_at, posée par
-- TOUS les chemins de clôture (driver/complete-delivery:100, driver/cancel-delivery:76,
-- orders/[id]/cancel-delivery:63), jamais NULL sur une course clôturée. Statuts finaux
-- deliveries : 'completed' | 'cancelled' (006/008 CHECK).
--
-- ⚠️ NON appliquée par cc (règle 4). Apply + gate dry-run = Lamine via SQL Editor.

CREATE OR REPLACE FUNCTION public.purge_expired_positions(p_dry BOOLEAN DEFAULT FALSE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff  TIMESTAMPTZ := NOW() - INTERVAL '30 days';
  v_count   BIGINT := 0;
BEGIN
  -- Cible : positions d'une livraison CLÔTURÉE (completed/cancelled) dont la clôture
  -- date de PLUS de 30 jours. Garde-fou intégral : une course non clôturée (status
  -- 'active', ou completed_at NULL) n'est JAMAIS touchée, quel que soit son âge.
  -- La condition `completed_at < now()-30j` rend une collision avec une clôture
  -- concurrente IMPOSSIBLE : une course qui se clôt maintenant a completed_at ≈ now,
  -- donc jamais < cutoff.
  IF p_dry THEN
    SELECT COUNT(*) INTO v_count
    FROM public.delivery_positions dp
    JOIN public.deliveries d ON d.id = dp.delivery_id
    WHERE d.status IN ('completed', 'cancelled')
      AND d.completed_at IS NOT NULL
      AND d.completed_at < v_cutoff;
  ELSE
    WITH victims AS (
      SELECT dp.id
      FROM public.delivery_positions dp
      JOIN public.deliveries d ON d.id = dp.delivery_id
      WHERE d.status IN ('completed', 'cancelled')
        AND d.completed_at IS NOT NULL
        AND d.completed_at < v_cutoff
    )
    DELETE FROM public.delivery_positions dp
    USING victims v
    WHERE dp.id = v.id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object('dry', p_dry, 'cutoff', v_cutoff, 'deleted', v_count);
END;
$$;

-- Appelable UNIQUEMENT par le service_role (cron), jamais anon/authenticated.
REVOKE ALL ON FUNCTION public.purge_expired_positions(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_positions(BOOLEAN) TO service_role;
