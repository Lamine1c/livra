-- 037 — W7 ROBUSTESSE · index deliveries(completed_at)
--
-- POURQUOI : la purge GPS (032_purge_delivery_positions) et recordMotoInsight filtrent
-- les livraisons clôturées par `completed_at` (`completed_at IS NOT NULL AND < now()-30j`).
-- `deliveries.completed_at` (006_deliveries_tracking.sql:15) n'est PAS indexé → seq-scan
-- à mesure que la table grossit (nit signalé au RAPPORT W7/PURGE-GPS). Index partiel : on
-- n'indexe QUE les lignes clôturées (celles que la purge/insight parcourent), le reste
-- (courses actives, completed_at NULL) reste hors index.
--
-- ⚠️ NE PAS appliquer via un outil — Lamine l'exécute dans le SQL Editor Supabase.
-- Additive uniquement : aucune route, aucune donnée touchée.

CREATE INDEX IF NOT EXISTS idx_deliveries_completed_at
  ON public.deliveries (completed_at)
  WHERE completed_at IS NOT NULL;
