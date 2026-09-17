-- 045 — N33W.3 · Fondations « rattrapage de vente » (winback) — NON appliquée
--
-- CONTEXTE : après un refus acheteur branche A (`not_available`) ou C (`found_cheaper`)
-- (cf. src/lib/confirm-order.ts:278 et :363), la commande reste VIVANTE (statut inchangé,
-- seul `decline_reason` est posé) → elle est RÉCUPÉRABLE. Ces tables/colonnes sont la fondation
-- INERTE du rattrapage : structure + garde-fou. AUCUN envoi automatique n'est câblé (ce lot ne
-- fait QUE le stockage) ; l'envoi réel + le template Meta « offre datée » viendront plus tard
-- (soumission Lamine — aucun template approuvé ne porte aujourd'hui un taux de remise + une date).
--
-- ⚠️ NE PAS appliquer via un outil — Lamine l'exécute dans le SQL Editor. Tant que ces objets
-- n'existent pas, l'endpoint /api/vendor/prepared-responses répond proprement « non disponible ».

-- Réponses préparées par le vendeur, une par motif de refus récupérable.
CREATE TABLE IF NOT EXISTS public.prepared_responses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  trigger_reason TEXT NOT NULL CHECK (trigger_reason IN ('not_available', 'found_cheaper')),
  body           TEXT,                                              -- copie libre optionnelle de la relance
  discount_rate  INTEGER CHECK (discount_rate IS NULL OR (discount_rate BETWEEN 0 AND 90)),  -- % remise (offre datée)
  validity_days  INTEGER CHECK (validity_days IS NULL OR (validity_days BETWEEN 1 AND 30)),   -- durée de validité de l'offre
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un seul modèle ACTIF par (vendeur, motif) : garantit une offre unique par motif (upsert simple).
CREATE UNIQUE INDEX IF NOT EXISTS uq_prepared_responses_owner_reason
  ON public.prepared_responses (user_id, trigger_reason) WHERE active;
CREATE INDEX IF NOT EXISTS idx_prepared_responses_user ON public.prepared_responses (user_id);

ALTER TABLE public.prepared_responses ENABLE ROW LEVEL SECURITY;
-- Le vendeur ne voit/écrit QUE ses propres réponses (backstop RLS ; l'endpoint filtre aussi par user_id).
CREATE POLICY "prepared_responses_owner_all" ON public.prepared_responses
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Garde-fou « 1 relance max / commande » : marqueur non-null = relance déjà envoyée pour cette commande.
-- Posé par le futur émetteur ; ici on ne fait qu'ajouter la colonne (inerte tant qu'aucun envoi n'existe).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS winback_sent_at TIMESTAMPTZ;
