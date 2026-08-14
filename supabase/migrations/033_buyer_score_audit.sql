-- Migration: 033_buyer_score_audit
-- LOT12 phase 1 — OBSERVER (pas encore sanctionner). Le contrat de /api/orders/buyer-score
-- ne bouge pas (numéro en entrée) ; toute la défense anti-énumération vit côté serveur.
-- On installe les YEUX : un log d'audit + des canaris. La sanction (quota/dégradation)
-- viendra en phase 2, calibrée sur des chiffres réels.
--
-- 030/031/032 sont pris sur feat/retention-leads-90j et feat/agregat-livraison
-- (invisibles depuis main) → ici 033.
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor.

-- ─── A) buyer_score_lookups : journal d'audit ────────────────────────────────
-- JAMAIS le numéro en clair. phone_hash = HMAC-SHA256(sel serveur, numéro normalisé)
-- (voir src/lib/buyer-score-audit.ts). Un log d'audit ne doit pas devenir la base
-- qu'on protège : sans le sel (env, jamais commité), le hash n'est pas ré-inversible
-- même sur la petite plage des numéros DZ.
CREATE TABLE IF NOT EXISTS public.buyer_score_lookups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_hash  TEXT NOT NULL,
  level       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Volume par vendeur sur fenêtre glissante + dédup canari par (user, hash, jour).
CREATE INDEX IF NOT EXISTS idx_buyer_score_lookups_user_created
  ON public.buyer_score_lookups (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_buyer_score_lookups_user_hash_created
  ON public.buyer_score_lookups (user_id, phone_hash, created_at);

ALTER TABLE public.buyer_score_lookups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_score_lookups_service_role_all" ON public.buyer_score_lookups
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── B) buyer_score_canaries : numéros pièges ────────────────────────────────
-- Des numéros normalisés qui ne correspondent à AUCUN acheteur réel. Un vrai client
-- ne peut pas les avoir → toute consultation d'un canari = preuve d'énumération,
-- zéro faux positif. La table est créée VIDE : Lamine sèmera les numéros au gate
-- (ne pas les inventer ici). phone_normalized en clair = données opérationnelles de
-- piège, pas le graphe de réputation qu'on protège.
CREATE TABLE IF NOT EXISTS public.buyer_score_canaries (
  phone_normalized TEXT PRIMARY KEY,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.buyer_score_canaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_score_canaries_service_role_all" ON public.buyer_score_canaries
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
