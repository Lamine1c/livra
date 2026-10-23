-- 048 — G5W · Trace des modifications de MONTANT COD (négociation vendeur) — NON appliquée
--
-- POURQUOI : le chemin officiel de modification d'une commande (POST /api/orders/[id]/adjust-amount)
-- change `orders.total_amount` (le COD réel). Un COD modifié SANS trace = une plainte client + zéro
-- audit. order_status_history (041) ne trace que les STATUTS ; il faut une trace dédiée pour l'argent.
-- Chaque ligne = un avant→après, avec l'auteur, l'horodatage et un motif optionnel. Le vendeur (et un
-- futur écran) doit pouvoir relire « le prix est passé de X à Y le Z ».
--
-- ⚠️ NON appliquée par cc (règle 4). Apply = Lamine via SQL Editor. ⚠️ PILE EN ATTENTE : 045+046+047+048.

CREATE TABLE IF NOT EXISTS public.order_amount_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_amount  numeric(12, 2) NOT NULL,
  new_amount  numeric(12, 2) NOT NULL,
  reason      text,
  changed_by  uuid,              -- user_id du vendeur (auth.uid()), pour l'audit
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_amount_history_order ON public.order_amount_history (order_id, created_at DESC);

ALTER TABLE public.order_amount_history ENABLE ROW LEVEL SECURITY;
-- Le vendeur lit/écrit la trace de SES commandes (via la commande parente), comme order_items.
CREATE POLICY "order_amount_history_owner" ON public.order_amount_history
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_amount_history.order_id AND o.user_id = auth.uid()));
