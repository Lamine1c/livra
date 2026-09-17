-- 044 — N32W.3 · Index (optionnel, perf) pour le compteur Trust Layer
--
-- POURQUOI : GET /api/vendor/trust-layer agrège les « commandes évitées » du mois par vendeur :
--   WHERE user_id = ? AND updated_at >= <début de mois> AND (status='cancelled' OR decline_reason IS NOT NULL)
-- Index partiel ciblant exactement ces lignes (annulées/refusées) → scan borné même quand la
-- table orders grossit. Sans lui l'endpoint FONCTIONNE (agrégation JS, volume mensuel borné) —
-- c'est une optimisation, pas une dépendance.
--
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor.

CREATE INDEX IF NOT EXISTS idx_orders_avoided_by_vendor
  ON public.orders (user_id, updated_at)
  WHERE status = 'cancelled' OR decline_reason IS NOT NULL;
